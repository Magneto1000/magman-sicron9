/**
 * INIMIGOS: CARANGUEJOS ESPACIAIS DE SICRON 9 (IA COM FUGA POR EMPILHAMENTO/ZOMBIE PILE)
 * Arquivo: src/crabs.js
 */
import { CONFIG } from './config.js';

export class CrabManager {
  constructor() {
    this.crabs = [];
    this.spawnTimer = 0;
    this.accumulatedSpawnCount = 2;
    this.lastDelta = 0.016;
  }

  // Adicione dentro de CrabManager
  spawnFromExplodedBlock(x, y) {
    const colors = ['#cbd5e1', '#eab308'];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const crab = new SpaceCrab(x, y - 10, direction, color);
    
    // Dá um leve salto vertical para simular a explosão antes de cair
    crab.vy = -4.0; 
    
    this.crabs.push(crab);
  }
  
  // Acumula novas levas de caranguejos a cada 30 segundos
  updateTimer(deltaTimeSeconds) {
    this.lastDelta = deltaTimeSeconds;
    this.spawnTimer += deltaTimeSeconds;
    if (this.spawnTimer >= 30) {
      this.spawnTimer = 0;
      this.accumulatedSpawnCount += 2;
    }
  }

  spawnWave(cameraX, viewportWidth, groundY) {
    const leftX = cameraX - 80 - Math.random() * 60;
    const rightX = cameraX + viewportWidth + 80 + Math.random() * 60;
    const colors = ['#cbd5e1', '#eab308'];

    this.crabs.push(new SpaceCrab(leftX, groundY - 45, 1, colors[Math.floor(Math.random() * colors.length)]));
    this.crabs.push(new SpaceCrab(rightX, groundY - 45, -1, colors[Math.floor(Math.random() * colors.length)]));
  }

  update(magman, terrain, onMagmanCaught, deltaSec) {
    const dt = deltaSec || this.lastDelta || 0.016;

    for (let i = 0; i < this.crabs.length; i++) {
      const crab = this.crabs[i];
      crab.update(magman, terrain, this.crabs, dt);

      // Causa dano se colidir e Magman não estiver imune
      if (!magman.isInvulnerable && this.checkCollision(crab, magman)) {
        onMagmanCaught("Você foi ferido por um caranguejo alienígena de Sicron!");
        return;
      }
    }
  }

  checkCollision(crab, magman) {
    return (
      crab.x < magman.x + magman.width - 4 &&
      crab.x + crab.width > magman.x + 4 &&
      crab.y < magman.y + magman.height - 4 &&
      crab.y + crab.height > magman.y + 4
    );
  }

  render(ctx, cameraX) {
    this.crabs.forEach(crab => crab.render(ctx, cameraX));
  }
}

class SpaceCrab {
  constructor(x, y, initialDirection, color) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 36;
    this.vx = 0;
    this.vy = 0;
    this.speed = 1.6;
    this.direction = initialDirection;
    this.color = color;
    this.legCycle = 0;
    this.isGrounded = false;
    
    // Cooldown para evitar que o caranguejo pule a cada frame quando bater na parede
    this.jumpCooldown = 0;
  }

  update(magman, terrain, allCrabs, dt) {
    this.legCycle += 0.2;
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);

    const groundLevelY = terrain?.groundStartY || 0;
    const inHole = this.y > groundLevelY + 8;

    // 1. MOVIMENTAÇÃO HORIZONTAL CONTÍNUA (Sempre tenta ir até o jogador para acumular nas bordas)
    this.direction = magman.x > this.x ? 1 : -1;
    this.vx = this.speed * this.direction;

    this.x += this.vx;

    // 2. GRAVIDADE
    this.vy += CONFIG.GRAVITY || 0.38;
    this.y += this.vy;
    this.isGrounded = false;

    // 3. FÍSICA E COLISÃO COM OS BLOCOS
    const handleBlockCollision = (b) => {
      // Colisão de Pouso (Chão)
      if (
        this.x + this.width > b.x &&
        this.x < b.x + b.size &&
        this.y + this.height >= b.y &&
        this.y + this.height <= b.y + 16 &&
        this.vy >= 0
      ) {
        this.y = b.y - this.height;
        this.vy = 0;
        this.isGrounded = true;
      }

      // Barreira de paredes (Colisão lateral)
      if (
        this.x < b.x + b.size &&
        this.x + this.width > b.x &&
        this.y < b.y + b.size &&
        this.y + this.height - 8 > b.y
      ) {
        // Empurra o caranguejo para fora da parede
        if (this.vx > 0) this.x = b.x - this.width;
        if (this.vx < 0) this.x = b.x + b.size;

        // LÓGICA DE FUGA: Se bater na parede e estiver no chão (ou sobre outro caranguejo), ele pula.
        if (this.isGrounded && this.jumpCooldown <= 0) {
          // A força de -6.2 é o "sweet spot": forte para pular 1 bloco sozinho, 
          // mas fraca para 2 blocos, forçando-os a formar a pilha de 3+ caranguejos.
          this.vy = -6.2; 
          this.isGrounded = false;
          this.jumpCooldown = 0.5; // Aguarda meio segundo antes de conseguir pular de novo
        }
      }
    };

    if (terrain && typeof terrain.forEachActiveBlockNear === 'function') {
      terrain.forEachActiveBlockNear(this.x, this.y, handleBlockCollision);
    } else if (terrain && Array.isArray(terrain.blocks)) {
      terrain.blocks.filter(b => b.active).forEach(handleBlockCollision);
    }

    // 4. MECÂNICA DE EMPILHAMENTO (ZOMBIE PILE) DENTRO DO BURACO
    if (inHole) {
      allCrabs.forEach(other => {
        if (other !== this && Math.abs(other.x - this.x) < 22) {
          // Se cair em cima de outro caranguejo, ele "pousa" nas costas dele
          if (
            this.y + this.height >= other.y &&
            this.y + this.height <= other.y + 14 &&
            this.vy >= 0
          ) {
            this.y = other.y - this.height; // Fica exatamente em cima
            this.vy = 0;
            this.isGrounded = true; // Isso permite que o caranguejo do topo execute o pulo!
          }
        }
      });
    }
  }

  render(ctx, cameraX) {
    const rx = this.x - cameraX;
    const ry = this.y;

    ctx.save();

    const legOffset = Math.sin(this.legCycle) * 4;
    ctx.strokeStyle = this.color === '#eab308' ? '#ca8a04' : '#64748b';
    ctx.lineWidth = 2;

    // Patas esquerdas
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(rx + 6, ry + 16 + (i * 5));
      ctx.lineTo(rx - 6, ry + 22 + (i * 4) + (i % 2 === 0 ? legOffset : -legOffset));
      ctx.stroke();
    }

    // Patas direitas
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(rx + this.width - 6, ry + 16 + (i * 5));
      ctx.lineTo(rx + this.width + 6, ry + 22 + (i * 4) + (i % 2 === 0 ? -legOffset : legOffset));
      ctx.stroke();
    }

    // Carapaça blindada
    ctx.fillStyle = this.color;
    ctx.fillRect(rx + 2, ry + 8, this.width - 4, 20);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rx + 2, ry + 8, this.width - 4, 20);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(rx + 6, ry + 13, this.width - 12, 3);
    ctx.fillRect(rx + 8, ry + 19, this.width - 16, 3);

    // Olhos
    ctx.fillStyle = "#ef4444";
    if (this.direction > 0) {
      ctx.fillRect(rx + this.width - 8, ry + 10, 4, 4);
    } else {
      ctx.fillRect(rx + 4, ry + 10, 4, 4);
    }

    // Pinças
    ctx.fillStyle = this.color;
    const clawX = this.direction > 0 ? rx + this.width - 2 : rx - 8;
    ctx.fillRect(clawX, ry + 6, 8, 10);
    ctx.strokeRect(clawX, ry + 6, 8, 10);

    ctx.restore();
  }
}