/**
 * RELEVO, BLOCOS MINERÁVEIS E NÚCLEO DE MAGMA
 * Arquivo: src/terrain.js
 */
import { CONFIG } from './config.js';

export class Terrain {
  constructor(worldWidth, canvasHeight, planet) {
    this.worldWidth = worldWidth;
    this.canvasHeight = canvasHeight;
    this.planet = planet;
    this.blockSize = CONFIG.BLOCK_SIZE;
    this.rows = 5;
    this.groundStartY = this.canvasHeight - (this.rows * this.blockSize) - 30;
    this.blocks = [];
    this.generate();
  }

  generate() {
    this.blocks = [];
    const cols = Math.ceil(this.worldWidth / this.blockSize);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < cols; c++) {
        const typeRoll = Math.random();
        let type = 'FERRO';
        if (typeRoll > 0.55) type = 'PARA';
        if (typeRoll > 0.85) type = 'DIA';

        this.blocks.push({
          id: `${c}_${r}`,
          col: c,
          x: c * this.blockSize,
          y: this.groundStartY + (r * this.blockSize),
          size: this.blockSize,
          type: type,
          polarityTop: Math.random() > 0.5 ? 'N' : 'S',
          active: true,
          vy: 0,
          isFalling: false
        });
      }
    }
  }

  // Física: se a rocha de baixo é minerada, as superiores caem
  update() {
    const activeBlocks = this.blocks.filter(b => b.active);

    for (let i = 0; i < activeBlocks.length; i++) {
      const b = activeBlocks[i];
      const nextY = b.y + b.size;

      const blockBelow = activeBlocks.find(other => 
        other !== b &&
        Math.abs(other.x - b.x) < 4 &&
        other.y >= nextY - 4 &&
        other.y <= nextY + 6
      );

      const coreLimit = this.getCoreThresholdY() - b.size;

      if (!blockBelow && b.y < coreLimit) {
        b.isFalling = true;
        b.vy += 0.45;
        b.y += b.vy;

        const landingBlock = activeBlocks.find(other =>
          other !== b &&
          Math.abs(other.x - b.x) < 4 &&
          b.y + b.size >= other.y &&
          b.y < other.y
        );

        if (landingBlock) {
          b.y = landingBlock.y - b.size;
          b.vy = 0;
          b.isFalling = false;
        }
      } else {
        b.vy = 0;
        b.isFalling = false;
      }
    }
  }

  // Mineração direcional (sob os pés ou na parede lateral da fossa)
  mineDirectional(magmanX, magmanY, magmanWidth, magmanHeight, facing) {
    const feetX = magmanX + (magmanWidth / 2);
    const feetY = magmanY + magmanHeight + 4;

    let target = this.blocks.find(b =>
      b.active &&
      feetX >= b.x && feetX <= b.x + b.size &&
      feetY >= b.y && feetY <= b.y + b.size
    );

    if (!target) {
      const sideX = facing === 'left' ? magmanX - 10 : magmanX + magmanWidth + 10;
      const chestY = magmanY + (magmanHeight * 0.6);

      target = this.blocks.find(b =>
        b.active &&
        sideX >= b.x && sideX <= b.x + b.size &&
        chestY >= b.y && chestY <= b.y + b.size
      );
    }

    if (target) {
      target.active = false;
      return { ...target };
    }
    return null;
  }

  getCoreThresholdY() {
    return this.groundStartY + (this.rows * this.blockSize) + 12;
  }

  render(ctx, cameraX) {
    const coreY = this.getCoreThresholdY();

    // Núcleo magmático superaquecido
    const grad = ctx.createLinearGradient(0, coreY, 0, this.canvasHeight);
    grad.addColorStop(0, "rgba(239, 68, 68, 0.5)");
    grad.addColorStop(1, "rgba(185, 28, 28, 0.98)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, coreY, this.canvasHeight * 2, this.canvasHeight - coreY);

    this.blocks.forEach(b => {
      if (b.x + b.size < cameraX || b.x > cameraX + 500) return;
      const screenX = b.x - cameraX;

      if (b.active) {
        ctx.fillStyle = b.type === 'FERRO' ? '#b91c1c' : (b.type === 'PARA' ? '#047857' : '#d97706');
        ctx.fillRect(screenX, b.y, b.size, b.size);

        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(screenX + 1, b.y + 1, b.size - 2, b.size - 2);

        // Polaridade do solo
        ctx.fillStyle = b.polarityTop === 'N' ? '#ef4444' : '#0284c7';
        ctx.fillRect(screenX + (b.size / 2) - 6, b.y + 3, 12, 4);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.fillText(b.polarityTop, screenX + (b.size / 2) - 3, b.y + 15);

        // Vegetação alienígena no topo
        if (b.y <= this.groundStartY) {
          ctx.fillStyle = this.planet.vegColor || "#22c55e";
          ctx.fillRect(screenX + 4, b.y - 4, 6, 4);
          ctx.fillRect(screenX + b.size - 10, b.y - 4, 6, 4);
        }
      } else {
        // Cavidade da fossa
        ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, b.y, b.size, b.size);
      }
    });
  }
}