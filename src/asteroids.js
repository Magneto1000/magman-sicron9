/**
 * GERENCIADOR DO CINTURÃO DE ASTEROIDES DINÂMICO
 * Arquivo: src/asteroids.js
 */
import { CONFIG } from './config.js';

export class AsteroidBelt {
  constructor(speedMultiplier = 1.0, initialBeltY = 160) {
    this.speedMultiplier = speedMultiplier;
    this.count = CONFIG.ASTEROID_COUNT || 18;
    this.beltY = initialBeltY;
    this.asteroids = [];
    this.generate();
  }

  setBeltY(newBeltY) {
    const dy = newBeltY - this.beltY;
    this.beltY = newBeltY;
    this.asteroids.forEach(ast => {
      ast.baseY += dy;
    });
  }

  generate() {
    this.asteroids = [];
    const baseSpeed = CONFIG.ASTEROID_BASE_SPEED || 3.4;

    for (let i = 0; i < this.count; i++) {
      const isCounterOrbit = (i % 3 === 0);
      const direction = isCounterOrbit ? -1 : 1;
      const spd = (baseSpeed + 1.2 + Math.random() * 2.0) * this.speedMultiplier * direction;
      const radius = 7 + Math.random() * 6;
      
      // Faixas orbitais relativas ao cinturão dinâmico
      const laneY = this.beltY + (isCounterOrbit ? -16 : 16) + (Math.random() * 14 - 7);

      this.asteroids.push({
        id: i,
        x: (i * 180) - 600,
        y: laneY,
        baseY: laneY,
        orbitPhase: Math.random() * Math.PI * 2,
        radius: radius,
        vx: spd,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.08,
        direction: direction,
        trailLength: Math.abs(spd) * 4.0
      });
    }

    this.asteroids.sort((a, b) => a.radius - b.radius);
  }

  update(magman, onAsteroidHit, cameraX = 0, viewportWidth = 800, currentBeltY = null) {
    if (currentBeltY !== null && Math.abs(currentBeltY - this.beltY) > 5) {
      this.setBeltY(currentBeltY);
    }

    const horizonMargin = Math.max(350, viewportWidth * 0.4);
    const screenLeft = cameraX;
    const screenRight = cameraX + viewportWidth;

    const spawnLeft = screenLeft - horizonMargin;
    const spawnRight = screenRight + horizonMargin;

    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];

      ast.x += ast.vx;
      ast.orbitPhase += 0.025;
      ast.y = ast.baseY + Math.sin(ast.orbitPhase) * 8;
      ast.rotation += ast.vRot;

      if (ast.vx > 0 && ast.x > spawnRight) {
        ast.x = spawnLeft - (Math.random() * 200 + 50);
        ast.baseY = this.beltY + (ast.direction < 0 ? -16 : 16) + (Math.random() * 14 - 7);
      } else if (ast.vx < 0 && ast.x < spawnLeft) {
        ast.x = spawnRight + (Math.random() * 200 + 50);
        ast.baseY = this.beltY + (ast.direction < 0 ? -16 : 16) + (Math.random() * 14 - 7);
      }

      const dx = ast.x - (magman.x + magman.width / 2);
      const dy = ast.y - (magman.y + magman.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ast.radius + (magman.width / 2)) {
        onAsteroidHit("Magman foi atingido por um microasteroide hipersônico!");
      }
    }
  }

  render(ctx, cameraX, viewportWidth = 800) {
    const cullingMargin = 150;
    const minVisibleX = -cullingMargin;
    const maxVisibleX = viewportWidth + cullingMargin;

    this.asteroids.forEach(ast => {
      const rx = ast.x - cameraX;
      if (rx < minVisibleX || rx > maxVisibleX) return;

      ctx.save();

      const trailX = rx - (ast.direction * ast.trailLength);
      const grad = ctx.createLinearGradient(trailX, ast.y, rx, ast.y);
      grad.addColorStop(0, "rgba(56, 189, 248, 0)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.45)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = ast.radius * 0.7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(trailX, ast.y);
      ctx.lineTo(rx, ast.y);
      ctx.stroke();

      ctx.translate(rx, ast.y);
      ctx.rotate(ast.rotation);

      ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (ast.radius > 9) {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(-ast.radius * 0.3, -ast.radius * 0.2, ast.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}