/**
 * LOOP PRINCIPAL E ORQUESTRAÇÃO DE EVENTOS
 * Arquivo: src/main.js
 */
import { CONFIG, PLANETS, SHIPS } from './config.js';
import { DatabaseService } from './firebase.js';
import { Camera, BackgroundParallax } from './camera.js';
import { Terrain } from './terrain.js';
import { ParticleSystem } from './particles.js';
import { Magman } from './magman.js';
import { AsteroidBelt } from './asteroids.js';
import { CargoShip } from './ship.js';

class MagmanApp {
  constructor() {
    this.activePlanet = null;
    this.activeShip = null;
    this.running = false;
    this.cargoCollected = 0;
    this.launchedRocks = [];
    this.keys = { left: false, right: false };

    this.initDOM();
  }

  initDOM() {
    this.viewport = document.getElementById('viewport');
    this.ctx = this.viewport.getContext('2d');

    this.drawLoginAvatar();

    window.addEventListener('resize', () => {
      if (this.running) this.resizeViewport();
    });

    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('input-email').value;
        const pass = document.getElementById('input-password').value;
        await DatabaseService.login(email, pass);
        this.switchView('screen-planets');
      });
    }

    const btnSignup = document.getElementById('btn-signup');
    if (btnSignup) {
      btnSignup.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('input-email').value;
        const pass = document.getElementById('input-password').value;
        const res = await DatabaseService.register(email, pass);
        if (res.error) {
          alert(`Aviso de cadastro: ${res.error.message}`);
        } else {
          alert("Piloto registado com sucesso no Firebase!");
        }
        this.switchView('screen-planets');
      });
    }

    const btnViewRanking = document.getElementById('btn-view-ranking');
    if (btnViewRanking) {
      btnViewRanking.onclick = () => this.openLeaderboard();
    }

    const btnCloseRanking = document.getElementById('btn-close-ranking');
    if (btnCloseRanking) {
      btnCloseRanking.onclick = () => {
        document.getElementById('modal-ranking').classList.add('hidden');
      };
    }

    const btnCancelBriefing = document.getElementById('btn-cancel-briefing');
    if (btnCancelBriefing) {
      btnCancelBriefing.onclick = () => this.switchView('screen-planets');
    }

    const btnLaunch = document.getElementById('btn-launch');
    if (btnLaunch) {
      btnLaunch.onclick = () => this.startMission();
    }

    const btnRetry = document.getElementById('btn-gameover-retry');
    if (btnRetry) {
      btnRetry.onclick = () => {
        document.getElementById('modal-gameover').classList.add('hidden');
        this.startMission();
      };
    }

    const btnMenu = document.getElementById('btn-gameover-menu');
    if (btnMenu) {
      btnMenu.onclick = () => {
        document.getElementById('modal-gameover').classList.add('hidden');
        this.switchView('screen-planets');
      };
    }

    const btnVictory = document.getElementById('btn-victory-continue');
    if (btnVictory) {
      btnVictory.onclick = () => {
        document.getElementById('modal-victory').classList.add('hidden');
        this.switchView('screen-planets');
      };
    }

    this.bindControls();
    this.renderPlanetsMenu();
  }

  drawLoginAvatar() {
    const cvs = document.getElementById('auth-avatar-preview');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(32, 10, 26, 20);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(35, 18, 20, 6);

    ctx.fillStyle = "#0284c7";
    ctx.fillRect(24, 32, 42, 24);
    ctx.fillRect(18, 14, 8, 24);
    ctx.fillRect(64, 14, 8, 24);

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(28, 58, 12, 34);
    ctx.fillRect(50, 58, 12, 34);
  }

  resizeViewport() {
    const container = document.getElementById('screen-gameplay');
    const w = (container && container.clientWidth) ? container.clientWidth : window.innerWidth;
    const h = (container && container.clientHeight) ? container.clientHeight : window.innerHeight;
    this.viewport.width = w;
    this.viewport.height = h;

    if (this.camera) {
      this.camera.viewportWidth = w;
      this.camera.viewportHeight = h;
    }
  }

  switchView(viewId) {
    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
  }

  renderPlanetsMenu() {
    const matrix = document.getElementById('planet-matrix');
    if (!matrix) return;
    matrix.innerHTML = "";
    PLANETS.forEach(p => {
      const card = document.createElement('div');
      card.className = `planet-card ${p.completed ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="planet-icon" style="background:${p.color}"></div>
        <div class="planet-info-block">
          <strong>${p.name}</strong>
          <span class="planet-tag">RISCO: ${p.hazardLevel} | META: ${p.targetCargo}</span>
          <span style="font-size:9px; color:#94a3b8;">${p.atmosphereName.split('/')[0]}</span>
        </div>
      `;
      card.onclick = () => this.openBriefing(p);
      matrix.appendChild(card);
    });
  }

  openBriefing(planet) {
    this.activePlanet = planet;
    this.activeShip = SHIPS[0];

    document.getElementById('briefing-planet-title').innerText = planet.name;
    document.getElementById('briefing-atmosphere').innerText = planet.atmosphereName;
    document.getElementById('briefing-lithosphere').innerText = planet.lithosphereName;
    document.getElementById('briefing-vegetation').innerText = planet.vegetationName;
    document.getElementById('briefing-polarity').innerText = planet.nativePolarity === 'N' ? 'NORTE (+)' : 'SUL (-)';

    document.getElementById('briefing-ship-info').innerText = 
      `${this.activeShip.name} (Capacidade: ${this.activeShip.capacity} blocos magnéticos acoplados na face inferior).`;

    document.getElementById('briefing-tactical-desc').innerText = 
      `Extraia os blocos do solo e lance-os para acoplamento sob a plataforma. Cuidado com os asteroides no corredor intermediário!`;

    this.switchView('screen-briefing');
  }

  async openLeaderboard() {
    const modal = document.getElementById('modal-ranking');
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = "<li style='padding:8px;'>Carregando ranking do Firebase...</li>";
    modal.classList.remove('hidden');

    const scores = await DatabaseService.getLeaderboard();
    list.innerHTML = scores.map((s, idx) => `
      <li style="margin-bottom:8px; font-size:12px; border-bottom:1px solid #1e293b; padding-bottom:4px;">
        <span style="color:#38bdf8;">${idx + 1}.</span> ${s.username} — <strong>${s.score} pts</strong>
      </li>
    `).join('');
  }

  bindControls() {
    const bindBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('mouseup', (e) => { e.preventDefault(); onUp(); });
    };

    bindBtn('ctrl-left', () => this.keys.left = true, () => this.keys.left = false);
    bindBtn('ctrl-right', () => this.keys.right = true, () => this.keys.right = false);

    const btnPolarity = document.getElementById('ctrl-polarity');
    if (btnPolarity) btnPolarity.onclick = () => this.toggleMagmanPolarity();

    const btnAction = document.getElementById('ctrl-action');
    if (btnAction) btnAction.onclick = () => this.triggerAction();

    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'KeyW' || e.code === 'ShiftLeft' || e.code === 'KeyC') this.toggleMagmanPolarity();
      if (e.code === 'Space' || e.code === 'KeyE') this.triggerAction();
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });
  }

  toggleMagmanPolarity() {
    if (this.magman) {
      this.magman.togglePolarity();
      const polarityLabel = document.getElementById('hud-polarity');
      if (polarityLabel) {
        polarityLabel.innerText = `${this.magman.polarityLower === 'S' ? 'SUL' : 'NORTE'}/${this.magman.polarityUpper === 'S' ? 'SUL' : 'NORTE'}`;
        polarityLabel.style.color = this.magman.polarityLower === 'S' ? '#38bdf8' : '#ef4444';
      }
    }
  }

  triggerAction() {
    if (!this.magman) return;

    if (this.magman.carryingRock) {
      const rock = this.magman.carryingRock;
      rock.isLaunched = true;
      rock.vy = CONFIG.LAUNCH_IMPULSE_VY;
      this.launchedRocks.push(rock);
      this.magman.carryingRock = null;
      return;
    }

    const block = this.terrain.mineDirectional(
      this.magman.x,
      this.magman.y,
      this.magman.width,
      this.magman.height,
      this.magman.facing
    );

    if (block) {
      this.magman.carryingRock = {
        type: block.type,
        polarityTop: block.polarityTop,
        size: CONFIG.BLOCK_SIZE,
        x: this.magman.x + (this.magman.width / 2) - (CONFIG.BLOCK_SIZE / 2),
        y: this.magman.y - CONFIG.BLOCK_SIZE - 4,
        isLaunched: false,
        vy: 0
      };
    }
  }

  startMission() {
    this.switchView('screen-gameplay');
    this.resizeViewport();

    this.cargoCollected = 0;
    this.launchedRocks = [];
    document.getElementById('hud-cargo').innerText = `0/${this.activePlanet.targetCargo}`;

    const vWidth = this.viewport.width;
    const vHeight = this.viewport.height;

    this.camera = new Camera(vWidth, vHeight, CONFIG.WORLD_WIDTH);
    this.parallax = new BackgroundParallax(CONFIG.WORLD_WIDTH, this.activePlanet);
    this.terrain = new Terrain(CONFIG.WORLD_WIDTH, vHeight, this.activePlanet);
    this.particles = new ParticleSystem();
    this.asteroids = new AsteroidBelt(CONFIG.WORLD_WIDTH, this.activePlanet.speedMultiplier || 1.0);
    this.ship = new CargoShip(this.activeShip, CONFIG.WORLD_WIDTH);
    this.magman = new Magman(CONFIG.WORLD_WIDTH / 2, vHeight - 240);

    this.running = true;
    requestAnimationFrame(() => this.gameLoop());
  }

  gameLoop() {
    if (!this.running) return;
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    this.magman.update(this.keys, this.terrain);
    this.camera.follow(this.magman.x);
    this.terrain.update();
    this.ship.update(this.magman.x, this.magman.width);
    this.particles.update();

    if (this.magman.y > this.terrain.getCoreThresholdY()) {
      this.triggerGameOver("Magman desceu além da litosfera e caiu no manto superaquecido!");
      return;
    }

    this.asteroids.update(this.magman, (failMsg) => {
      this.triggerGameOver(failMsg);
    });

    const exposedBoxes = this.ship.getExposedCargoBoundingBoxes();
    this.asteroids.asteroids.forEach(ast => {
      for (let bIdx = exposedBoxes.length - 1; bIdx >= 0; bIdx--) {
        const box = exposedBoxes[bIdx];
        const dx = (box.x + box.size / 2) - ast.x;
        const dy = (box.y + box.size / 2) - ast.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ast.radius + (box.size / 2)) {
          this.particles.shatterBlock(box.x, box.y, box.type);
          this.ship.removeTopCargo();
          this.cargoCollected = Math.max(0, this.cargoCollected - 1);
          document.getElementById('hud-cargo').innerText = `${this.cargoCollected}/${this.activePlanet.targetCargo}`;
          exposedBoxes.splice(bIdx, 1);
          break;
        }
      }
    });

    for (let i = this.launchedRocks.length - 1; i >= 0; i--) {
      const rock = this.launchedRocks[i];
      rock.y += rock.vy;

      this.asteroids.asteroids.forEach(ast => {
        const dx = (rock.x + rock.size / 2) - ast.x;
        const dy = (rock.y + rock.size / 2) - ast.y;
        if (Math.sqrt(dx * dx + dy * dy) < ast.radius + (rock.size / 2)) {
          this.particles.shatterBlock(rock.x, rock.y, rock.type);
          this.launchedRocks.splice(i, 1);
        }
      });

      const shipBottomY = this.ship.y + this.ship.height;
      if (
        rock.y <= shipBottomY + 12 &&
        rock.x + rock.size >= this.ship.x &&
        rock.x <= this.ship.x + this.ship.width
      ) {
        this.launchedRocks.splice(i, 1);
        const added = this.ship.addCargo(rock.type);
        if (added) {
          this.cargoCollected++;
          document.getElementById('hud-cargo').innerText = `${this.cargoCollected}/${this.activePlanet.targetCargo}`;
          if (this.cargoCollected >= this.activePlanet.targetCargo) {
            this.triggerVictory();
          }
        }
      }
    }

    const altitude = Math.max(0, 1 - (this.magman.y / this.viewport.height));
    const gauge = document.getElementById('mag-gauge');
    if (gauge) gauge.style.height = `${altitude * 100}%`;
  }

  render() {
    this.ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);

    this.parallax.render(this.ctx, this.camera.x, this.viewport.width, this.viewport.height);
    this.terrain.render(this.ctx, this.camera.x);
    this.ship.render(this.ctx, this.camera.x);
    this.asteroids.render(this.ctx, this.camera.x);
    this.particles.render(this.ctx, this.camera.x);

    this.launchedRocks.forEach(r => {
      this.ctx.fillStyle = r.type === 'FERRO' ? '#b91c1c' : (r.type === 'PARA' ? '#047857' : '#d97706');
      this.ctx.fillRect(r.x - this.camera.x, r.y, r.size, r.size);
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 1.5;
      ctx.strokeRect(r.x - this.camera.x, r.y, r.size, r.size);
    });

    this.magman.render(this.ctx, this.camera.x);
  }

  triggerGameOver(reason) {
    this.running = false;
    document.getElementById('gameover-reason').innerText = reason;
    document.getElementById('gameover-stats').innerText = 
      `Carga acoplada antes da perda de sinal: ${this.cargoCollected}/${this.activePlanet.targetCargo} blocos.`;
    document.getElementById('modal-gameover').classList.remove('hidden');
  }

  async triggerVictory() {
    this.running = false;
    this.activePlanet.completed = true;
    this.renderPlanetsMenu();
    await DatabaseService.submitScore(5000);
    document.getElementById('victory-stats').innerText = 
      `Plataforma abastecida com 20 blocos! Planeta ${this.activePlanet.name} catalogado com sucesso (+5.000 pts).`;
    document.getElementById('modal-victory').classList.remove('hidden');
  }
}

window.onload = () => new MagmanApp();