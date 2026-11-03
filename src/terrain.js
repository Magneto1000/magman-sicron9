/**
 * TERRENO INFINITO UNIFICADO (5 CAMADAS PROFUNDAS)
 * Arquivo: src/terrain.js
 */
import { CONFIG } from './config.js';

export class Terrain {
  constructor(canvasHeight, planet) {
    this.canvasHeight = canvasHeight;
    this.planet = planet || {};
    this.blockSize = CONFIG.BLOCK_SIZE || 36;
    this.rows = 5; // 5 camadas sólidas em qualquer orientação
    this.groundStartY = this.canvasHeight - (this.rows * this.blockSize) - 24;

    this.chunks = new Map();
    this.minedBlocks = new Set();
  }

  resize(newCanvasHeight) {
    const oldStartY = this.groundStartY;
    this.canvasHeight = newCanvasHeight;
    this.groundStartY = this.canvasHeight - (this.rows * this.blockSize) - 24;

    const dy = this.groundStartY - oldStartY;
    this.chunks.forEach(b => {
      b.y += dy;
    });
  }

  getBlock(col, row) {
    if (row < 0 || row >= this.rows) return null;

    const key = `${col}_${row}`;
    if (this.minedBlocks.has(key)) return null;

    if (!this.chunks.has(key)) {
      const typeRoll = Math.sin(col * 997 + row * 13) * 0.5 + 0.5;
      let type = 'FERRO';
      if (typeRoll > 0.55) type = 'PARA';
      if (typeRoll > 0.85) type = 'DIA';

      const polarity = (Math.sin(col * 331 + row * 71) > 0) ? 'N' : 'S';
      const baseForce = Number(this.planet.baseRepulseForce) || 8.2;
      const randomRepulse = baseForce + (Math.sin(col * 41 + row) * 1.8);

      this.chunks.set(key, {
        id: key,
        col: col,
        row: row,
        x: col * this.blockSize,
        y: this.groundStartY + (row * this.blockSize),
        size: this.blockSize,
        type: type,
        polarityTop: polarity,
        repulseForce: randomRepulse,
        active: true,
        vy: 0
      });
    }

    const b = this.chunks.get(key);
    return (b && b.active) ? b : null;
  }

  update() {}

  forEachActiveBlockNear(targetX, targetY, callback) {
    const startCol = Math.floor((targetX - 100) / this.blockSize);
    const endCol = Math.ceil((targetX + 100) / this.blockSize);

    for (let c = startCol; c <= endCol; c++) {
      for (let r = 0; r < this.rows; r++) {
        const b = this.getBlock(c, r);
        if (b && b.active) {
          callback(b);
        }
      }
    }
  }

  mineDirectional(magmanX, magmanY, magmanWidth, magmanHeight, facing) {
    const feetCol = Math.floor((magmanX + magmanWidth / 2) / this.blockSize);
    const feetRow = Math.floor(((magmanY + magmanHeight + 8) - this.groundStartY) / this.blockSize);

    const frontCol = facing === 'left'
      ? Math.floor((magmanX - 8) / this.blockSize)
      : Math.floor((magmanX + magmanWidth + 8) / this.blockSize);
    const frontRow = Math.floor(((magmanY + magmanHeight - 6) - this.groundStartY) / this.blockSize);
    const chestRow = Math.floor(((magmanY + magmanHeight * 0.5) - this.groundStartY) / this.blockSize);

    const targets = [
      { c: feetCol, r: feetRow },
      { c: frontCol, r: frontRow },
      { c: frontCol, r: chestRow }
    ];

    for (const t of targets) {
      if (t.r >= 0 && t.r < this.rows) {
        const block = this.getBlock(t.c, t.r);
        if (block && block.active) {
          block.active = false;
          this.minedBlocks.add(block.id);
          this.chunks.delete(block.id);
          return { ...block };
        }
      }
    }

    const centerX = magmanX + magmanWidth / 2;
    const centerY = magmanY + magmanHeight;
    let closest = null;
    let minDist = 48;

    const startCol = Math.floor((centerX - 60) / this.blockSize);
    const endCol = Math.ceil((centerX + 60) / this.blockSize);

    for (let c = startCol; c <= endCol; c++) {
      for (let r = 0; r < this.rows; r++) {
        const b = this.getBlock(c, r);
        if (b && b.active) {
          const dist = Math.hypot(centerX - (b.x + b.size / 2), centerY - (b.y + b.size / 2));
          if (dist < minDist) {
            minDist = dist;
            closest = b;
          }
        }
      }
    }

    if (closest && closest.active) {
      closest.active = false;
      this.minedBlocks.add(closest.id);
      this.chunks.delete(closest.id);
      return { ...closest };
    }

    return null;
  }

  getCoreThresholdY() {
    return this.groundStartY + (this.rows * this.blockSize) + 14;
  }

  render(ctx, cameraX, viewportWidth) {
    const coreY = this.getCoreThresholdY();

    const grad = ctx.createLinearGradient(0, coreY, 0, this.canvasHeight);
    grad.addColorStop(0, "rgba(239, 68, 68, 0.55)");
    grad.addColorStop(1, "rgba(185, 28, 28, 0.98)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, coreY, viewportWidth, this.canvasHeight - coreY);

    const minCol = Math.floor((cameraX - 60) / this.blockSize);
    const maxCol = Math.ceil((cameraX + viewportWidth + 60) / this.blockSize);

    for (let c = minCol; c <= maxCol; c++) {
      for (let r = 0; r < this.rows; r++) {
        const b = this.getBlock(c, r);
        if (b && b.active) {
          const screenX = b.x - cameraX;

          ctx.fillStyle = b.type === 'FERRO' ? '#b91c1c' : (b.type === 'PARA' ? '#047857' : '#d97706');
          ctx.fillRect(screenX, b.y, b.size, b.size);

          ctx.strokeStyle = "rgba(255,255,255,0.18)";
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX, b.y, b.size, b.size);

          ctx.fillStyle = b.polarityTop === 'N' ? '#ef4444' : '#0284c7';
          ctx.fillRect(screenX + (b.size / 2) - 6, b.y + 3, 12, 4);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px monospace";
          ctx.fillText(b.polarityTop, screenX + (b.size / 2) - 3, b.y + 15);

          if (r === 0) {
            ctx.fillStyle = this.planet?.vegColor || "#22c55e";
            ctx.fillRect(screenX + 2, b.y - 4, 6, 4);
            ctx.fillRect(screenX + b.size - 8, b.y - 4, 6, 4);
          }
        }
      }
    }
  }
}