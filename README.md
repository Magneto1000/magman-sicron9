# 🧲 MAGMAN: Sicron 9

> Web App mobile-first de exploração espacial e física eletromagnética, desenvolvido em JavaScript modular (ES6+), HTML5 Canvas e CSS3, com persistência e ranking em tempo real via Firebase.

---

## 🚀 Sobre o Jogo

Em **MAGMAN**, o jogador assume o papel de um astronauta minerador encarregado pela Federação de extrair recursos estratégicos nos confins inóspitos do sistema **Sicron 9**. O avatar possui um traje eletromagnético bipartido e deve explorar a litosfera planetária, minerar blocos magnéticos e arremessá-los até a plataforma cargueira orbital, enquanto desvia do campo atrativo de um cinturão de asteroides cadenciados.

### 🎮 Mecânicas Principais

* **Corpo Bi-Particípio & Magnetismo**:
  * Os membros superiores e inferiores possuem polaridades opostas (**Norte [N]** e **Sul [S]**).
  * O jogador alterna as polaridades por meio de um comando dedicado.
  * **Interação com o Solo**: Mesma polaridade gera atração e fixação mecânica; polaridades opostas provocam repulsão imediata (salto magnético).
* **Mineração Inteligente & Gravidade de Terreno**:
  * É possível extrair blocos de $36 \times 36\text{ px}$ diretamente sob os pés ou nas paredes laterais ao descer em fossas escavadas.
  * Blocos suspensos sofrem desabamento físico contínuo por gravidade caso a rocha de sustentação inferior seja extraída.
  * **Perigo Crítico**: Escavar abaixo da camada rochosa sólida expõe o astronauta ao núcleo magmático superaquecido do planeta, gerando *Game Over* instantâneo.
* **Plataforma Orbital Dreadnought (Capacidade 20)**:
  * A nave acompanha horizontalmente o movimento do Magman no topo da tela.
  * Possui propulsores laterais duplos com animação multifásica de plasma.
  * Os blocos arremessados são acoplados por fixação magnética suspensa na **face inferior** do casco (5 colunas $\times$ 4 níveis).
* **Cinturão de Asteroides Intermediário**:
  * Asteroides cadenciados cruzam o corredor entre o solo e a plataforma.
  * Exercem atração dipolar gravitacional sobre o astronauta quando este salta próximo à sua órbita.
  * Asteroides que colidem contra a carga acoplada na nave pulverizam o minério, decrementando a cota da missão.

---

## 🪐 Os Planetas de Sicron 9

| Planeta | Atmosfera | Litosfera Predominante | Vegetação | Polaridade |
| :--- | :--- | :--- | :--- | :---: |
| **Ferrum-9** | Âmbar Sulfúrico Térmico | Basalto e Hematita Oxidada | Agulhas Cristalinas de Ferro | **N** |
| **Dia-Vortex** | Glacial Ciano Rarefeita | Silicato Diamagnético e Cobalto | Fungos Luminescentes Azuis | **S** |
| **Paramag-Alpha** | Verde Esmeralda Tóxica | Minérios de Cromo e Serpentina | Esporos e Filamentos Verdes | **N** |
| **Aethelgard Prime** | Ocre Dourado / Radiação | Pirita Dourada e Crosta Tectônica | Raízes Fósseis Condutoras | **S** |
| **Sicron Core** | Púrpura Quântica de Plasma | Crosta Magmática Hiper-Radiativa | Filamentos de Energia Pura | **N** |

---

## 🛠️ Tecnologias Utilizadas

* **Frontend**: HTML5 Canvas (Renderização a 60 FPS), CSS3 (Flexbox/Grid, Viewport-Fit mobile), JavaScript ES6+ (Arquitetura modular nativa sem bundlers).
* **Backend as a Service**:
  * **Firebase Authentication**: Gerenciamento de credenciais e sessões de pilotos.
  * **Cloud Firestore**: Banco de dados NoSQL para persistência de progresso e Leaderboard global.
* **Hospedagem & CI/CD**: GitHub + Vercel com deploy automatizado via Git push.

---

## 📁 Estrutura do Projeto

```text
magman-sicron9/
├── index.html              # Estrutura DOM, HUD mobile e modais in-game
├── style.css               # Design system sci-fi, temas planetários e controles
├── vercel.json             # Regras de roteamento para single-page app
└── src/
    ├── config.js           # Parâmetros de física, dados planetários e naves
    ├── firebase.js         # Inicialização do SDK modular do Firebase (Auth + DB)
    ├── camera.js           # Câmera com interpolação e efeito parallax em camadas
    ├── terrain.js          # Geração da litosfera, física de blocos e núcleo
    ├── particles.js        # Sistema de partículas para pulverização mineral
    ├── asteroids.js        # Órbita dos asteroides e atração magnética
    ├── ship.js             # Plataforma cargueira com propulsores e deck inferior
    ├── magman.js           # Renderização vetorial do avatar e física de colisão
    └── main.js             # Game loop, orquestração de estados e controles touch