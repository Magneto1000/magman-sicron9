/**
 * GERENCIADOR DO CINTURÃO DE ASTEROIDES ORBITAIS
 * Arquivo: src/asteroids.js
 */
import { CONFIG } from './config.js';

export class AsteroidBelt {
  constructor(worldWidth = 2600, speedMultiplier = 1.0) {
    this.speedMultiplier = speedMultiplier;
    this.count = CONFIG.ASTEROID_COUNT || 18;
    this.asteroids = [];
    this.generate();
  }

  generate() {
    this.asteroids = [];
    const baseSpeed = (CONFIG.ASTEROID_BASE_SPEED || 3.2);

    for (let i = 0; i < this.count; i++) {
      // Sentido da órbita: 70% segue o fluxo orbital planetário, 30% em contra-fluxo
      const isCounterOrbit = (i % 3 === 0);
      const direction = isCounterOrbit ? -1 : 1;

      // Velocidade significativamente maior (entre 3.4 e 6.0 px/frame)
      const spd = (baseSpeed + 1.2 + Math.random() * 1.8) * this.speedMultiplier * direction;

      // Raio reduzido (8 a 15 px) para parecerem corpos celestes distantes e velozes
      const radius = 8 + Math.random() * 7;

      // Pista orbital (duas faixas de altitude para profundidade)
      const laneY = CONFIG.ASTEROID_BELT_Y + (isCounterOrbit ? -25 : 20) + (Math.random() * 20 - 10);

      this.asteroids.push({
        id: i,
        x: (i * 140) - 300,
        y: laneY,
        baseY: laneY,
        orbitPhase: Math.random() * Math.PI * 2,
        radius: radius,
        vx: spd,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.08,
        direction: direction,
        trailLength: Math.abs(spd) * 3.5 // Comprimento do rastro orbital
      });
    }

    // Ordenação por tamanho para criar profundidade visual natural
    this.asteroids.sort((a, b) => a.radius - b.radius);
  }

  update(magman, onAsteroidHit, cameraX = 0, viewportWidth = 440) {
    // Margem ampla fora da tela para que o surgimento ocorra 100% no horizonte
    const horizonMargin = 220;
    const screenLeft = cameraX;
    const screenRight = cameraX + viewportWidth;

    const spawnLeft = screenLeft - horizonMargin;
    const spawnRight = screenRight + horizonMargin;

    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];

      // Deslocamento horizontal contínuo e ondulação orbital vertical
      ast.x += ast.vx;
      ast.orbitPhase += 0.025;
      ast.y = ast.baseY + Math.sin(ast.orbitPhase) * 12;
      ast.rotation += ast.vRot;

      // RECICLAGEM NO HORIZONTE:
      // Se move para a direita (vx > 0) e saiu da margem direita -> renasce fora do horizonte esquerdo
      if (ast.vx > 0 && ast.x > spawnRight) {
        ast.x = spawnLeft - Math.random() * 120;
        ast.baseY = CONFIG.ASTEROID_BELT_Y + (ast.direction < 0 ? -25 : 20) + (Math.random() * 20 - 10);
      }
      // Se move para a esquerda (vx < 0) e saiu da margem esquerda -> renasce fora do horizonte direito
      else if (ast.vx < 0 && ast.x < spawnLeft) {
        ast.x = spawnRight + Math.random() * 120;
        ast.baseY = CONFIG.ASTEROID_BELT_Y + (ast.direction < 0 ? -25 : 20) + (Math.random() * 20 - 10);
      }

      // Verificação de colisão física direta com o astronauta
      const dx = ast.x - (magman.x + magman.width / 2);
      const dy = ast.y - (magman.y + magman.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ast.radius + (magman.width / 2)) {
        onAsteroidHit("Magman foi atingido por um microasteroide hipersônico!");
      }
    }
  }

  render(ctx, cameraX) {
    this.asteroids.forEach(ast => {
      const rx = ast.x - cameraX;

      // Não renderiza se estiver totalmente fora do corte de visão
      if (rx < -90 || rx > 600) return;

      ctx.save();

      // 1. Rastro Órbital de Velocidade (Speed Trail)
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

      // 2. Núcleo Rápido do Asteroide
      ctx.translate(rx, ast.y);
      ctx.rotate(ast.rotation);

      // Brilho exterior leve
      ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius + 2, 0, Math.PI * 2);
      ctx.fill();

      // Corpo rochoso denso
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
      ctx.fill();

      // Contorno de alta velocidade
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Microcratera
      if (ast.radius > 10) {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(-ast.radius * 0.3, -ast.radius * 0.2, ast.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}