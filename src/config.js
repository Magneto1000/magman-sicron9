/**
 * MAGMAN: SICRON 9 - CONFIGURAÇÕES GLOBAIS DO SISTEMA
 * Arquivo: src/config.js
 */

export const CONFIG = {
  GRAVITY: 0.38,
  BLOCK_SIZE: 36,               // Tamanho unificado dos blocos (36x36 px)
  ASTEROID_BELT_Y: 200,         // Altitude segura no corredor superior
  ASTEROID_BASE_SPEED: 1.2,     // Velocidade cadenciada
  ASTEROID_COUNT: 7,
  MAGNETIC_PULL_BASE: 0.38,
  LAUNCH_IMPULSE_VY: -12.0,     // Impulso de arremesso vertical
  MISSION_TIME_LIMIT: 600,      // 10 minutos (600 segundos)
  TARGET_CARGO: 10              // Apenas 10 blocos para finalizar a missão
};

/**
 * GERADOR DOS 50 PLANETAS DO SISTEMA SICRON 9
 */
const PLANET_NAMES = [
  "Ferrum-9", "Dia-Vortex", "Paramag-Alpha", "Aethelgard Prime", "Sicron Core",
  "Aura-X", "Chronos-7", "Krypton-IV", "Zephyr-B", "Vulkan-Major",
  "Triton-Echo", "Nova-Terra", "Pyros-3", "Gliese-Mag", "Helios-99",
  "Styx-Prime", "Hyperion-Z", "Xenon-Gate", "Titan-V", "Electra-Prime",
  "Cobalt-Deep", "Sulphur-6", "Quark-Beta", "Polaris-Ion", "Bismuth-Ridge",
  "Draco-Vault", "Nebula-Crest", "Apex-Sicron", "Magma-V", "Obsidian-9",
  "Aether-Alpha", "Cryo-Peak", "Tharsis-Flux", "Radium-7", "Plasma-Vein",
  "Neutron-Bay", "Vortex-End", "Solaris-Delta", "Onyx-Deep", "Flux-Canyon",
  "Kalyx-Prime", "Zinc-Core", "Orion-Trench", "Cinder-4", "Quantum-Rest",
  "Cortex-Prime", "Titanium-Gate", "Helix-Zero", "Omega-Sicron", "Aethel-Genesis"
];

const ATMOSPHERES = [
  { name: "Âmbar Sulfúrico", grad: ["#451a03", "#7c2d12", "#c2410c"], color: "#ea580c" },
  { name: "Glacial Ciano", grad: ["#082f49", "#0369a1", "#0284c7"], color: "#0284c7" },
  { name: "Verde Esmeralda Tóxica", grad: ["#022c22", "#065f46", "#059669"], color: "#059669" },
  { name: "Ocre Radioativo", grad: ["#292524", "#78350f", "#d97706"], color: "#d97706" },
  { name: "Púrpura Quântica", grad: ["#3b0764", "#701a75", "#db2777"], color: "#db2777" },
  { name: "Índigo Plasma", grad: ["#1e1b4b", "#312e81", "#4f46e5"], color: "#6366f1" }
];

const LITHOSPHERES = [
  { name: "Rochas Basálticas e Hematita", color: "#7c2d12" },
  { name: "Silicato Diamagnético", color: "#0f172a" },
  { name: "Cromo e Serpentina", color: "#064e3b" },
  { name: "Pirita Dourada Partida", color: "#451a03" },
  { name: "Crosta Magmática Negra", color: "#18181b" },
  { name: "Grafeno Cristalino", color: "#1e293b" }
];

const VEGETATIONS = [
  { name: "Agulhas Cristalinas de Ferro", color: "#f97316" },
  { name: "Fungos Luminescentes Criogênicos", color: "#38bdf8" },
  { name: "Musgo de Esporos e Filamentos", color: "#34d399" },
  { name: "Raízes Fósseis Condutoras", color: "#fbbf24" },
  { name: "Filamentos de Pura Energia", color: "#f472b6" },
  { name: "Gavinhas Espirais Metálicas", color: "#a855f7" }
];

export const PLANETS = Array.from({ length: 50 }, (_, i) => {
  const atm = ATMOSPHERES[i % ATMOSPHERES.length];
  const lith = LITHOSPHERES[(i * 2) % LITHOSPHERES.length];
  const veg = VEGETATIONS[(i * 3) % VEGETATIONS.length];
  const polarity = (i % 2 === 0) ? 'N' : 'S';

  return {
    id: i + 1,
    name: PLANET_NAMES[i],
    color: atm.color,
    nativePolarity: polarity,
    targetCargo: CONFIG.TARGET_CARGO,
    speedMultiplier: 1.0 + (i * 0.015),
    hazardLevel: i < 15 ? "MODERADO" : (i < 35 ? "ALTO" : "EXTREMO"),
    atmosphereName: atm.name,
    skyGradient: atm.grad,
    lithosphereName: lith.name,
    lithoColor: lith.color,
    vegetationName: veg.name,
    vegColor: veg.color,
    completed: false
  };
});

/**
 * PLATAFORMA CARGUEIRA COM CAPACIDADE 10
 */
export const SHIPS = [
  {
    id: "titan-platform-10",
    name: "Plataforma Orbital Titan Deca",
    capacity: 10,
    hullWidth: 220,
    hullHeight: 26,
    cargoColumns: 5,
    cargoRows: 2
  }
];