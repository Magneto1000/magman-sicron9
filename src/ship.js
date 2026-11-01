/**
 * PLATAFORMA CARGUEIRA COM PROPULSORES LATERAIS E FIXAÇÃO INFERIOR
 * Arquivo: src/ship.js
 */
import { CONFIG } from './config.js';

export class CargoShip {
  constructor(shipData, worldWidth) {
    this.name = shipData.name;
    this.capacity = 20;
    this.width = shipData.hullWidth || 260;
    this.height = shipData.hullHeight || 28;
    this.x = worldWidth / 2;
    this.y = 35;
    this.flameTimer = 0;

    // Configuração da matriz de carga (5 colunas x 4 fileiras = 20 blocos)
    this.cargoColumns = 5;
    this.cargoRows = 4;
    this.boxSize = CONFIG.BLOCK_SIZE; // Exatamente 36px
    this.cargoGap = 4;
    this.cargoBlocks = [];
  }

  update(magmanX, magmanWidth) {
    // Acompanha a posição horizontal do Magman
    const targetX = magmanX + (magmanWidth / 2) - (this.width / 2);
    this.x += (targetX - this.x) * 0.22;
    this.flameTimer += 0.25;
  }

  // Acopla uma nova rocha no fundo da plataforma
  addCargo(mineralType) {
    if (this.cargoBlocks.length >= this.capacity) return false;

    const idx = this.cargoBlocks.length;
    const col = idx % this.cargoColumns;
    const row = Math.floor(idx / this.cargoColumns);

    this.cargoBlocks.push({
      type: mineralType,
      col: col,
      row: row
    });
    return true;
  }

  // Remove a última caixa acoplada (se destruída por asteroide)
  removeTopCargo() {
    if (this.cargoBlocks.length === 0) return null;
    return this.cargoBlocks.pop();
  }

  // Bounding boxes dos blocos acoplados na parte inferior da nave
  getExposedCargoBoundingBoxes() {
    const boxes = [];
    const totalCargoWidth = (this.cargoColumns * this.boxSize) + ((this.cargoColumns - 1) * this.cargoGap);
    const startX = this.x + (this.width - totalCargoWidth) / 2;

    this.cargoBlocks.forEach((c, idx) => {
      const bx = startX + (c.col * (this.boxSize + this.cargoGap));
      // Acoplamento pendurado abaixo da viga da nave
      const by = this.y + this.height + 6 + (c.row * (this.boxSize + this.cargoGap));

      boxes.push({
        index: idx,
        x: bx,
        y: by,
        size: this.boxSize,
        type: c.type
      });
    });

    return boxes;
  }

  render(ctx, cameraX) {
    const rx = this.x - cameraX;
    ctx.save();

    const nacelleWidth = 34;
    const nacelleHeight = 44;

    // 1. FOGUETES / PROPULSORES DETALHADOS NAS LATERAIS
    const renderNacelle = (nx, ny, isLeft) => {
      // Carcaça externa do motor
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(nx, ny, nacelleWidth, nacelleHeight);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(nx, ny, nacelleWidth, nacelleHeight);

      // Aletas e grelhas de ventilação
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(nx + 4, ny + 8, nacelleWidth - 8, 3);
      ctx.fillRect(nx + 4, ny + 14, nacelleWidth - 8, 3);
      ctx.fillRect(nx + 4, ny + 20, nacelleWidth - 8, 3);

      // Bocal de exaustão metálico inferior
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.moveTo(nx + 6, ny + nacelleHeight);
      ctx.lineTo(nx + nacelleWidth - 6, ny + nacelleHeight);
      ctx.lineTo(nx + nacelleWidth - 2, ny + nacelleHeight + 8);
      ctx.lineTo(nx + 2, ny + nacelleHeight + 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.stroke();

      // Labareda de Plasma Multifásica
      const flameLength = 14 + Math.sin(this.flameTimer + (isLeft ? 0 : 1)) * 6;
      // Chama externa azul
      ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
      ctx.beginPath();
      ctx.moveTo(nx + 4, ny + nacelleHeight + 8);
      ctx.lineTo(nx + nacelleWidth - 4, ny + nacelleHeight + 8);
      ctx.lineTo(nx + (nacelleWidth / 2), ny + nacelleHeight + 8 + flameLength);
      ctx.closePath();
      ctx.fill();

      // Núcleo interno de plasma superaquecido branco
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(nx + 10, ny + nacelleHeight + 8);
      ctx.lineTo(nx + nacelleWidth - 10, ny + nacelleHeight + 8);
      ctx.lineTo(nx + (nacelleWidth / 2), ny + nacelleHeight + 8 + (flameLength * 0.55));
      ctx.closePath();
      ctx.fill();
    };

    // Propulsor Lateral Esquerdo
    renderNacelle(rx - nacelleWidth + 6, this.y - 8, true);
    // Propulsor Lateral Direito
    renderNacelle(rx + this.width - 6, this.y - 8, false);

    // 2. VIGA ESTRUTURAL PRINCIPAL DA PLATAFORMA
    ctx.fillStyle = "#334155";
    ctx.fillRect(rx, this.y, this.width, this.height);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, this.y, this.width, this.height);

    // Painel superior e visor de navegação
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(rx + (this.width / 2) - 24, this.y + 4, 48, 8);

    // Linha emissora magnética inferior (sem nenhum elemento obstrutivo abaixo)
    ctx.fillStyle = "#38bdf8";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 8;
    ctx.fillRect(rx + 8, this.y + this.height - 2, this.width - 16, 2);
    ctx.shadowBlur = 0;

    // 3. BLOCOS DE CARGA FIXADOS NA PARTE INFERIOR (SUSPENSOS)
    const totalCargoWidth = (this.cargoColumns * this.boxSize) + ((this.cargoColumns - 1) * this.cargoGap);
    const startX = rx + (this.width - totalCargoWidth) / 2;

    this.cargoBlocks.forEach(c => {
      const bx = startX + (c.col * (this.boxSize + this.cargoGap));
      const by = this.y + this.height + 6 + (c.row * (this.boxSize + this.cargoGap));

      // Cor do mineral correspondente
      ctx.fillStyle = c.type === 'FERRO' ? '#b91c1c' : (c.type === 'PARA' ? '#047857' : '#d97706');
      ctx.fillRect(bx, by, this.boxSize, this.boxSize);

      // Borda e efeito volumétrico no bloco acoplado
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, this.boxSize, this.boxSize);

      // Conexão magnética sutil entre o topo do bloco da 1ª fileira e a plataforma
      if (c.row === 0) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + (this.boxSize / 2), by);
        ctx.lineTo(bx + (this.boxSize / 2), this.y + this.height);
        ctx.stroke();
      }
    });

    ctx.restore();
  }
}