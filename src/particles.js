export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Pulveriza a rocha quando atingida por asteroides
  shatterBlock(x, y, mineralType) {
    const baseColor = mineralType === 'FERRO' ? '#ef4444' : (mineralType === 'PARA' ? '#10b981' : '#f59e0b');
    const particleCount = 35;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: baseColor,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // Leve peso dos fragmentos
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, cameraX) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
      ctx.restore();
    });
  }
}