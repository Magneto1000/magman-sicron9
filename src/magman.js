/**
 * AVATAR MAGMAN COM FÍSICA E BLOCO CARREGADO DE 36px
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
  }

  togglePolarity() {
    this.polarityLower = this.polarityLower === 'S' ? 'N' : 'S';
    this.polarityUpper = this.polarityLower === 'S' ? 'N' : 'S';
  }

  update(keys, terrain) {
    if (keys.left) {
      this.vx = -this.speed;
      this.facing = 'left';
    } else if (keys.right) {
      this.vx = this.speed;
      this.facing = 'right';
    } else {
      this.vx = 0;
    }

    this.x += this.vx;
    this.resolveHorizontalCollisions(terrain);

    this.vy += CONFIG.GRAVITY;
    this.y += this.vy;
    this.isGrounded = false;

    this.resolveVerticalCollisions(terrain);

    // Ajusta a posição da rocha carregada nos ombros (36x36 px)
    if (this.carryingRock && !this.carryingRock.isLaunched) {
      this.carryingRock.size = CONFIG.BLOCK_SIZE;
      this.carryingRock.x = this.x + (this.width / 2) - (CONFIG.BLOCK_SIZE / 2);
      this.carryingRock.y = this.y - CONFIG.BLOCK_SIZE - 4;
    }
  }

  resolveHorizontalCollisions(terrain) {
    terrain.blocks.forEach(b => {
      if (!b.active) return;
      if (
        this.x < b.x + b.size &&
        this.x + this.width > b.x &&
        this.y < b.y + b.size &&
        this.y + this.height - 8 > b.y
      ) {
        if (this.vx > 0) this.x = b.x - this.width;
        if (this.vx < 0) this.x = b.x + b.size;
      }
    });
  }

  resolveVerticalCollisions(terrain) {
    terrain.blocks.forEach(b => {
      if (!b.active) return;

      if (
        this.x + this.width > b.x &&
        this.x < b.x + b.size &&
        this.y + this.height >= b.y &&
        this.y + this.height <= b.y + 18 &&
        this.vy >= 0
      ) {
        if (this.polarityLower !== b.polarityTop) {
          this.vy = -8.2; // Repulsão magnética vertical (salto)
        } else {
          this.y = b.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
        }
      }
    });
  }

  render(ctx, cameraX) {
    const rx = this.x - cameraX;
    const ry = this.y;

    ctx.save();

    // 1. Rocha Carregada (Tamanho original 36px do solo)
    if (this.carryingRock && !this.carryingRock.isLaunched) {
      const rock = this.carryingRock;
      const rockX = rock.x - cameraX;
      ctx.fillStyle = rock.type === 'FERRO' ? '#b91c1c' : (rock.type === 'PARA' ? '#047857' : '#d97706');
      ctx.fillRect(rockX, rock.y, rock.size, rock.size);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rockX, rock.y, rock.size, rock.size);

      // Polaridade superior do bloco carregado
      ctx.fillStyle = rock.polarityTop === 'N' ? '#ef4444' : '#0284c7';
      ctx.fillRect(rockX + (rock.size / 2) - 6, rock.y + 3, 12, 4);
    }

    // 2. Mochila e Gerador de Campo
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(rx - 3, ry + 12, this.width + 6, 26);

    // 3. Membros Inferiores (cor da polaridade ativa)[cite: 3]
    ctx.fillStyle = this.polarityLower === 'S' ? '#0284c7' : '#ef4444';
    ctx.fillRect(rx + 3, ry + 30, 9, 24);
    ctx.fillRect(rx + 18, ry + 30, 9, 24);

    // Botas
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(rx + 1, ry + 48, 12, 6);
    ctx.fillRect(rx + 17, ry + 48, 12, 6);

    // 4. Tronco e Membros Superiores (polaridade oposta)[cite: 2]
    ctx.fillStyle = this.polarityUpper === 'S' ? '#0284c7' : '#ef4444';
    ctx.fillRect(rx + 4, ry + 14, 22, 16);

    // Braços levantados em apoio da rocha de 36px[cite: 3]
    ctx.fillRect(rx - 3, ry - 4, 7, 20);
    ctx.fillRect(rx + this.width - 4, ry - 4, 7, 20);

    // 5. Capacete e Visor
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(rx + 5, ry, 20, 14);

    ctx.fillStyle = "#38bdf8";
    const visorOffset = this.facing === 'left' ? 5 : 9;
    ctx.fillRect(rx + visorOffset, ry + 4, 14, 5);

    ctx.restore();
  }
}