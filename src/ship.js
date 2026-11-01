/**
 * PLATAFORMA CARGUEIRA COM FIXAÇÃO INFERIOR (CAPACIDADE 10)
 * Arquivo: src/ship.js
 */
import { CONFIG } from './config.js';

export class CargoShip {
  constructor(shipData) {
    this.name = shipData.name;
    this.capacity = 10;
    this.width = shipData.hullWidth || 220;
    this.height = shipData.hullHeight || 26;
    this.x = 0;
    this.y = 28;
    this.flameTimer = 0;
    this.cargoColumns = 5;
    this.cargoRows = 2;
    this.boxSize = CONFIG.BLOCK_SIZE; // 36px
    this.cargoGap = 4;
    this.cargoBlocks = [];
  }

  update(magmanX, magmanWidth) {
    const targetX = magmanX + (magmanWidth / 2) - (this.width / 2);
    this.x += (targetX - this.x) * 0.22;
    this.flameTimer += 0.25;
  }

  addCargo(mineralType) {
    if (this.cargoBlocks.length >= this.capacity) return false;
    const idx = this.cargoBlocks.length;
    const col = idx % this.cargoColumns;
    const row = Math.floor(idx / this.cargoColumns);
    this.cargoBlocks.push({ type: mineralType, col, row });
    return true;
  }

  removeTopCargo() {
    if (this.cargoBlocks.length === 0) return null;
    return this.cargoBlocks.pop();
  }

  getExposedCargoBoundingBoxes() {
    const boxes = [];
    const totalCargoWidth = (this.cargoColumns * this.boxSize) + ((this.cargoColumns - 1) * this.cargoGap);
    const startX = this.x + (this.width - totalCargoWidth) / 2;

    this.cargoBlocks.forEach((c, idx) => {
      const bx = startX + (c.col * (this.boxSize + this.cargoGap));
      const by = this.y + this.height + 4 + (c.row * (this.boxSize + this.cargoGap));
      boxes.push({ index: idx, x: bx, y: by, size: this.boxSize, type: c.type });
    });
    return boxes;
  }

  render(ctx, cameraX) {
    const rx = this.x - cameraX;
    ctx.save();

    const nacelleWidth = 30;
    const nacelleHeight = 38;

    // Motores laterais detalhados
    const renderNacelle = (nx, ny, isLeft) => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(nx, ny, nacelleWidth, nacelleHeight);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(nx, ny, nacelleWidth, nacelleHeight);

      // Bocal inferior metálico
      ctx.fillStyle = "#64748b";
      ctx.fillRect(nx + 4, ny + nacelleHeight, nacelleWidth - 8, 6);

      // Chama de plasma
      const flameH = 12 + Math.sin(this.flameTimer + (isLeft ? 0 : 1)) * 5;
      ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
      ctx.beginPath();
      ctx.moveTo(nx + 4, ny + nacelleHeight + 6);
      ctx.lineTo(nx + nacelleWidth - 4, ny + nacelleHeight + 6);
      ctx.lineTo(nx + (nacelleWidth / 2), ny + nacelleHeight + 6 + flameH);
      ctx.closePath();
      ctx.fill();
    };

    renderNacelle(rx - nacelleWidth + 4, this.y - 6, true);
    renderNacelle(rx + this.width - 4, this.y - 6, false);

    // Casco Principal da Plataforma
    ctx.fillStyle = "#334155";
    ctx.fillRect(rx, this.y, this.width, this.height);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, this.y, this.width, this.height);

    // Painel Central
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(rx + (this.width / 2) - 20, this.y + 4, 40, 6);

    // Emissor Magnético Inferior
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(rx + 6, this.y + this.height - 2, this.width - 12, 2);

    // Renderização dos Blocos Acoplados (10 unidades)
    const totalCargoWidth = (this.cargoColumns * this.boxSize) + ((this.cargoColumns - 1) * this.cargoGap);
    const startX = rx + (this.width - totalCargoWidth) / 2;

    this.cargoBlocks.forEach(c => {
      const bx = startX + (c.col * (this.boxSize + this.cargoGap));
      const by = this.y + this.height + 4 + (c.row * (this.boxSize + this.cargoGap));

      ctx.fillStyle = c.type === 'FERRO' ? '#b91c1c' : (c.type === 'PARA' ? '#047857' : '#d97706');
      ctx.fillRect(bx, by, this.boxSize, this.boxSize);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, this.boxSize, this.boxSize);
    });

    ctx.restore();
  }
}