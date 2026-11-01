/**
 * SISTEMA DE PARTÍCULAS (FAÍSCAS DE IMPACTO E QUEBRA DE BLOCOS)
 * Arquivo: src/particles.js
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Método genérico para faíscas de dano e colisões
  emit(x, y, color = '#ef4444', count = 12, speed = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1.5,
        color: color,
        size: Math.random() * 3 + 2,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  // Fragmentos de desintegração de minerais
  shatterBlock(x, y, mineralType) {
    const color = mineralType === 'FERRO' ? '#ef4444' : (mineralType === 'PARA' ? '#10b981' : '#f59e0b');
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 5 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 2,
        color: color,
        size: Math.random() * 4 + 2,
        life: 1.0,
        decay: Math.random() * 0.025 + 0.02
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18; // Gravidade leve nos estilhaços
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, cameraX) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const rx = p.x - cameraX;

      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(rx, p.y, p.size, p.size);
    }
    ctx.restore();
  }
}