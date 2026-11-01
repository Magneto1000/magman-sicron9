/**
 * AVATAR MAGMAN COM 3 VIDAS E LUVAS PRETAS
 * Arquivo: src/magman.js
 */
import { CONFIG } from './config.js';

export class Magman {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;
    this.width = 30;
    this.height = 54;
    this.vx = 0;
    this.vy = 0;
    this.speed = 3.8;
    this.isGrounded = false;
    this.facing = 'right';
    this.polarityLower = 'S';
    this.polarityUpper = 'N';
    this.carryingRock = null;

    // Sistema de Vidas
    this.lives = 3;
    this.invulnerableTimer = 0; // Temporizador de invulnerabilidade pós-dano
  }

  togglePolarity() {
    this.polarityLower = this.polarityLower === 'S' ? 'N' : 'S';
    this.polarityUpper = this.polarityLower === 'S' ? 'N' : 'S';
  }

  takeDamage() {
    if (this.invulnerableTimer > 0) return false;

    this.lives--;
    this.invulnerableTimer = 1.8; // 1.8 segundos invulnerável
    this.vy = -6.5;               // Pequeno impulso vertical de recuo
    return true;
  }

  get isInvulnerable() {
    return this.invulnerableTimer > 0;
  }

  update(moveDirection, terrain, deltaSec = 0.016) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - deltaSec);
    }

    if (moveDirection < 0) {
      this.vx = -this.speed;
      this.facing = 'left';
    } else if (moveDirection > 0) {
      this.vx = this.speed;
      this.facing = 'right';
    } else {
      this.vx = 0;
    }

    this.x += this.vx;
    this.resolveHorizontalCollisions(terrain);

    this.vy += CONFIG.GRAVITY || 0.38;
    this.y += this.vy;
    this.isGrounded = false;

    this.resolveVerticalCollisions(terrain);

    if (this.carryingRock && !this.carryingRock.isLaunched) {
      const bSize = CONFIG.BLOCK_SIZE || 36;
      this.carryingRock.size = bSize;
      this.carryingRock.x = this.x + (this.width / 2) - (bSize / 2);
      this.carryingRock.y = this.y - bSize - 4;
    }
  }

  resolveHorizontalCollisions(terrain) {
    if (!terrain) return;

    const checkBlock = (b) => {
      if (!b || !b.active) return;
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

    if (typeof terrain.forEachActiveBlockNear === 'function') {
      terrain.forEachActiveBlockNear(this.x, this.y, checkBlock);
    }
  }

  resolveVerticalCollisions(terrain) {
    if (!terrain) return;

    const checkBlock = (b) => {
      if (!b || !b.active) return;
      if (
        this.x + this.width > b.x &&
        this.x < b.x + b.size &&
        this.y + this.height >= b.y &&
        this.y + this.height <= b.y + 18 &&
        this.vy >= 0
      ) {
        if (this.polarityLower !== b.polarityTop) {
          this.vy = -(Number(b.repulseForce) || 8.2);
        } else {
          this.y = b.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
        }
      }
    };

    if (typeof terrain.forEachActiveBlockNear === 'function') {
      terrain.forEachActiveBlockNear(this.x, this.y, checkBlock);
    }
  }

  render(ctx, cameraX) {
    // Efeito de piscar quando atingido
    if (this.invulnerableTimer > 0) {
      const blink = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
      if (blink) return;
    }

    const rx = this.x - cameraX;
    const ry = this.y;

    ctx.save();

    // Rocha Carregada
    if (this.carryingRock && !this.carryingRock.isLaunched) {
      const rock = this.carryingRock;
      const rockX = rock.x - cameraX;
      ctx.fillStyle = rock.type === 'FERRO' ? '#b91c1c' : (rock.type === 'PARA' ? '#047857' : '#d97706');
      ctx.fillRect(rockX, rock.y, rock.size, rock.size);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rockX, rock.y, rock.size, rock.size);

      ctx.fillStyle = rock.polarityTop === 'N' ? '#ef4444' : '#0284c7';
      ctx.fillRect(rockX + (rock.size / 2) - 6, rock.y + 3, 12, 4);
    }

    // Mochila
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(rx - 3, ry + 12, this.width + 6, 26);

    // Membros Inferiores
    ctx.fillStyle = this.polarityLower === 'S' ? '#0284c7' : '#ef4444';
    ctx.fillRect(rx + 3, ry + 30, 9, 24);
    ctx.fillRect(rx + 18, ry + 30, 9, 24);

    // Botas Pretas
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(rx + 1, ry + 48, 12, 6);
    ctx.fillRect(rx + 17, ry + 48, 12, 6);

    // Tronco Superior
    ctx.fillStyle = this.polarityUpper === 'S' ? '#0284c7' : '#ef4444';
    ctx.fillRect(rx + 4, ry + 14, 22, 16);

    // Braços
    ctx.fillRect(rx - 3, ry - 4, 7, 20);
    ctx.fillRect(rx + this.width - 4, ry - 4, 7, 20);

    // Luvas Pretas
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(rx - 4, ry - 8, 8, 6);
    ctx.fillRect(rx + this.width - 4, ry - 8, 8, 6);

    // Capacete e Visor
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(rx + 5, ry, 20, 14);

    ctx.fillStyle = "#38bdf8";
    const visorOffset = this.facing === 'left' ? 5 : 9;
    ctx.fillRect(rx + visorOffset, ry + 4, 14, 5);

    ctx.restore();
  }
}