import { ThemeId } from "./themes";

export interface ForestTrigger {
  id: string;
  themeKey: "amazonia" | "taiga";
  title: string;
  phrase: string;
  videoUrl: string;
  videoName: string;
  description: string;
  isFixed: boolean;
}

export interface ProjectConfig {
  id: string;
  projectName: string;
  subtitle: string;
  badge: string;
  biome: ThemeId;
  description: string;
  intro: {
    id: "intro";
    title: string;
    phrase: string;
    videoUrl: string;
    videoName: string;
    description: string;
    isFixed: boolean;
  };
  triggers: ForestTrigger[];
  suggestedQuestions: string[];
}

/**
 * CONFIGURAÇÃO CENTRALIZADA E EXCLUSIVA DO PROJETO:
 * RENATO ROSA — ASSISTENTE VIRTUAL DAS FLORESTAS
 *
 * Introdução Geral (reproduzida ao iniciar apresentação; NÃO cadastrada como 3º gatilho):
 * - CONHECENDO AS FLORESTAS -> https://youtu.be/R5q7bzi0xiA?is=cqjfziK-sPCCt-mB
 *
 * Exatamente 2 Gatilhos de Interação:
 * 1. "Me fale sobre a Amazônia." -> https://youtu.be/1rmK3Im95N4?is=pmAKA7Ba9NQLFbpE
 * 2. "Me fale sobre a Taiga."    -> https://youtu.be/Tua4t5qxUcM?is=E95VkFtgqLmEuL1U
 */
export const RENATO_ROSA_PROJECT: ProjectConfig = {
  id: "renato_rosa_florestas",
  projectName: "RENATO ROSA",
  subtitle: "ASSISTENTE VIRTUAL DAS FLORESTAS",
  badge: "Florestas · Amazônia · Taiga",
  biome: "florestas",
  description: "RENATO ROSA — ASSISTENTE VIRTUAL DAS FLORESTAS · Centro educativo sobre ecossistemas florestais, Floresta Amazônica e Floresta Taiga.",
  intro: {
    id: "intro",
    title: "CONHECENDO AS FLORESTAS",
    phrase: "conhecendo as florestas",
    videoUrl: "https://youtu.be/R5q7bzi0xiA?is=cqjfziK-sPCCt-mB",
    videoName: "CONHECENDO AS FLORESTAS",
    description: "Introdução geral sobre a importância das florestas para o planeta, biodiversidade, clima e preservação.",
    isFixed: true
  },
  triggers: [
    {
      id: "trigger_amazonia",
      themeKey: "amazonia",
      title: "Floresta Amazônica",
      phrase: "Me fale sobre a Amazônia.",
      videoUrl: "https://youtu.be/1rmK3Im95N4?is=pmAKA7Ba9NQLFbpE",
      videoName: "Me fale sobre a Amazônia.",
      description: "Biodiversidade, características climáticas, rios voadores e preservação da Floresta Amazônica.",
      isFixed: true
    },
    {
      id: "trigger_taiga",
      themeKey: "taiga",
      title: "Floresta Taiga",
      phrase: "Me fale sobre a Taiga.",
      videoUrl: "https://youtu.be/Tua4t5qxUcM?is=E95VkFtgqLmEuL1U",
      videoName: "Me fale sobre a Taiga.",
      description: "Características das florestas boreais, clima frio, coníferas, fauna adaptada e preservação da Taiga.",
      isFixed: true
    }
  ],
  suggestedQuestions: [
    "Me fale sobre a Amazônia.",
    "Me fale sobre a Taiga."
  ]
};

/**
 * Normaliza texto de comando de voz para comparação fonética e lexical:
 * remove acentos, pontuação e espaços duplicados.
 */
export function normalizeVoiceText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Reconhecedor de voz exclusivo do Projeto Renato Rosa:
 * Identifica os 2 gatilhos (Amazônia e Taiga) e comandos de retorno à introdução.
 */
export function matchForestTrigger(input: string): "intro" | "trigger_amazonia" | "trigger_taiga" | null {
  const norm = normalizeVoiceText(input);
  if (!norm) return null;

  // Gatilho 1: Floresta Amazônica (verificado com prioridade)
  if (
    norm.includes("amazonia") ||
    norm.includes("amazonica") ||
    norm.includes("amazonas") ||
    norm.includes("floresta tropical") ||
    norm.includes("onca pintada") ||
    norm.includes("rios voadores")
  ) {
    return "trigger_amazonia";
  }

  // Gatilho 2: Floresta Taiga (verificado com prioridade)
  if (
    norm.includes("taiga") ||
    norm.includes("boreal") ||
    norm.includes("boreais") ||
    norm.includes("coniferas") ||
    norm.includes("pinheiros") ||
    norm.includes("floresta fria") ||
    norm.includes("floresta gelada")
  ) {
    return "trigger_taiga";
  }

  // Comandos explícitos para rever a introdução geral
  if (
    norm === "introducao" ||
    norm === "apresentacao" ||
    norm.includes("conhecendo as florestas") ||
    norm.includes("iniciar apresentacao") ||
    norm.includes("sobre as florestas em geral")
  ) {
    return "intro";
  }

  return null;
}
