export type QuizThemeId = "florestas" | "amazonia" | "taiga";

export interface ForestQuizQuestion {
  id: string;
  number: number;
  stage: 1 | 2 | 3;
  stageLabel: string;
  themeId: QuizThemeId;
  themeName: string;
  topic: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

export interface QuizThemeSummary {
  themeId: QuizThemeId;
  stage: 1 | 2 | 3;
  label: string;
  subtitle: string;
  questionRange: string;
  totalQuestions: number;
  maxPoints: number;
}

export const QUIZ_POINTS_PER_QUESTION = 1000;
export const QUIZ_TOTAL_QUESTIONS = 15;
export const QUIZ_MAX_SCORE = QUIZ_TOTAL_QUESTIONS * QUIZ_POINTS_PER_QUESTION; // 15.000 pontos

export const QUIZ_THEMES_META: QuizThemeSummary[] = [
  {
    themeId: "florestas",
    stage: 1,
    label: "Etapa 1 — Florestas",
    subtitle: "Conhecimentos gerais sobre ecossistemas florestais",
    questionRange: "Perguntas 1 a 5",
    totalQuestions: 5,
    maxPoints: 5000
  },
  {
    themeId: "amazonia",
    stage: 2,
    label: "Etapa 2 — Floresta Amazônica",
    subtitle: "Biodiversidade, clima, rios voadores e preservação",
    questionRange: "Perguntas 6 a 10",
    totalQuestions: 5,
    maxPoints: 5000
  },
  {
    themeId: "taiga",
    stage: 3,
    label: "Etapa 3 — Floresta Taiga",
    subtitle: "Florestas boreais, clima frio, coníferas e fauna",
    questionRange: "Perguntas 11 a 15",
    totalQuestions: 5,
    maxPoints: 5000
  }
];

export const FOREST_QUIZ_QUESTIONS: ForestQuizQuestion[] = [
  // ============================================================================
  // ETAPA 1 — FLORESTAS (Perguntas 1 a 5)
  // ============================================================================
  {
    id: "florestas_q1",
    number: 1,
    stage: 1,
    stageLabel: "ETAPA 1 — FLORESTAS",
    themeId: "florestas",
    themeName: "Florestas",
    topic: "Importância das florestas para o planeta",
    question: "Por que os ecossistemas florestais são essenciais para a estabilidade ambiental do planeta?",
    options: [
      "Porque impedem a formação de nuvens e reduzem a umidade do ar.",
      "Porque regulam o clima, protegem o solo contra erosão, conservam a água e abrigam grande parte da biodiversidade terrestre.",
      "Porque substituem completamente os oceanos na produção de toda a água doce.",
      "Porque eliminam os ventos naturais em todos os continentes."
    ],
    correctIndex: 1,
    feedbackCorrect:
      "As florestas atuam como reguladoras climáticas naturais: protegem nascentes, evitam a erosão do solo pelas raízes e mantêm a biodiversidade.",
    feedbackIncorrect:
      "A alternativa correta é a B: as florestas regulam o clima, conservam recursos hídricos, protegem os solos da erosão e sustentam a biodiversidade terrestre."
  },
  {
    id: "florestas_q2",
    number: 2,
    stage: 1,
    stageLabel: "ETAPA 1 — FLORESTAS",
    themeId: "florestas",
    themeName: "Florestas",
    topic: "Produção de oxigênio e ciclo do carbono",
    question: "Qual é o papel principal das árvores no ciclo do carbono e na produção de oxigênio?",
    options: [
      "Consomem todo o oxigênio da atmosfera sem absorver gás carbônico.",
      "Convertem gás nitrogênio em carvão mineral dentro das folhas.",
      "Por meio da fotossíntese, absorvem gás carbônico (CO₂), armazenam carbono na biomassa e liberam oxigênio (O₂).",
      "Liberam apenas metano durante a luz solar para resfriar o solo."
    ],
    correctIndex: 2,
    feedbackCorrect:
      "Na fotossíntese, as plantas capturam CO₂ da atmosfera, fixam o carbono em troncos, folhas e raízes e liberam O₂, ajudando a frear o aquecimento global.",
    feedbackIncorrect:
      "A alternativa correta é a C: pela fotossíntese, as árvores absorvem CO₂, armazenam carbono em sua estrutura e liberam oxigênio para o ambiente."
  },
  {
    id: "florestas_q3",
    number: 3,
    stage: 1,
    stageLabel: "ETAPA 1 — FLORESTAS",
    themeId: "florestas",
    themeName: "Florestas",
    topic: "Biodiversidade e equilíbrio ecológico",
    question: "De que maneira a alta biodiversidade de uma floresta contribui para o equilíbrio ecológico?",
    options: [
      "Mantém cadeias alimentares estáveis, favorece a polinização e aumenta a resistência do ecossistema contra pragas e mudanças.",
      "Faz com que apenas uma espécie de planta domine toda a área verde.",
      "Impede que insetos, aves e mamíferos compartilhem o mesmo território.",
      "Reduz a reciclagem de nutrientes no solo após a queda das folhas."
    ],
    correctIndex: 0,
    feedbackCorrect:
      "Quanto maior a diversidade de plantas, fungos e animais, mais equilibradas ficam a polinização, a dispersão de sementes e o controle biológico natural.",
    feedbackIncorrect:
      "A alternativa correta é a A: a biodiversidade sustenta teias alimentares, polinizadores e dispersores de sementes, garantindo equilíbrio e resiliência ecológica."
  },
  {
    id: "florestas_q4",
    number: 4,
    stage: 1,
    stageLabel: "ETAPA 1 — FLORESTAS",
    themeId: "florestas",
    themeName: "Florestas",
    topic: "Desmatamento e queimadas",
    question: "Quais são as principais consequências ambientais provocadas pelo desmatamento e pelas queimadas florestais?",
    options: [
      "Aumento imediato da fertilidade eterna do solo e resfriamento global.",
      "Multiplicação de espécies ameaçadas e maior proteção das nascentes.",
      "Redução definitiva de gases de efeito estufa na atmosfera.",
      "Perda de habitats, extinção de espécies, degradação do solo e liberação de grandes quantidades de CO₂."
    ],
    correctIndex: 3,
    feedbackCorrect:
      "Derrubar e queimar florestas libera o carbono estocado nas árvores para a atmosfera, empobrece o solo e destrói o abrigo de milhares de seres vivos.",
    feedbackIncorrect:
      "A alternativa correta é a D: desmatamento e queimadas provocam destruição de habitats, perda de biodiversidade, erosão do solo e aumento de emissões de carbono."
  },
  {
    id: "florestas_q5",
    number: 5,
    stage: 1,
    stageLabel: "ETAPA 1 — FLORESTAS",
    themeId: "florestas",
    themeName: "Florestas",
    topic: "Preservação e monitoramento ambiental",
    question: "Como tecnologias modernas auxiliam na preservação e no monitoramento das florestas hoje?",
    options: [
      "Substituindo árvores vivas por torres metálicas sem vegetação ao redor.",
      "Por meio de satélites, drones e sensores ambientais que detectam desmatamento ilegal, focos de incêndio e variações climáticas em tempo real.",
      "Desligando estações meteorológicas para evitar interferência nos ventos.",
      "Permitindo a remoção total da cobertura vegetal para facilitar a visão aérea."
    ],
    correctIndex: 1,
    feedbackCorrect:
      "Imagens de satélite, sensores de umidade/fumaça e drones permitem agir rapidamente contra incêndios e derrubadas ilegais, reforçando a conservação.",
    feedbackIncorrect:
      "A alternativa correta é a B: satélites, drones e sensores conectados monitoram a saúde da floresta e geram alertas rápidos contra incêndios e desmatamento."
  },

  // ============================================================================
  // ETAPA 2 — FLORESTA AMAZÔNICA (Perguntas 6 a 10)
  // ============================================================================
  {
    id: "amazonia_q6",
    number: 6,
    stage: 2,
    stageLabel: "ETAPA 2 — FLORESTA AMAZÔNICA",
    themeId: "amazonia",
    themeName: "Floresta Amazônica",
    topic: "Características da Amazônia",
    question: "Qual característica define corretamente a Floresta Amazônica no cenário mundial?",
    options: [
      "É a maior floresta tropical úmida do planeta, estruturada em camadas densas de vegetação e cortada por uma imensa bacia hidrográfica.",
      "É uma pequena floresta temperada localizada exclusivamente em regiões polares.",
      "É um bioma composto somente por cactos adaptados a desertos sem chuva.",
      "É formada por árvores que perdem todas as folhas durante oito meses de neve."
    ],
    correctIndex: 0,
    feedbackCorrect:
      "Localizada na América do Sul, a Amazônia é a maior floresta tropical contínua da Terra, destacando-se pela bacia do rio Amazonas e pelo dossel exuberante.",
    feedbackIncorrect:
      "A alternativa correta é a A: a Amazônia é a maior floresta tropical úmida do mundo, com vegetação densa em estratos e gigantesca rede de rios."
  },
  {
    id: "amazonia_q7",
    number: 7,
    stage: 2,
    stageLabel: "ETAPA 2 — FLORESTA AMAZÔNICA",
    themeId: "amazonia",
    themeName: "Floresta Amazônica",
    topic: "Biodiversidade e animais",
    question: "Quais animais fazem parte da fauna característica e diversificada da Floresta Amazônica?",
    options: [
      "Urso-polar, pinguim-imperador e foca-leopardo.",
      "Alce, rena ártica e coruja-das-neves.",
      "Onça-pintada, arara-vermelha, boto-cor-de-rosa, tucano e bicho-preguiça.",
      "Canguru, coala e ornitorrinco."
    ],
    correctIndex: 2,
    feedbackCorrect:
      "A Amazônia reúne uma das maiores biodiversidades do planeta, abrigando felinos como a onça-pintada, aves do dossel e mamíferos aquáticos como o boto-cor-de-rosa.",
    feedbackIncorrect:
      "A alternativa correta é a C: onça-pintada, arara-vermelha, boto-cor-de-rosa, tucano e bicho-preguiça são espécies emblemáticas da fauna amazônica."
  },
  {
    id: "amazonia_q8",
    number: 8,
    stage: 2,
    stageLabel: "ETAPA 2 — FLORESTA AMAZÔNICA",
    themeId: "amazonia",
    themeName: "Floresta Amazônica",
    topic: "Vegetação e clima",
    question: "Como se combinam o clima e os principais tipos de vegetação presentes na Amazônia?",
    options: [
      "Clima glacial seco durante todo o ano com predomínio de pinheiros congelados.",
      "Clima equatorial quente e úmido com chuvas frequentes, abrigando matas de terra firme, matas de várzea e matas de igapó.",
      "Clima desértico sem precipitações e vegetação rasteira exclusivamente espinhosa.",
      "Clima mediterrâneo seco com quatro meses de nevasca anual."
    ],
    correctIndex: 1,
    feedbackCorrect:
      "O calor constante e a elevada umidade sustentam diferentes níveis de floresta: áreas sempre alagadas (igapó), alagadas sazonalmente (várzea) e não alagadas (terra firme).",
    feedbackIncorrect:
      "A alternativa correta é a B: o clima equatorial quente e úmido favorece formações vegetais adaptadas tanto a áreas secas (terra firme) quanto alagadas (várzea e igapó)."
  },
  {
    id: "amazonia_q9",
    number: 9,
    stage: 2,
    stageLabel: "ETAPA 2 — FLORESTA AMAZÔNICA",
    themeId: "amazonia",
    themeName: "Floresta Amazônica",
    topic: "Importância ambiental da floresta",
    question: "O que são os chamados 'rios voadores' ligados à importância ambiental da Floresta Amazônica?",
    options: [
      "Canais artificiais escavados em montanhas para irrigação agrícola.",
      "Correntes oceânicas frias que circulam apenas pelo Polo Sul.",
      "Ventos secos vindos de desertos que impedem chuvas na América do Sul.",
      "Massas de vapor d'água liberadas pela evapotranspiração da floresta que levam chuvas para diversas regiões do Brasil e da América do Sul."
    ],
    correctIndex: 3,
    feedbackCorrect:
      "Milhares de árvores bombeiam água do solo para a atmosfera pela transpiração, formando fluxos aéreos de umidade vitais para o regime de chuvas e a agricultura.",
    feedbackIncorrect:
      "A alternativa correta é a D: os 'rios voadores' são fluxos de umidade gerados pela evapotranspiração da Amazônia que abastecem chuvas em grande parte do continente."
  },
  {
    id: "amazonia_q10",
    number: 10,
    stage: 2,
    stageLabel: "ETAPA 2 — FLORESTA AMAZÔNICA",
    themeId: "amazonia",
    themeName: "Floresta Amazônica",
    topic: "Ameaças, preservação e tecnologias de monitoramento",
    question: "Quais ameaças afetam a Amazônia e quais tecnologias apoiam seu combate e preservação?",
    options: [
      "Ameaças como desmatamento, queimadas e garimpo ilegal são combatidas com sistemas de satélite em tempo real, drones e sensores acústicos.",
      "Ameaças como nevascas extremas são resolvidas com aquecedores instalados nas copas.",
      "O excesso de áreas preservadas é reduzido com remoção de sensores de vigilância.",
      "A maior ameaça é o congelamento do rio Amazonas, combatido por navios quebra-gelo."
    ],
    correctIndex: 0,
    feedbackCorrect:
      "Sistemas orbitais como PRODES e DETER, aliados a drones e monitoramento bioacústico, identificam rapidamente derrubadas ilegais e focos de fogo na Amazônia.",
    feedbackIncorrect:
      "A alternativa correta é a A: desmatamento, queimadas e garimpo ilegal são enfrentados com vigilância por satélite, drones e redes de sensores ambientais."
  },

  // ============================================================================
  // ETAPA 3 — FLORESTA TAIGA (Perguntas 11 a 15)
  // ============================================================================
  {
    id: "taiga_q11",
    number: 11,
    stage: 3,
    stageLabel: "ETAPA 3 — FLORESTA TAIGA",
    themeId: "taiga",
    themeName: "Floresta Taiga",
    topic: "Características das florestas boreais",
    question: "Onde se localiza a Floresta Taiga (floresta boreal) e qual é a sua extensão no planeta?",
    options: [
      "Apenas na linha do Equador, ocupando ilhas tropicais pequenas.",
      "Exclusivamente no interior da América do Sul, próxima a rios quentes.",
      "No hemisfério norte — em países como Canadá, Rússia, Finlândia, Suécia e Alasca — formando o maior bioma florestal contínuo em área terrestre.",
      "Apenas na costa oeste da África em zonas de calor extremo."
    ],
    correctIndex: 2,
    feedbackCorrect:
      "A Taiga forma um imenso cinturão verde ao redor do hemisfério norte logo abaixo da tundra ártica, sendo a maior formação florestal contínua do mundo em extensão.",
    feedbackIncorrect:
      "A alternativa correta é a C: a Taiga estende-se pelas altas latitudes do hemisfério norte (Canadá, Rússia, Escandinávia e Alasca) como o maior bioma florestal contínuo."
  },
  {
    id: "taiga_q12",
    number: 12,
    stage: 3,
    stageLabel: "ETAPA 3 — FLORESTA TAIGA",
    themeId: "taiga",
    themeName: "Floresta Taiga",
    topic: "Clima frio e estações do ano",
    question: "Como se caracterizam o clima e as estações do ano na Floresta Taiga?",
    options: [
      "Verões permanentes com temperaturas médias acima de 40 °C o ano todo.",
      "Invernos longos, muito frios e com neve intensa, alternados com verões curtos e amenos, frequentemente sobre solos congelados.",
      "Ausência total de diferenças entre estações e chuvas tropicais diárias.",
      "Seca absoluta durante todo o século, sem formação de gelo ou neve."
    ],
    correctIndex: 1,
    feedbackCorrect:
      "Na Taiga, o inverno pode durar mais de metade do ano com temperaturas bem abaixo de zero, enquanto o verão breve permite o degelo superficial e crescimento rápido.",
    feedbackIncorrect:
      "A alternativa correta é a B: a Taiga apresenta invernos rigorosos e prolongados com neve e verões curtos e frescos, com presença de solo congelado em regiões mais frias."
  },
  {
    id: "taiga_q13",
    number: 13,
    stage: 3,
    stageLabel: "ETAPA 3 — FLORESTA TAIGA",
    themeId: "taiga",
    themeName: "Floresta Taiga",
    topic: "Árvores predominantes",
    question: "Quais árvores predominam na Taiga e por que sua forma ajuda a sobreviver ao inverno?",
    options: [
      "Palmeiras e bananeiras tropicais de folhas largas que absorvem neve.",
      "Cactos gigantes que armazenam água quente em troncos esponjosos.",
      "Árvores tropicais de folhas gigantes que dependem de calor constante de 35 °C.",
      "Coníferas como pinheiros, abetos e espruces, com formato cônico que deixa a neve escorregar e folhas em agulha que reduzem a perda de água."
    ],
    correctIndex: 3,
    feedbackCorrect:
      "A copa em cone evita que o peso da neve quebre os galhos, e as folhas finas em forma de agulha possuem camada cerosa que protege contra congelamento e desidratação.",
    feedbackIncorrect:
      "A alternativa correta é a D: coníferas (pinheiros, abetos e espruces) possuem formato cônico para deslizar a neve e folhas em agulha resistentes ao frio."
  },
  {
    id: "taiga_q14",
    number: 14,
    stage: 3,
    stageLabel: "ETAPA 3 — FLORESTA TAIGA",
    themeId: "taiga",
    themeName: "Floresta Taiga",
    topic: "Animais adaptados ao ambiente",
    question: "Quais animais habitam a Taiga e quais estratégias utilizam para enfrentar o frio rigoroso?",
    options: [
      "Lobo-cinzento, urso-pardo, alce, lince e coruja-das-neves, adaptados com pelagem ou plumagem espessa, camada de gordura, hibernação ou migração.",
      "Tucano, preguiça e jacaré-açu, que dependem exclusivamente de calor constante.",
      "Camelo e escorpião-do-deserto adaptados a dunas escaldantes.",
      "Flamingo tropical e peixe-boi amazônico."
    ],
    correctIndex: 0,
    feedbackCorrect:
      "Enquanto lobos, alces e linces permanecem ativos graças ao isolamento térmico de pelos espessos e patas largas para andar na neve, ursos hibernam no inverno.",
    feedbackIncorrect:
      "A alternativa correta é a A: lobo-cinzento, urso-pardo, alce, lince e coruja-das-neves sobrevivem na Taiga por meio de pelagem densa, hibernação ou migração."
  },
  {
    id: "taiga_q15",
    number: 15,
    stage: 3,
    stageLabel: "ETAPA 3 — FLORESTA TAIGA",
    themeId: "taiga",
    themeName: "Floresta Taiga",
    topic: "Ameaças ambientais e preservação",
    question: "Quais são as principais ameaças ambientais enfrentadas hoje pela Floresta Taiga e como preservá-la?",
    options: [
      "O excesso de sombreamento natural impede qualquer vida animal e exige corte total.",
      "A salinização por mares tropicais, combatida apenas com irrigação artificial.",
      "A exploração madeireira predatória, grandes incêndios florestais e o aquecimento global que descongela o permafrost — exigindo reservas protegidas e monitoramento por satélite.",
      "A proliferação de palmeiras invasoras trazidas por tempestades equatoriais."
    ],
    correctIndex: 2,
    feedbackCorrect:
      "Como o solo frio da Taiga guarda enormes estoques de carbono, o degelo do permafrost e os incêndios aceleram as mudanças climáticas; áreas protegidas e sensores ajudam a preservá-la.",
    feedbackIncorrect:
      "A alternativa correta é a C: corte predatório de madeira, incêndios de verão e degelo do permafrost ameaçam a Taiga, tornando fundamentais reservas naturais e monitoramento ambiental."
  }
];

export function getQuizResultFeedback(score: number): string {
  const pct = (score / QUIZ_MAX_SCORE) * 100;
  if (pct >= 90) {
    return "Excelente! Você demonstrou domínio completo sobre as Florestas, a Amazônia e a Taiga!";
  }
  if (pct >= 70) {
    return "Muito bem! Ótimo desempenho na proteção e compreensão dos ecossistemas florestais!";
  }
  if (pct >= 45) {
    return "Bom progresso! Continue explorando os vídeos e aprendendo sobre cada floresta!";
  }
  return "Continue praticando! Reassista aos vídeos de Florestas, Amazônia e Taiga e tente novamente!";
}
