export class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }
  follow(targetX) {
    const desiredX = targetX - (this.viewportWidth / 2);
    this.x += (desiredX - this.x) * 0.1; // Deslocamento livre infinito em ambos os sentidos
  }
}

export class BackgroundParallax {
  constructor(planet) {
    this.planet = planet;
  }
  render(ctx, cameraX, canvasWidth, canvasHeight) {
    const sky = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    const colors = this.planet.skyGradient || ["#020617", "#0f172a", "#1e293b"];
    sky.addColorStop(0, colors[0]);
    sky.addColorStop(0.5, colors[1]);
    sky.addColorStop(1, colors[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Estrelas
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    for (let i = 0; i < 45; i++) {
      const starX = ((i * 61) - (cameraX * 0.04)) % canvasWidth;
      const x = starX < 0 ? starX + canvasWidth : starX;
      const y = (i * 31) % (canvasHeight * 0.65);
      ctx.fillRect(x, y, (i % 2) + 1, (i % 2) + 1);
    }

    // Cordilheira infinita
    ctx.fillStyle = "rgba(10, 15, 30, 0.7)";
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight);
    for (let x = 0; x <= canvasWidth; x += 35) {
      const worldRef = (x + (cameraX * 0.15));
      const peak = Math.sin(worldRef * 0.004) * 80 + Math.cos(worldRef * 0.008) * 35;
      ctx.lineTo(x, canvasHeight - 210 - peak);
    }
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.closePath();
    ctx.fill();

    // Relevo médio infinito
    ctx.fillStyle = this.planet.lithoColor || "#0f172a";
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight);
    for (let x = 0; x <= canvasWidth; x += 25) {
      const worldRef = (x + (cameraX * 0.4));
      const hill = Math.sin(worldRef * 0.012) * 45;
      ctx.lineTo(x, canvasHeight - 120 - hill);
    }
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.closePath();
    ctx.fill();
  }
}