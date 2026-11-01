/**
 * INIMIGOS: CARANGUEJOS ESPACIAIS DE SICRON 9
 * Arquivo: src/crabs.js
 */
import { CONFIG } from './config.js';

export class CrabManager {
  constructor() {
    this.crabs = [];
    this.spawnTimer = 0;
    this.accumulatedSpawnCount = 2;
  }

  updateTimer(deltaTimeSeconds) {
    this.spawnTimer += deltaTimeSeconds;
    if (this.spawnTimer >= 60) {
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

  update(magman, terrain, onMagmanCaught) {
    for (let i = 0; i < this.crabs.length; i++) {
      const crab = this.crabs[i];
      crab.update(magman, terrain, this.crabs);

      if (!crab.isStuckDeep && this.checkCollision(crab, magman)) {
        onMagmanCaught("Você foi eliminado por um caranguejo espacial alienígena!");
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
  }

  update(magman, terrain, allCrabs) {
    this.legCycle += 0.2;

    if (!this.isStuckDeep) {
      this.direction = magman.x > this.x ? 1 : -1;
      this.vx = this.speed * this.direction;
    } else {
      this.vx = 0;
    }

    this.x += this.vx;

    this.vy += CONFIG.GRAVITY || 0.38;
    this.y += this.vy;
    this.isGrounded = false;

    // Colisão segura com os blocos
    const handleBlockCollision = (b) => {
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

      if (
        this.x < b.x + b.size &&
        this.x + this.width > b.x &&
        this.y < b.y + b.size &&
        this.y + this.height - 8 > b.y
      ) {
        if (this.vx > 0) this.x = b.x - this.width;
        if (this.vx < 0) this.x = b.x + b.size;
      }
    };

    if (terrain && typeof terrain.forEachActiveBlockNear === 'function') {
      terrain.forEachActiveBlockNear(this.x, this.y, handleBlockCollision);
    } else if (terrain && Array.isArray(terrain.blocks)) {
      terrain.blocks.filter(b => b.active).forEach(handleBlockCollision);
    }

    // Empilhamento em fossas
    const groundLevelY = terrain?.groundStartY || 0;
    if (this.y > groundLevelY + 10) {
      allCrabs.forEach(other => {
        if (other !== this && Math.abs(other.x - this.x) < 20) {
          if (
            this.y + this.height >= other.y &&
            this.y + this.height <= other.y + 16 &&
            this.vy >= 0
          ) {
            this.y = other.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
          }
        }
      });

      this.isStuckDeep = this.y > groundLevelY;
    } else {
      this.isStuckDeep = false;
    }
  }

  render(ctx, cameraX) {
    const rx = this.x - cameraX;
    const ry = this.y;

    ctx.save();

    const legOffset = Math.sin(this.legCycle) * 4;
    ctx.strokeStyle = this.color === '#eab308' ? '#ca8a04' : '#64748b';
    ctx.lineWidth = 2;

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(rx + 6, ry + 16 + (i * 5));
      ctx.lineTo(rx - 6, ry + 22 + (i * 4) + (i % 2 === 0 ? legOffset : -legOffset));
      ctx.stroke();
    }

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(rx + this.width - 6, ry + 16 + (i * 5));
      ctx.lineTo(rx + this.width + 6, ry + 22 + (i * 4) + (i % 2 === 0 ? -legOffset : legOffset));
      ctx.stroke();
    }

    ctx.fillStyle = this.color;
    ctx.fillRect(rx + 2, ry + 8, this.width - 4, 20);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rx + 2, ry + 8, this.width - 4, 20);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(rx + 6, ry + 13, this.width - 12, 3);
    ctx.fillRect(rx + 8, ry + 19, this.width - 16, 3);

    ctx.fillStyle = "#ef4444";
    if (this.direction > 0) {
      ctx.fillRect(rx + this.width - 8, ry + 10, 4, 4);
    } else {
      ctx.fillRect(rx + 4, ry + 10, 4, 4);
    }

    ctx.fillStyle = this.color;
    const clawX = this.direction > 0 ? rx + this.width - 2 : rx - 8;
    ctx.fillRect(clawX, ry + 6, 8, 10);
    ctx.strokeRect(clawX, ry + 6, 8, 10);

    ctx.restore();
  }
}