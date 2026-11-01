import { CONFIG } from './config.js';

export class AsteroidBelt {
  constructor(worldWidth, speedMultiplier = 1.0) {
    this.worldWidth = worldWidth;
    this.speedMultiplier = speedMultiplier;
    this.asteroids = [];
    this.fallingDebris = []; // Fragmentos de colisões caindo em direção ao solo
    this.generate();
  }

  generate() {
    this.asteroids = [];
    this.fallingDebris = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      const baseSpd = (CONFIG.ASTEROID_BASE_SPEED + Math.random() * 2.5) * this.speedMultiplier;
      this.asteroids.push({
        id: i,
        x: (i * (this.worldWidth / count)) + Math.random() * 60,
        y: CONFIG.ASTEROID_BELT_Y + (Math.sin(i * 1.5) * 45),
        radius: 18 + Math.random() * 16,
        mass: 18 + Math.random() * 16,
        vx: baseSpd * (i % 2 === 0 ? 1 : -1),
        vy: (Math.random() - 0.5) * 1.2,
        pullStrength: CONFIG.MAGNETIC_PULL_BASE + (Math.random() * 0.25),
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.06
      });
    }
  }

  update(magman, onFatalCapture, onFragmentLanded) {
    // 1. Movimentação e rotação dos asteroides
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      ast.x += ast.vx;
      ast.y += ast.vy;
      ast.rotation += ast.vRot;

      // Mantém os asteroides dentro da faixa do cinturão rebaixado
      if (ast.y < CONFIG.ASTEROID_BELT_Y - 55) ast.vy = Math.abs(ast.vy);
      if (ast.y > CONFIG.ASTEROID_BELT_Y + 55) ast.vy = -Math.abs(ast.vy);

      // Limites horizontais contínuos
      if (ast.x > this.worldWidth + 60) ast.x = -60;
      if (ast.x < -60) ast.x = this.worldWidth + 60;

      // 2. Física de Colisão entre Asteroides (Ricochete Elástico + Desprendimento de Fragmentos)
      for (let j = i + 1; j < this.asteroids.length; j++) {
        const other = this.asteroids[j];
        const dx = other.x - ast.x;
        const dy = other.y - ast.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ast.radius + other.radius;

        if (dist < minDist && dist > 0) {
          // Normal de colisão
          const nx = dx / dist;
          const ny = dy / dist;

          // Velocidades relativas
          const kx = ast.vx - other.vx;
          const ky = ast.vy - other.vy;
          const p = 2 * (nx * kx + ny * ky) / (ast.mass + other.mass);

          // Troca de momento com ricochete
          ast.vx -= p * other.mass * nx;
          ast.vy -= p * other.mass * ny;
          other.vx += p * ast.mass * nx;
          other.vy += p * ast.mass * ny;

          // Afasta para evitar sobreposição contínua
          const overlap = 0.5 * (minDist - dist);
          ast.x -= overlap * nx;
          ast.y -= overlap * ny;
          other.x += overlap * nx;
          other.y += overlap * ny;

          // Gera fragmento mineral cadente decorrente do impacto
          const mineralTypes = ['FERRO', 'PARA', 'DIA'];
          this.fallingDebris.push({
            x: (ast.x + other.x) / 2,
            y: (ast.y + other.y) / 2,
            vx: (Math.random() - 0.5) * 2,
            vy: 2.5 + Math.random() * 2,
            size: 16,
            type: mineralTypes[Math.floor(Math.random() * mineralTypes.length)]
          });
        }
      }

      // 3. Atração magnética severa sobre Magman
      const mdx = ast.x - (magman.x + magman.width / 2);
      const mdy = ast.y - (magman.y + magman.height / 2);
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

      if (mDist < 170) {
        const force = (1 - (mDist / 170)) * ast.pullStrength * 5.2;
        magman.vx += (mdx / mDist) * force;
        magman.vy += (mdy / mDist) * force;

        if (mDist < ast.radius + (magman.width / 2)) {
          onFatalCapture("Magman foi esmagado contra a crosta de um asteroide magnético!");
        }
      }
    }

    // 4. Atualização dos fragmentos que caem no solo
    for (let k = this.fallingDebris.length - 1; k >= 0; k--) {
      const deb = this.fallingDebris[k];
      deb.x += deb.vx;
      deb.vy += 0.35; // Gravidade
      deb.y += deb.vy;

      // Se atingir o solo, converte-se em novo bloco minerável
      if (deb.y >= onFragmentLanded.groundLimitY) {
        onFragmentLanded.addBlock(deb.x, deb.type);
        this.fallingDebris.splice(k, 1);
      }
    }
  }

  render(ctx, cameraX) {
    // 1. Desenha os asteroides
    this.asteroids.forEach(ast => {
      const rx = ast.x - cameraX;
      if (rx < -80 || rx > 520) return;

      ctx.save();
      ctx.translate(rx, ast.y);
      ctx.rotate(ast.rotation);

      // Pulso magnético brilhante
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius + 10, 0, Math.PI * 2);
      ctx.stroke();

      // Corpo rochoso detalhado
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Crateras
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(-ast.radius * 0.3, -ast.radius * 0.2, ast.radius * 0.28, 0, Math.PI * 2);
      ctx.arc(ast.radius * 0.35, ast.radius * 0.25, ast.radius * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // 2. Desenha fragmentos incandescentes caindo
    this.fallingDebris.forEach(deb => {
      const rx = deb.x - cameraX;
      ctx.save();
      ctx.fillStyle = deb.type === 'FERRO' ? '#ef4444' : (deb.type === 'PARA' ? '#10b981' : '#f59e0b');
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fillRect(rx, deb.y, deb.size, deb.size);
      ctx.restore();
    });
  }
}