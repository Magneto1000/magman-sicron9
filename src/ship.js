/**
 * PLATAFORMA ORBITAL CARGUEIRA COM POSICIONAMENTO DINÂMICO
 * Arquivo: src/ship.js
 */
import { CONFIG } from './config.js';

export class CargoShip {
  constructor(shipData, startX, canvasHeight = 600) {
    this.name = shipData.name;
    this.capacity = CONFIG.CARGO_TARGET || 10;
    this.width = shipData.hullWidth || 260;
    this.height = shipData.hullHeight || 28;
    this.x = startX;
    
    // Altura dinâmica: 10px em landscape curto, 28px em telas altas
    this.y = canvasHeight < 520 ? 10 : 28;
    this.flameTimer = 0;

    this.cargoColumns = 5;
    this.cargoRows = 2;
    this.boxSize = CONFIG.BLOCK_SIZE || 36;
    this.cargoGap = 6;
    this.cargoBlocks = [];
  }

  resize(canvasHeight) {
    this.y = canvasHeight < 520 ? 10 : 28;
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

    const nacelleWidth = 34;
    const nacelleHeight = 40;

    const renderNacelle = (nx, ny, isLeft) => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(nx, ny, nacelleWidth, nacelleHeight);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(nx, ny, nacelleWidth, nacelleHeight);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(nx + 4, ny + 8, nacelleWidth - 8, 3);
      ctx.fillRect(nx + 4, ny + 14, nacelleWidth - 8, 3);
      ctx.fillRect(nx + 4, ny + 20, nacelleWidth - 8, 3);

      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.moveTo(nx + 6, ny + nacelleHeight);
      ctx.lineTo(nx + nacelleWidth - 6, ny + nacelleHeight);
      ctx.lineTo(nx + nacelleWidth - 2, ny + nacelleHeight + 6);
      ctx.lineTo(nx + 2, ny + nacelleHeight + 6);
      ctx.closePath();
      ctx.fill();

      const flameLength = 12 + Math.sin(this.flameTimer + (isLeft ? 0 : 1)) * 5;
      ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
      ctx.beginPath();
      ctx.moveTo(nx + 4, ny + nacelleHeight + 6);
      ctx.lineTo(nx + nacelleWidth - 4, ny + nacelleHeight + 6);
      ctx.lineTo(nx + (nacelleWidth / 2), ny + nacelleHeight + 6 + flameLength);
      ctx.closePath();
      ctx.fill();
    };

    renderNacelle(rx - nacelleWidth + 6, this.y - 6, true);
    renderNacelle(rx + this.width - 6, this.y - 6, false);

    // Casco da plataforma
    ctx.fillStyle = "#334155";
    ctx.fillRect(rx, this.y, this.width, this.height);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, this.y, this.width, this.height);

    ctx.fillStyle = "#0284c7";
    ctx.fillRect(rx + (this.width / 2) - 24, this.y + 4, 48, 6);

    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(rx + 8, this.y + this.height - 2, this.width - 16, 2);

    // Caixas acopladas
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