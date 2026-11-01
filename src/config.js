/**
 * GERENCIADOR DO CINTURÃO DE ASTEROIDES
 * Arquivo: src/asteroids.js
 * Asteroides lentos, sem colisões entre si (passam um atrás do outro).
 */
import { CONFIG } from './config.js';

export class AsteroidBelt {
  constructor(worldWidth, speedMultiplier = 1.0) {
    this.worldWidth = worldWidth;
    this.speedMultiplier = speedMultiplier;
    this.asteroids = [];
    this.generate();
  }

  generate() {
    this.asteroids = [];
    const count = CONFIG.ASTEROID_COUNT;

    for (let i = 0; i < count; i++) {
      // Velocidade reduzida e movimento calmo
      const spd = (CONFIG.ASTEROID_BASE_SPEED + Math.random() * 0.8) * this.speedMultiplier;
      this.asteroids.push({
        id: i,
        x: (i * (this.worldWidth / count)) + Math.random() * 80,
        y: CONFIG.ASTEROID_BELT_Y + (Math.sin(i * 1.8) * 35),
        radius: 20 + Math.random() * 14,
        vx: spd * (i % 2 === 0 ? 1 : -1),
        pullStrength: CONFIG.MAGNETIC_PULL_BASE + (Math.random() * 0.15),
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.02, // Rotação sutil
        zOrder: i // Define a sobreposição visual sem colisão
      });
    }

    // Ordena por zOrder para que a renderização dê profundidade natural
    this.asteroids.sort((a, b) => a.zOrder - b.zOrder);
  }

  update(magman, onFatalCapture) {
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      ast.x += ast.vx;
      ast.rotation += ast.vRot;

      // Wrap horizontal no mundo
      if (ast.x > this.worldWidth + 70) ast.x = -70;
      if (ast.x < -70) ast.x = this.worldWidth + 70;

      // Atração dipolar sobre o Magman se ele saltar muito perto do cinturão
      const dx = ast.x - (magman.x + magman.width / 2);
      const dy = ast.y - (magman.y + magman.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 150) {
        const force = (1 - (dist / 150)) * ast.pullStrength * 3.8;
        magman.vx += (dx / dist) * force;
        magman.vy += (dy / dist) * force;

        // Choque direto do astronauta no corpo do asteroide
        if (dist < ast.radius + (magman.width / 2)) {
          onFatalCapture("Magman colidiu com o núcleo rochoso de um asteroide magnético!");
        }
      }
    }
  }

  render(ctx, cameraX) {
    this.asteroids.forEach(ast => {
      const rx = ast.x - cameraX;
      if (rx < -90 || rx > 530) return;

      ctx.save();
      ctx.translate(rx, ast.y);
      ctx.rotate(ast.rotation);

      // Campo magnético difuso
      ctx.strokeStyle = "rgba(56, 189, 248, 0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius + 8, 0, Math.PI * 2);
      ctx.stroke();

      // Corpo rochoso
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