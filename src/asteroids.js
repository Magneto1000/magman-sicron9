/**
 * GERENCIADOR DO CINTURÃO DE ASTEROIDES DINÂMICO
 * Arquivo: src/asteroids.js
 */
import { CONFIG } from './config.js';

export class AsteroidBelt {
  constructor(worldWidth = 2600, speedMultiplier = 1.0) {
    this.speedMultiplier = speedMultiplier;
    this.asteroids = [];
    this.count = CONFIG.ASTEROID_COUNT || 18;
    this.generate();
  }

  generate() {
    this.asteroids = [];
    for (let i = 0; i < this.count; i++) {
      const spd = (CONFIG.ASTEROID_BASE_SPEED + Math.random() * 0.9) * this.speedMultiplier;
      this.asteroids.push({
        id: i,
        x: (i * 180) - 400 + Math.random() * 50,
        y: CONFIG.ASTEROID_BELT_Y + (Math.sin(i * 1.5) * 45),
        radius: 18 + Math.random() * 16,
        vx: spd * (i % 2 === 0 ? 1 : -1),
        pullStrength: (CONFIG.MAGNETIC_PULL_BASE || 0.38) + (Math.random() * 0.15),
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.03,
        zOrder: i
      });
    }

    this.asteroids.sort((a, b) => a.zOrder - b.zOrder);
  }

  update(magman, onFatalCapture, cameraX = 0, viewportWidth = 440) {
    // Limites de wrap dinâmico ao redor da câmera
    const leftBound = cameraX - 250;
    const rightBound = cameraX + viewportWidth + 250;
    const totalSpan = rightBound - leftBound;

    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      ast.x += ast.vx;
      ast.rotation += ast.vRot;

      // Wrap infinito centrado na visão do jogador
      if (ast.x > rightBound) {
        ast.x -= totalSpan;
      } else if (ast.x < leftBound) {
        ast.x += totalSpan;
      }

      // Atração dipolar gravitacional
      const dx = ast.x - (magman.x + magman.width / 2);
      const dy = ast.y - (magman.y + magman.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 160) {
        const force = (1 - (dist / 160)) * ast.pullStrength * 4.0;
        magman.vx += (dx / dist) * force;
        magman.vy += (dy / dist) * force;

        if (dist < ast.radius + (magman.width / 2)) {
          onFatalCapture("Magman colidiu com o núcleo rochoso de um asteroide magnético!");
        }
      }
    }
  }

  render(ctx, cameraX) {
    this.asteroids.forEach(ast => {
      const rx = ast.x - cameraX;
      if (rx < -80 || rx > 520) return;

      ctx.save();
      ctx.translate(rx, ast.y);
      ctx.rotate(ast.rotation);

      // Campo magnético brilhante
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius + 7, 0, Math.PI * 2);
      ctx.stroke();

      // Núcleo rochoso
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Crateras
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(-ast.radius * 0.35, -ast.radius * 0.2, ast.radius * 0.25, 0, Math.PI * 2);
      ctx.arc(ast.radius * 0.3, ast.radius * 0.3, ast.radius * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }
}