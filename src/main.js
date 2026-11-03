/**
 * LOOP PRINCIPAL E ORQUESTRAÇÃO GERAL
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
import { CrabManager } from './crabs.js';

class MagmanApp {
  constructor() {
    this.activePlanet = null;
    this.activeShip = null;
    this.running = false;
    this.cargoCollected = 0;
    this.launchedRocks = [];
    
    this.touchMoveDirection = 0;
    this.isTouchingScreen = false;

    this.missionTimeRemaining = CONFIG.MISSION_TIME_SECONDS || 240;
    this.lastFrameTime = performance.now();

    this.initDOM();
  }

  initDOM() {
    this.viewport = document.getElementById('viewport');
    if (this.viewport) {
      this.ctx = this.viewport.getContext('2d');
    }

    this.drawLoginAvatar();

    window.addEventListener('resize', () => {
      this.resizeViewport();
    });

    const safeBind = (id, handler) => {
      const el = document.getElementById(id);
      if (el) el.onclick = handler;
    };

    // BOTÃO ENTRAR
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('input-email');
        const passInput = document.getElementById('input-password');
        const email = emailInput ? emailInput.value.trim() : "astronauta@sicron.org";
        const pass = passInput ? passInput.value.trim() : "123456";
        
        const rememberEl = document.getElementById('auth-remember');
        const remember = rememberEl ? rememberEl.checked : true;

        if (!email || !pass) {
          alert("Por favor, preencha o piloto/e-mail e a palavra-passe para aceder.");
          return;
        }

        const res = await DatabaseService.login(email, pass, remember);
        if (res && res.error) {
          alert(`Erro ao entrar: ${res.error.message}`);
          return;
        }

        this.updateProfileUI();
        this.switchView('screen-planets');
      });
    }

    // BOTÃO REGISTAR
    const btnSignup = document.getElementById('btn-signup');
    if (btnSignup) {
      btnSignup.addEventListener('click', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('input-email');
        const passInput = document.getElementById('input-password');
        const email = emailInput ? emailInput.value.trim() : "astronauta@sicron.org";
        const pass = passInput ? passInput.value.trim() : "123456";

        const rememberEl = document.getElementById('auth-remember');
        const remember = rememberEl ? rememberEl.checked : true;

        if (!email || !pass) {
          alert("Por favor, preencha o piloto/e-mail e defina uma palavra-passe.");
          return;
        }

        const res = await DatabaseService.register(email, pass, remember);
        if (res && res.error) {
          if (res.error.code === 'auth/email-already-in-use') {
            alert("Este piloto já está registado! Por favor, utilize o botão ENTRAR.");
          } else {
            alert(`Aviso de registo: ${res.error.message}`);
          }
          return;
        }

        alert("Piloto registado com sucesso!");
        this.updateProfileUI();
        this.switchView('screen-planets');
      });
    }

    safeBind('btn-logout', async () => {
      await DatabaseService.logout();
      this.switchView('screen-auth');
    });

    safeBind('btn-open-tips', () => {
      const modal = document.getElementById('modal-tips');
      if (modal) modal.classList.remove('hidden');
      else this.startMission();
    });

    safeBind('btn-start-game-confirmed', () => {
      const modal = document.getElementById('modal-tips');
      if (modal) modal.classList.add('hidden');
      this.startMission();
    });

    safeBind('btn-view-ranking', () => this.openLeaderboard());
    safeBind('btn-close-ranking', () => {
      const modal = document.getElementById('modal-ranking');
      if (modal) modal.classList.add('hidden');
    });

    safeBind('btn-cancel-briefing', () => this.switchView('screen-planets'));

    safeBind('btn-gameover-retry', () => {
      const modal = document.getElementById('modal-gameover');
      if (modal) modal.classList.add('hidden');
      this.startMission();
    });

    safeBind('btn-gameover-menu', () => {
      const modal = document.getElementById('modal-gameover');
      if (modal) modal.classList.add('hidden');
      this.switchView('screen-planets');
    });

    safeBind('btn-victory-continue', () => {
      const modal = document.getElementById('modal-victory');
      if (modal) modal.classList.add('hidden');
      this.switchView('screen-planets');
    });

    safeBind('btn-all-continue', () => {
      const modal = document.getElementById('modal-all-conquered');
      if (modal) modal.classList.add('hidden');
      this.switchView('screen-planets');
    });

    this.bindControls();
    this.renderPlanetsMenu();
  }

  updateProfileUI() {
    const p = DatabaseService.profile || {};
    const nameEl = document.getElementById('user-display-name');
    if (nameEl) nameEl.innerText = p.username || "Piloto";

    const countEl = document.getElementById('user-conquered-count');
    if (countEl) countEl.innerText = `${p.conqueredPlanets || 0}/50 Planetas`;
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

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(17, 10, 10, 6);
    ctx.fillRect(63, 10, 10, 6);

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(28, 58, 12, 34);
    ctx.fillRect(50, 58, 12, 34);
  }

  // REDIMENSIONAMENTO INTELIGENTE: SEPARA VERTICAL (NATIVO) DE HORIZONTAL (VIRTUAL 600PX)
  resizeViewport() {
    const container = document.getElementById('screen-gameplay');
    const screenW = (container && container.clientWidth) ? container.clientWidth : window.innerWidth;
    const screenH = (container && container.clientHeight) ? container.clientHeight : window.innerHeight;

    const isLandscape = (screenW > screenH) && (screenH < 560);

    if (isLandscape) {
      // No modo paisagem, fixa 600px de altura útil e estende a largura proporcionalmente
      const TARGET_VIRTUAL_HEIGHT = 600;
      const aspect = screenW / screenH;
      this.viewport.height = TARGET_VIRTUAL_HEIGHT;
      this.viewport.width = Math.round(TARGET_VIRTUAL_HEIGHT * aspect);
    } else {
      // No modo retrato, mantém 1:1 nativo exatamente como já estava perfeito
      this.viewport.width = screenW;
      this.viewport.height = screenH;
    }

    if (this.camera) {
      this.camera.viewportWidth = this.viewport.width;
      this.camera.viewportHeight = this.viewport.height;
    }

    if (this.ship && typeof this.ship.resize === 'function') {
      this.ship.resize(this.viewport.height);
    }

    if (this.terrain && typeof this.terrain.resize === 'function') {
      this.terrain.resize(this.viewport.height);
      if (this.magman && this.magman.y + this.magman.height > this.terrain.groundStartY) {
        this.magman.y = this.terrain.groundStartY - this.magman.height;
        this.magman.vy = 0;
      }
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
          <span style="font-size:9px; color:#94a3b8;">${p.atmosphereName}</span>
        </div>
      `;
      card.onclick = () => this.openBriefing(p);
      matrix.appendChild(card);
    });
  }

  openBriefing(planet) {
    this.activePlanet = planet;
    this.activeShip = SHIPS[0];

    const titleEl = document.getElementById('briefing-planet-title');
    if (titleEl) titleEl.innerText = planet.name;

    const atmoEl = document.getElementById('briefing-atmosphere');
    if (atmoEl) atmoEl.innerText = planet.atmosphereName || "Atmosfera Padrão";

    const lithoEl = document.getElementById('briefing-lithosphere');
    if (lithoEl) lithoEl.innerText = planet.lithosphereName || "Litosfera Basáltica";

    const vegEl = document.getElementById('briefing-vegetation');
    if (vegEl) vegEl.innerText = planet.vegetationName || "Vegetação Nativa";

    const polEl = document.getElementById('briefing-polarity');
    if (polEl) polEl.innerText = planet.nativePolarity === 'N' ? 'NORTE (+)' : 'SUL (-)';

    const shipInfoEl = document.getElementById('briefing-ship-info');
    if (shipInfoEl) shipInfoEl.innerText = `${this.activeShip.name} (Capacidade: 10 blocos magnéticos suspensos).`;

    const baseForce = Number(planet.baseRepulseForce) || 8.2;

    const descEl = document.getElementById('briefing-tactical-desc');
    if (descEl) {
      descEl.innerText = `Força magnética de salto básica do solo: ${baseForce.toFixed(1)} N. Extraia 10 blocos e lance-os na nave antes que os 4 minutos se esgotem.`;
    }

    this.switchView('screen-briefing');
  }

  async openLeaderboard() {
    const modal = document.getElementById('modal-ranking');
    const list = document.getElementById('leaderboard-list');
    if (modal) modal.classList.remove('hidden');
    if (list) list.innerHTML = "<li style='padding:8px;'>Consultando Federação...</li>";

    const scores = await DatabaseService.getLeaderboard();
    if (list) {
      list.innerHTML = scores.map((s, idx) => `
        <li style="margin-bottom:8px; font-size:12px; border-bottom:1px solid #1e293b; padding-bottom:4px;">
          <span style="color:#38bdf8;">${idx + 1}.</span> ${s.username} — <strong>${s.conqueredPlanets || 0} planetas conquistados</strong>
        </li>
      `).join('');
    }
  }

  bindControls() {
    if (this.viewport) {
      const handleTouchMovement = (clientX) => {
        if (!this.magman || !this.camera) return;

        // Converte o toque da tela física para a coordenada virtual do Canvas
        const rect = this.viewport.getBoundingClientRect();
        const scaleX = this.viewport.width / rect.width;
        const canvasTouchX = (clientX - rect.left) * scaleX;

        const magmanScreenX = this.magman.x - this.camera.x;
        this.touchMoveDirection = canvasTouchX < magmanScreenX ? -1 : 1;
      };

      this.viewport.addEventListener('pointerdown', (e) => {
        this.isTouchingScreen = true;
        handleTouchMovement(e.clientX);
      });

      this.viewport.addEventListener('pointermove', (e) => {
        if (this.isTouchingScreen) handleTouchMovement(e.clientX);
      });

      const stopTouch = () => {
        this.isTouchingScreen = false;
        this.touchMoveDirection = 0;
      };
      this.viewport.addEventListener('pointerup', stopTouch);
      this.viewport.addEventListener('pointercancel', stopTouch);
    }

    const btnPolarity = document.getElementById('ctrl-polarity');
    if (btnPolarity) {
      btnPolarity.onclick = () => this.toggleMagmanPolarity();
    }

    const btnAction = document.getElementById('ctrl-action');
    if (btnAction) {
      btnAction.onclick = () => this.triggerAction();
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.touchMoveDirection = -1;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.touchMoveDirection = 1;
      if (e.code === 'KeyW' || e.code === 'ShiftLeft' || e.code === 'KeyC') this.toggleMagmanPolarity();
      if (e.code === 'Space' || e.code === 'KeyE') this.triggerAction();
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        this.touchMoveDirection = 0;
      }
    });
  }

  toggleMagmanPolarity() {
    if (!this.magman) return;
    this.magman.togglePolarity();
    this.updatePolarityUI();
  }

  updatePolarityUI() {
    const isSouth = this.magman.polarityLower === 'S';
    const activeColor = isSouth ? '#0284c7' : '#ef4444';

    const btnPolarity = document.getElementById('ctrl-polarity');
    if (btnPolarity) {
      btnPolarity.style.backgroundColor = activeColor;
      btnPolarity.style.borderColor = isSouth ? '#38bdf8' : '#f87171';
    }

    const polarityLabel = document.getElementById('hud-polarity');
    if (polarityLabel) {
      polarityLabel.innerText = `${isSouth ? 'SUL' : 'NORTE'}/${this.magman.polarityUpper === 'S' ? 'SUL' : 'NORTE'}`;
      polarityLabel.style.color = activeColor;
    }
  }

  updateActionBtnUI() {
    const btnAction = document.getElementById('ctrl-action');
    if (!btnAction || !this.magman) return;

    if (this.magman.carryingRock) {
      btnAction.innerText = "JOGAR";
      btnAction.style.backgroundColor = "#ea580c";
      btnAction.style.borderColor = "#fb923c";
    } else {
      btnAction.innerText = "PEGAR";
      btnAction.style.backgroundColor = "#059669";
      btnAction.style.borderColor = "#34d399";
    }
  }

  updateLivesUI() {
    const lives = this.magman ? this.magman.lives : 3;
    for (let i = 1; i <= 3; i++) {
      const slot = document.getElementById(`life-${i}`);
      if (slot) {
        if (i <= lives) {
          slot.classList.remove('lost');
        } else {
          slot.classList.add('lost');
        }
      }
    }
  }

  handleDamage(reason) {
    if (!this.magman || this.magman.isInvulnerable) return;

    const damaged = this.magman.takeDamage();
    if (damaged) {
      this.updateLivesUI();

      if (this.particles && typeof this.particles.emit === 'function') {
        this.particles.emit(
          this.magman.x + this.magman.width / 2,
          this.magman.y + this.magman.height / 2,
          '#ef4444',
          14
        );
      }

      if (this.magman.lives <= 0) {
        this.triggerGameOver(reason);
      }
    }
  }

  triggerAction() {
    if (!this.magman) return;

    if (this.magman.carryingRock) {
      const rock = this.magman.carryingRock;
      const bSize = CONFIG.BLOCK_SIZE || 36;
      rock.isLaunched = true;
      rock.size = bSize;

      rock.x = this.magman.x + (this.magman.width / 2) - (bSize / 2);
      rock.y = this.magman.y - bSize - 4;
      rock.vy = CONFIG.LAUNCH_IMPULSE_VY || -12.0;

      this.launchedRocks.push(rock);
      this.magman.carryingRock = null;
      this.updateActionBtnUI();
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
      if (this.particles && typeof this.particles.shatterBlock === 'function') {
        this.particles.shatterBlock(block.x + block.size / 2, block.y + block.size / 2, block.type);
      }

      this.magman.carryingRock = {
        type: block.type,
        polarityTop: block.polarityTop,
        size: CONFIG.BLOCK_SIZE || 36,
        x: this.magman.x + (this.magman.width / 2) - ((CONFIG.BLOCK_SIZE || 36) / 2),
        y: this.magman.y - (CONFIG.BLOCK_SIZE || 36) - 4,
        isLaunched: false,
        vy: 0
      };
      this.updateActionBtnUI();
    }
  }

  startMission() {
    this.switchView('screen-gameplay');
    this.resizeViewport();

    this.cargoCollected = 0;
    this.launchedRocks = [];
    this.missionTimeRemaining = CONFIG.MISSION_TIME_SECONDS || 240;
    this.lastFrameTime = performance.now();

    const cargoHud = document.getElementById('hud-cargo');
    if (cargoHud) cargoHud.innerText = `0/${this.activePlanet.targetCargo}`;
    this.updateActionBtnUI();

    const vWidth = this.viewport.width;
    const vHeight = this.viewport.height;

    this.camera = new Camera(vWidth, vHeight);
    this.parallax = new BackgroundParallax(this.activePlanet);
    this.terrain = new Terrain(vHeight, this.activePlanet);
    this.particles = new ParticleSystem();
    this.ship = new CargoShip(this.activeShip, 0, vHeight);

    // Altitude equilibrada: Asteroides sempre no centro do corredor aéreo
    const shipBottom = this.ship.y + this.ship.height + 24;
    const groundTop = this.terrain.groundStartY;
    const midSkyY = shipBottom + (groundTop - shipBottom) * 0.44;

    this.asteroids = new AsteroidBelt(this.activePlanet.speedMultiplier || 1.0, midSkyY);

    // Magman de pé no solo com ampla altura livre até os asteroides
    const magmanStartY = this.terrain.groundStartY - 54;
    this.magman = new Magman(0, magmanStartY);
    this.crabs = new CrabManager();

    this.magman.lives = 3;
    this.updateLivesUI();

    this.crabs.spawnWave(this.camera.x, vWidth, this.terrain.groundStartY);
    this.updatePolarityUI();

    this.running = true;
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  gameLoop(currentTime) {
    if (!this.running) return;

    const deltaSec = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    this.update(deltaSec);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(deltaSec) {
    this.missionTimeRemaining -= deltaSec;
    if (this.missionTimeRemaining <= 0) {
      this.missionTimeRemaining = 0;
      this.updateTimerBarUI();
      this.triggerGameOver("O tempo da missão esgotou! A nave de carga partiu e você foi deixado para trás.");
      return;
    }
    this.updateTimerBarUI();

    this.magman.update(this.touchMoveDirection, this.terrain, deltaSec);
    this.camera.follow(this.magman.x);
    this.terrain.update();
    this.ship.update(this.magman.x, this.magman.width);
    this.particles.update();

    this.crabs.updateTimer(deltaSec);
    if (this.crabs.spawnTimer === 0 && this.crabs.crabs.length < 20) {
      this.crabs.spawnWave(this.camera.x, this.viewport.width, this.terrain.groundStartY);
    }
    this.crabs.update(this.magman, this.terrain, (failMsg) => {
      this.handleDamage(failMsg);
    }, deltaSec);

    if (this.magman.y > this.terrain.getCoreThresholdY()) {
      this.triggerGameOver("Magman desceu além da litosfera e caiu no manto superaquecido!");
      return;
    }

    const shipBottom = this.ship.y + this.ship.height + 20;
    const currentBeltY = shipBottom + (this.terrain.groundStartY - shipBottom) * 0.44;

    this.asteroids.update(
      this.magman,
      (failMsg) => { this.handleDamage(failMsg); },
      this.camera.x,
      this.viewport.width,
      currentBeltY
    );

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
          const cargoHud = document.getElementById('hud-cargo');
          if (cargoHud) cargoHud.innerText = `${this.cargoCollected}/${this.activePlanet.targetCargo}`;
          exposedBoxes.splice(bIdx, 1);
          break;
        }
      }
    });

    const shipCenterX = this.ship.x + (this.ship.width / 2);
    const shipBottomY = this.ship.y + this.ship.height;

    for (let i = this.launchedRocks.length - 1; i >= 0; i--) {
      const rock = this.launchedRocks[i];

      const targetRockX = shipCenterX - (rock.size / 2);
      rock.x += (targetRockX - rock.x) * 0.22;
      rock.y += rock.vy;

      let destroyed = false;
      this.asteroids.asteroids.forEach(ast => {
        if (destroyed) return;
        const dx = (rock.x + rock.size / 2) - ast.x;
        const dy = (rock.y + rock.size / 2) - ast.y;
        if (Math.hypot(dx, dy) < ast.radius + (rock.size / 2)) {
          if (this.particles && typeof this.particles.shatterBlock === 'function') {
            this.particles.shatterBlock(rock.x + rock.size / 2, rock.y + rock.size / 2, rock.type);
          }
          destroyed = true;
        }
      });

      if (destroyed) {
        this.launchedRocks.splice(i, 1);
        continue;
      }

      if (
        rock.y <= shipBottomY + 16 &&
        rock.x + rock.size >= this.ship.x - 30 &&
        rock.x <= this.ship.x + this.ship.width + 30
      ) {
        this.launchedRocks.splice(i, 1);
        const added = this.ship.addCargo(rock.type);
        if (added) {
          this.cargoCollected++;
          const cargoHud = document.getElementById('hud-cargo');
          if (cargoHud) cargoHud.innerText = `${this.cargoCollected}/${this.activePlanet.targetCargo}`;

          if (this.particles && typeof this.particles.emit === 'function') {
            this.particles.emit(shipCenterX, shipBottomY + 8, '#38bdf8', 16, 3.5);
          }

          if (this.cargoCollected >= this.activePlanet.targetCargo) {
            this.triggerVictory();
          }
        }
        continue;
      }

      if (rock.y < -100) {
        this.launchedRocks.splice(i, 1);
      }
    }

    const altitude = Math.max(0, 1 - (this.magman.y / this.viewport.height));
    const gauge = document.getElementById('mag-gauge');
    if (gauge) gauge.style.height = `${altitude * 100}%`;
  }

  updateTimerBarUI() {
    const total = CONFIG.MISSION_TIME_SECONDS || 240;
    const pct = Math.max(0, (this.missionTimeRemaining / total) * 100);
    const fill = document.getElementById('mission-timer-fill');
    if (fill) fill.style.width = `${pct}%`;

    const mins = Math.floor(this.missionTimeRemaining / 60);
    const secs = Math.floor(this.missionTimeRemaining % 60);
    const text = document.getElementById('mission-timer-label');
    if (text) {
      text.innerText = `TEMPO: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);

    this.parallax.render(ctx, this.camera.x, this.viewport.width, this.viewport.height);
    this.terrain.render(ctx, this.camera.x, this.viewport.width);
    this.ship.render(ctx, this.camera.x);
    this.asteroids.render(ctx, this.camera.x, this.viewport.width);
    this.crabs.render(ctx, this.camera.x);
    this.particles.render(ctx, this.camera.x);

    const shipScreenCenterX = (this.ship.x + (this.ship.width / 2)) - this.camera.x;
    const shipBottomY = this.ship.y + this.ship.height;

    this.launchedRocks.forEach(r => {
      const rx = r.x - this.camera.x;

      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(shipScreenCenterX, shipBottomY);
      ctx.lineTo(rx + r.size / 2, r.y);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = r.type === 'FERRO' ? '#b91c1c' : (r.type === 'PARA' ? '#047857' : '#d97706');
      ctx.fillRect(rx, r.y, r.size, r.size);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx, r.y, r.size, r.size);
    });

    this.magman.render(ctx, this.camera.x);
  }

  triggerGameOver(reason) {
    this.running = false;
    const reasonEl = document.getElementById('gameover-reason');
    if (reasonEl) reasonEl.innerText = reason;

    const statsEl = document.getElementById('gameover-stats');
    if (statsEl) {
      statsEl.innerText = `Carga acoplada antes da perda de sinal: ${this.cargoCollected}/${this.activePlanet.targetCargo} blocos.`;
    }

    const modal = document.getElementById('modal-gameover');
    if (modal) modal.classList.remove('hidden');
  }

  async triggerVictory() {
    this.running = false;
    this.activePlanet.completed = true;
    await DatabaseService.addPlanetConquered();
    this.updateProfileUI();
    this.renderPlanetsMenu();

    const conqueredCount = (DatabaseService.profile && DatabaseService.profile.conqueredPlanets) || 0;
    if (conqueredCount >= 50) {
      const allModal = document.getElementById('modal-all-conquered');
      if (allModal) allModal.classList.remove('hidden');
    } else {
      const statsEl = document.getElementById('victory-stats');
      if (statsEl) {
        statsEl.innerText = `Plataforma abastecida com 10 blocos! Planeta ${this.activePlanet.name} catalogado (+1 Conquistado). Total: ${conqueredCount}/50.`;
      }
      const vicModal = document.getElementById('modal-victory');
      if (vicModal) vicModal.classList.remove('hidden');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new MagmanApp());
} else {
  new MagmanApp();
}