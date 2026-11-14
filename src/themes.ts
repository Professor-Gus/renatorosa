import florestasMonitorImg from "./assets/images/florestas_monitor_center_1794627980654.jpg";
import amazoniaSmartImg from "./assets/images/amazonia_smart_forest_1794310972794.jpg";
import taigaSmartImg from "./assets/images/taiga_smart_forest_1794310974222.jpg";

export type ThemeId = "florestas" | "amazonia" | "taiga";

export interface ThemeColors {
  bgApp: string;          // Main canvas background
  bgSurface: string;      // Cards and main panels
  bgCard: string;         // Inner cards / sections
  bgElevated: string;     // Elevated popovers / sheets
  bgInput: string;        // Text inputs and chips
  borderMain: string;     // Primary neon accent borders
  borderSubtle: string;   // Secondary structural borders
  primary: string;        // Main theme action color
  primaryHover: string;   // Hover state
  primaryText: string;    // Contrast text on primary button
  accent: string;         // Secondary neon highlight (blue/cyan or emerald)
  accentText: string;     // Contrast text on accent button
  textPrimary: string;    // Headings, titles
  textSecondary: string;  // Body text
  textMuted: string;      // Captions, hints
  chipBg: string;         // Suggested trigger chip bg
  chipHoverBg: string;    // Suggested trigger chip hover bg
  glow: string;           // Shadows and glow highlights
}

export interface FaunaSpecies {
  name: string;
  scientificName: string;
  category: string;
  status: string;
}

export interface SmartDevice {
  name: string;
  type: string;
  status: "online" | "transmitting" | "monitoring" | "active";
  telemetry: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  environmentTitle: string;
  biome: string;
  description: string;
  colorsDescription: string;
  bgImage: string;
  particleType: "fireflies" | "snow";
  glowColor: string;
  iconName: "Globe" | "Trees" | "TreePine";
  swatches: [string, string, string, string];
  colors: ThemeColors;
  animals: FaunaSpecies[];
  smartDevices: SmartDevice[];
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  florestas: {
    id: "florestas",
    name: "Florestas",
    environmentTitle: "Centro de Monitoramento Ambiental",
    biome: "Ecossistemas Florestais · Amazônia & Taiga",
    description: "Visão integrada da cobertura florestal do planeta, ciclo do carbono, biodiversidade e monitoramento por satélite.",
    colorsDescription: "Verde-esmeralda, azul-oceano e neon ciano",
    bgImage: florestasMonitorImg,
    particleType: "fireflies",
    glowColor: "rgba(16, 185, 129, 0.35)",
    iconName: "Globe",
    swatches: ["#021018", "#059669", "#10b981", "#38bdf8"],
    colors: {
      bgApp: "#020c13",
      bgSurface: "rgba(5, 22, 32, 0.88)",
      bgCard: "rgba(8, 34, 48, 0.85)",
      bgElevated: "rgba(11, 46, 64, 0.92)",
      bgInput: "#041620",
      borderMain: "#10b981",
      borderSubtle: "#0e485c",
      primary: "#10b981",
      primaryHover: "#34d399",
      primaryText: "#021610",
      accent: "#38bdf8",
      accentText: "#02131f",
      textPrimary: "#f0fdf4",
      textSecondary: "#cbeafe",
      textMuted: "#7dd3fc",
      chipBg: "#072c3c",
      chipHoverBg: "#10b981",
      glow: "rgba(56, 189, 248, 0.25)"
    },
    animals: [
      { name: "Onça-pintada", scientificName: "Panthera onca", category: "Amazônia · Topo de Cadeia", status: "Corredor Ecológico Ativo" },
      { name: "Arara-vermelha", scientificName: "Ara chloropterus", category: "Amazônia · Dossel Tropical", status: "Dispersão de Sementes" },
      { name: "Lobo-cinzento", scientificName: "Canis lupus", category: "Taiga · Floresta Boreal", status: "Equilíbrio de Ecossistema" },
      { name: "Coruja-das-neves", scientificName: "Bubo scandiacus", category: "Taiga · Zona Subártica", status: "Monitoramento Térmico" },
      { name: "Alce Boreal", scientificName: "Alces alces", category: "Taiga · Coníferas", status: "Habitat Preservado" }
    ],
    smartDevices: [
      { name: "Satélites de Cobertura Florestal", type: "Órbita Baixa Multiespectral", status: "transmitting", telemetry: "Resolução 5m · Tempo Real" },
      { name: "Drones Autônomos de Dossel", type: "Patrulha Aérea Eco-UAV", status: "active", telemetry: "Varredura 12 km² · Bateria 96%" },
      { name: "Sensores de Carbono e O₂", type: "Torres de Fluxo Atmosférico", status: "online", telemetry: "Sequestro Ativo · CO₂ 392 ppm" },
      { name: "Radares Antiderrubada & Queimada", type: "Alerta Térmico Infravermelho", status: "monitoring", telemetry: "0 Focos de Calor na Área" },
      { name: "Estação Climática Conectada", type: "Rede IoT Ambiental Global", status: "online", telemetry: "Umidade & Vento Sincronizados" }
    ]
  },
  amazonia: {
    id: "amazonia",
    name: "Floresta Amazônica",
    environmentTitle: "Monitoramento Tropical Inteligente",
    biome: "Floresta Tropical Úmida & Rios Voadores",
    description: "A maior floresta tropical do planeta, rica em biodiversidade, bacias hidrográficas e regulação climática continental.",
    colorsDescription: "Verde-esmeralda, verde-dossel e ciano luminoso",
    bgImage: amazoniaSmartImg,
    particleType: "fireflies",
    glowColor: "rgba(16, 185, 129, 0.42)",
    iconName: "Trees",
    swatches: ["#02140d", "#047857", "#10b981", "#22d3ee"],
    colors: {
      bgApp: "#02100a",
      bgSurface: "rgba(5, 26, 19, 0.88)",
      bgCard: "rgba(8, 40, 29, 0.85)",
      bgElevated: "rgba(11, 52, 38, 0.92)",
      bgInput: "#031912",
      borderMain: "#10b981",
      borderSubtle: "#0c543a",
      primary: "#10b981",
      primaryHover: "#34d399",
      primaryText: "#021810",
      accent: "#22d3ee",
      accentText: "#02171b",
      textPrimary: "#ecfdf5",
      textSecondary: "#bbf7d0",
      textMuted: "#6ee7b7",
      chipBg: "#083425",
      chipHoverBg: "#10b981",
      glow: "rgba(16, 185, 129, 0.3)"
    },
    animals: [
      { name: "Onça-pintada", scientificName: "Panthera onca", category: "Predador de Topo", status: "Monitorada por Câmeras IA" },
      { name: "Arara-vermelha", scientificName: "Ara chloropterus", category: "Avifauna do Dossel", status: "Revoada Catalogada" },
      { name: "Boto-cor-de-rosa", scientificName: "Inia geoffrensis", category: "Fauna Fluvial", status: "Bacia Amazônica" },
      { name: "Tucano-toco", scientificName: "Ramphastos toco", category: "Dispersor de Sementes", status: "Copa Alta" },
      { name: "Bicho-preguiça", scientificName: "Bradypus tridactylus", category: "Mamífero Arborícola", status: "Dossel Protegido" }
    ],
    smartDevices: [
      { name: "Satélites de Detecção DETER/PRODES", type: "Vigilância Orbital Contínua", status: "transmitting", telemetry: "Cobertura 100% da Bacia" },
      { name: "Sensores Acústicos de Biodiversidade", type: "Bioacústica IA em Árvores", status: "monitoring", telemetry: "42 Espécies Identificadas" },
      { name: "Sondas de Umidade & Rios Voadores", type: "Estação Hidrometeorológica", status: "online", telemetry: "Umidade 86% · Evapotranspiração Alta" },
      { name: "Drones de Patrulha Amazônica", type: "Eco-UAV de Longo Alcance", status: "active", telemetry: "Rota Fluvial · Bateria 93%" },
      { name: "Sensores Térmicos de Copa", type: "Detecção Precoce de Fogo", status: "online", telemetry: "27,2 °C · Risco Controlado" }
    ]
  },
  taiga: {
    id: "taiga",
    name: "Floresta Taiga",
    environmentTitle: "Monitoramento Boreal Inteligente",
    biome: "Floresta Boreal de Coníferas & Clima Frio",
    description: "O maior bioma florestal contínuo em área terrestre, adaptado ao frio intenso do hemisfério norte com pinheiros e espruces.",
    colorsDescription: "Azul-glacial, azul-petróleo e verde-pinheiro",
    bgImage: taigaSmartImg,
    particleType: "snow",
    glowColor: "rgba(56, 189, 248, 0.42)",
    iconName: "TreePine",
    swatches: ["#02131f", "#0369a1", "#38bdf8", "#10b981"],
    colors: {
      bgApp: "#020e18",
      bgSurface: "rgba(4, 24, 38, 0.88)",
      bgCard: "rgba(7, 37, 57, 0.85)",
      bgElevated: "rgba(10, 49, 75, 0.92)",
      bgInput: "#031726",
      borderMain: "#38bdf8",
      borderSubtle: "#0c4e73",
      primary: "#38bdf8",
      primaryHover: "#7dd3fc",
      primaryText: "#021624",
      accent: "#10b981",
      accentText: "#021810",
      textPrimary: "#f0f9ff",
      textSecondary: "#bae6fd",
      textMuted: "#7dd3fc",
      chipBg: "#062c44",
      chipHoverBg: "#38bdf8",
      glow: "rgba(56, 189, 248, 0.3)"
    },
    animals: [
      { name: "Lobo-cinzento", scientificName: "Canis lupus", category: "Predador Boreal", status: "Alcatéia Monitorada" },
      { name: "Urso-pardo", scientificName: "Ursus arctos", category: "Grande Mamífero", status: "Ciclo Sazonal Ativo" },
      { name: "Alce", scientificName: "Alces alces", category: "Herbívoro de Coníferas", status: "Vale Boreal Seguro" },
      { name: "Lince-euroasiático", scientificName: "Lynx lynx", category: "Felino Adaptado ao Frio", status: "Trilha em Monitoramento" },
      { name: "Coruja-das-neves", scientificName: "Bubo scandiacus", category: "Ave de Rapina Polar", status: "Voo Noturno Registrado" }
    ],
    smartDevices: [
      { name: "Sondas de Permafrost & Solo Frio", type: "Termometria Subsuperficial", status: "monitoring", telemetry: "-12,4 °C · Solo Estável" },
      { name: "Drones Boreais Anti-congelamento", type: "UAV Térmico Subártico", status: "active", telemetry: "Altitude 140m · Rota Norte" },
      { name: "Sensores de Qualidade do Ar", type: "Análise Atmosférica Laser", status: "online", telemetry: "Ar Puro · AQI 07" },
      { name: "Câmeras Infravermelhas de Fauna", type: "Visão Térmica na Neve", status: "transmitting", telemetry: "Detecção Sem Interferência" },
      { name: "Satélite de Monitoramento Boreal", type: "Sensoriamento de Incêndios", status: "online", telemetry: "Cobertura Circumpolar Ativa" }
    ]
  }
};

export const THEME_LIST: ThemeDefinition[] = [
  THEMES.florestas,
  THEMES.amazonia,
  THEMES.taiga
];
