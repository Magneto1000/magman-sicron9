/**
 * MAGMAN: SICRON 9 - CONFIGURAÇÕES GLOBAIS DO SISTEMA
 * Arquivo: src/config.js
 */

export const CONFIG = {
  WORLD_WIDTH: 2600,             // Largura total explorável lateralmente
  VIEWPORT_HEIGHT: 750,          // Altura base de referência
  GRAVITY: 0.38,                 // Aceleração da gravidade no Magman e blocos do solo
  BLOCK_SIZE: 36,                // Tamanho unificado dos blocos (36x36 px)

  // Cinturão de Asteroides
  ASTEROID_BELT_Y: 230,          // Altitude intermediária do cinturão
  ASTEROID_BASE_SPEED: 1.3,      // Velocidade desacelerada (movimento cadenciado)
  ASTEROID_COUNT: 8,             // Quantidade equilibrada na tela
  MAGNETIC_PULL_BASE: 0.40,      // Atração dipolar controlável

  // Propulsão
  LAUNCH_IMPULSE_VY: -12.0       // Impulso de repulsão vertical do arremesso
};

/**
 * PLANETAS DO SISTEMA SICRON 9
 */
export const PLANETS = [
  {
    id: 1,
    name: "Ferrum-9",
    color: "#ea580c",
    nativePolarity: "N",
    targetCargo: 20,
    speedMultiplier: 1.0,
    hazardLevel: "MODERADO",
    atmosphereName: "Âmbar Sulfúrico Térmico",
    skyGradient: ["#451a03", "#7c2d12", "#c2410c"],
    lithosphereName: "Rochas Basálticas e Hematita Oxidada",
    lithoColor: "#7c2d12",
    vegetationName: "Agulhas Cristalinas de Ferro",
    vegColor: "#f97316",
    completed: false
  },
  {
    id: 2,
    name: "Dia-Vortex",
    color: "#0284c7",
    nativePolarity: "S",
    targetCargo: 20,
    speedMultiplier: 1.15,
    hazardLevel: "MÉDIO",
    atmosphereName: "Glacial Ciano Rarefeita",
    skyGradient: ["#082f49", "#0369a1", "#0284c7"],
    lithosphereName: "Silicato Diamagnético e Cobalto Puro",
    lithoColor: "#0f172a",
    vegetationName: "Fungos Luminescentes Criogênicos",
    vegColor: "#38bdf8",
    completed: false
  },
  {
    id: 3,
    name: "Paramag-Alpha",
    color: "#059669",
    nativePolarity: "N",
    targetCargo: 20,
    speedMultiplier: 1.25,
    hazardLevel: "ALTO",
    atmosphereName: "Verde Esmeralda Tóxica Densa",
    skyGradient: ["#022c22", "#065f46", "#059669"],
    lithosphereName: "Minérios Paramagnéticos de Cromo",
    lithoColor: "#064e3b",
    vegetationName: "Musgo de Esporos e Filamentos",
    vegColor: "#34d399",
    completed: false
  },
  {
    id: 4,
    name: "Aethelgard Prime",
    color: "#d97706",
    nativePolarity: "S",
    targetCargo: 20,
    speedMultiplier: 1.35,
    hazardLevel: "CRÍTICO",
    atmosphereName: "Ocre Dourado / Radiação Ionizante",
    skyGradient: ["#292524", "#78350f", "#d97706"],
    lithosphereName: "Pirita Dourada e Crosta Tectônica",
    lithoColor: "#451a03",
    vegetationName: "Raízes Fósseis e Gavinhas Condutoras",
    vegColor: "#fbbf24",
    completed: false
  },
  {
    id: 5,
    name: "Sicron Core",
    color: "#db2777",
    nativePolarity: "N",
    targetCargo: 20,
    speedMultiplier: 1.5,
    hazardLevel: "EXTREMO",
    atmosphereName: "Púrpura Quântica de Plasma",
    skyGradient: ["#3b0764", "#701a75", "#db2777"],
    lithosphereName: "Crosta Magmática Hiper-Radiativa",
    lithoColor: "#18181b",
    vegetationName: "Filamentos de Pura Energia Violeta",
    vegColor: "#f472b6",
    completed: false
  }
];

/**
 * PLATAFORMA CARGUEIRA
 */
export const SHIPS = [
  {
    id: "titan-platform",
    name: "Plataforma Orbital Titan V-20",
    capacity: 20,
    hullWidth: 260,
    hullHeight: 28,
    cargoColumns: 5,
    cargoRows: 4
  }
];