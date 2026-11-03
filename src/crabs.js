/**
 * INIMIGOS: CARANGUEJOS ESPACIAIS DE SICRON 9 (IA COM FUGA TEMPORIZADA DE 10S)
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
      if (!crab.isStuckDeep && !magman.isInvulnerable && this.checkCollision(crab, magman)) {
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
    this.isStuckDeep = false;

    // Cronômetro Individual de Fuga (10 Segundos)
    this.isTrapped = false;
    this.trappedTimer = 0;
    this.isLeapingOut = false;
  }

  update(magman, terrain, allCrabs, dt) {
    this.legCycle += 0.2;

    const groundLevelY = terrain?.groundStartY || 0;
    const inHole = this.y > groundLevelY + 8;

    // 1. MONITORAMENTO INDIVIDUAL DO TEMPO NO BURACO
    if (inHole && !this.isLeapingOut) {
      if (!this.isTrapped) {
        // Entrou na fossa agora: inicia a contagem regressiva de 10s
        this.isTrapped = true;
        this.trappedTimer = 10.0;
      } else {
        // Desconta o tempo restante
        this.trappedTimer -= dt;

        // Ao esgotar os 10 segundos, executa o grande salto de escape
        if (this.trappedTimer <= 0) {
          this.vy = -10.8; // Força vertical suficiente para saltar de fossas de até 3 blocos
          this.vx = this.direction * 3.2; // Projeção horizontal para a borda
          this.isTrapped = false;
          this.trappedTimer = 0;
          this.isLeapingOut = true;
          this.isStuckDeep = false;
        }
      }
    } else if (!inHole && this.isGrounded) {
      // Quando já estiver com os pés firmes na superfície, normaliza os estados
      this.isTrapped = false;
      this.trappedTimer = 0;
      this.isLeapingOut = false;
    }

    // 2. MOVIMENTAÇÃO HORIZONTAL
    if (this.isTrapped && !this.isLeapingOut) {
      // Preso no fundo: movimenta-se devagar agitado contra as paredes
      this.direction = magman.x > this.x ? 1 : -1;
      this.vx = (this.speed * 0.45) * this.direction;
      this.isStuckDeep = true;
    } else if (!this.isLeapingOut) {
      this.direction = magman.x > this.x ? 1 : -1;
      this.vx = this.speed * this.direction;
      this.isStuckDeep = false;
    }

    this.x += this.vx;

    // Gravidade
    this.vy += CONFIG.GRAVITY || 0.38;
    this.y += this.vy;
    this.isGrounded = false;

    // 3. FÍSICA E COLISÃO COM OS BLOCOS
    const handleBlockCollision = (b) => {
      // Pouso em bloco
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

      // Barreira de paredes: só trava se NÃO estiver no meio do salto de saída
      if (!this.isLeapingOut) {
        if (
          this.x < b.x + b.size &&
          this.x + this.width > b.x &&
          this.y < b.y + b.size &&
          this.y + this.height - 8 > b.y
        ) {
          if (this.vx > 0) this.x = b.x - this.width;
          if (this.vx < 0) this.x = b.x + b.size;
        }
      }
    };

    if (terrain && typeof terrain.forEachActiveBlockNear === 'function') {
      terrain.forEachActiveBlockNear(this.x, this.y, handleBlockCollision);
    } else if (terrain && Array.isArray(terrain.blocks)) {
      terrain.blocks.filter(b => b.active).forEach(handleBlockCollision);
    }

    // 4. COLISÃO ENTRE CARANGUEJOS DENTRO DO MESMO BURACO
    if (inHole) {
      allCrabs.forEach(other => {
        if (other !== this && Math.abs(other.x - this.x) < 22) {
          if (
            this.y + this.height >= other.y &&
            this.y + this.height <= other.y + 14 &&
            this.vy >= 0
          ) {
            this.y = other.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
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

    // Efeito visual de alerta: quando faltam menos de 2.5s para pular, os olhos piscam em amarelo/laranja
    let eyeColor = "#ef4444";
    if (this.isTrapped && this.trappedTimer < 2.5) {
      eyeColor = Math.floor(this.trappedTimer * 8) % 2 === 0 ? "#facc15" : "#ea580c";
    }

    ctx.fillStyle = eyeColor;
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

    // Indicador sutil de carregamento do salto sobre a cabeça do caranguejo aprisionado
    if (this.isTrapped && this.trappedTimer > 0) {
      const barW = 20;
      const progress = 1 - (this.trappedTimer / 10.0);
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.fillRect(rx + (this.width / 2) - (barW / 2), ry - 6, barW, 3);
      ctx.fillStyle = progress > 0.75 ? "#facc15" : "#38bdf8";
      ctx.fillRect(rx + (this.width / 2) - (barW / 2), ry - 6, barW * progress, 3);
    }

    ctx.restore();
  }
}