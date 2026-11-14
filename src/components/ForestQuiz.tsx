import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  ArrowLeft,
  Trees,
  TreePine,
  Globe,
  Trophy,
  Play,
  ShieldCheck
} from "lucide-react";
import {
  FOREST_QUIZ_QUESTIONS,
  QUIZ_POINTS_PER_QUESTION,
  QUIZ_MAX_SCORE,
  QUIZ_TOTAL_QUESTIONS,
  QUIZ_THEMES_META,
  QuizThemeId,
  getQuizResultFeedback
} from "../data/forestQuiz";
import { ThemeColors } from "../themes";

interface ForestQuizProps {
  colors: ThemeColors;
  glowColor: string;
  onBackToPresentation: () => void;
}

interface AnswerRecord {
  questionId: string;
  questionNumber: number;
  themeId: QuizThemeId;
  themeName: string;
  topic: string;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
}

type QuizPhase = "intro" | "playing" | "results";

// Kahoot-inspired large high-contrast option buttons with geometric shapes for accessibility
const OPTION_STYLES = [
  {
    letter: "A",
    shape: "▲",
    bg: "#dc2626",
    border: "#fca5a5",
    label: "Vermelho"
  },
  {
    letter: "B",
    shape: "◆",
    bg: "#2563eb",
    border: "#93c5fd",
    label: "Azul"
  },
  {
    letter: "C",
    shape: "●",
    bg: "#ca8a04",
    border: "#fde047",
    label: "Amarelo"
  },
  {
    letter: "D",
    shape: "■",
    bg: "#059669",
    border: "#6ee7b7",
    label: "Verde"
  }
];

export const ForestQuiz: React.FC<ForestQuizProps> = ({
  colors,
  glowColor,
  onBackToPresentation
}) => {
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const totalQuestions = FOREST_QUIZ_QUESTIONS.length; // 15
  const currentQuestion = FOREST_QUIZ_QUESTIONS[currentIndex];
  const hasAnswered = selectedOption !== null;
  const isCurrentCorrect = hasAnswered && selectedOption === currentQuestion.correctIndex;

  const progressPercentage =
    quizPhase === "intro"
      ? 0
      : quizPhase === "results"
      ? 100
      : Math.round(((currentIndex + (hasAnswered ? 1 : 0)) / totalQuestions) * 100);

  const handleStartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setAnswers([]);
    setQuizPhase("playing");
  };

  const handleSelectOption = (optionIndex: number) => {
    // Bloqueia novas seleções após o estudante escolher uma alternativa (sem pontuação duplicada)
    if (quizPhase !== "playing" || selectedOption !== null) return;
    if (answers.some((a) => a.questionId === currentQuestion.id)) return;

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    setSelectedOption(optionIndex);

    if (isCorrect) {
      setScore((prev) => prev + QUIZ_POINTS_PER_QUESTION);
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        questionNumber: currentQuestion.number,
        themeId: currentQuestion.themeId,
        themeName: currentQuestion.themeName,
        topic: currentQuestion.topic,
        selectedIndex: optionIndex,
        correctIndex: currentQuestion.correctIndex,
        isCorrect
      }
    ]);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizPhase("results");
    }
  };

  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setAnswers([]);
    setQuizPhase("playing");
  };

  const renderThemeIcon = (themeId: QuizThemeId, className = "w-4 h-4 shrink-0") => {
    switch (themeId) {
      case "florestas":
        return <Globe className={className} style={{ color: colors.accent }} />;
      case "amazonia":
        return <Trees className={className} style={{ color: "#10b981" }} />;
      case "taiga":
        return <TreePine className={className} style={{ color: "#38bdf8" }} />;
    }
  };

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const incorrectCount = totalQuestions - correctCount;
  const accuracyPercent = Math.round((correctCount / totalQuestions) * 100);
  const encouragementMessage = getQuizResultFeedback(score);

  const themeBreakdown = QUIZ_THEMES_META.map((meta) => {
    const themeAnswers = answers.filter((a) => a.themeId === meta.themeId);
    const hits = themeAnswers.filter((a) => a.isCorrect).length;
    const points = hits * QUIZ_POINTS_PER_QUESTION;
    const pct = Math.round((hits / meta.totalQuestions) * 100);
    return {
      ...meta,
      hits,
      misses: meta.totalQuestions - hits,
      points,
      pct
    };
  });

  return (
    <div className="max-w-5xl mx-auto w-full space-y-5 animate-fade-in">
      {/* Top Quiz Header Bar */}
      <div
        className="rounded-2xl p-4 sm:p-5 border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
        style={{
          backgroundColor: colors.bgSurface,
          borderColor: colors.borderSubtle,
          boxShadow: `0 0 24px ${glowColor}`
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 shadow-sm"
            style={{
              backgroundColor: colors.primary,
              color: colors.primaryText,
              borderColor: colors.borderMain
            }}
          >
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1
              className="font-display font-bold text-base sm:text-xl tracking-wide leading-tight"
              style={{ color: colors.textPrimary }}
            >
              QUIZ — DESAFIO DAS FLORESTAS
            </h1>
            <p className="text-xs font-mono mt-0.5" style={{ color: colors.textMuted }}>
              Renato Rosa · Florestas · Floresta Amazônica · Floresta Taiga
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Score Indicator */}
          <div
            className="px-3.5 py-2 rounded-xl border flex items-center gap-2 font-mono tabular-nums"
            style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.borderMain
            }}
          >
            <Trophy className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
            <div className="text-xs font-bold" style={{ color: colors.textPrimary }}>
              {score.toLocaleString("pt-BR")}{" "}
              <span className="opacity-70">/ {QUIZ_MAX_SCORE.toLocaleString("pt-BR")} pts</span>
            </div>
          </div>

          {/* Progress Counter (1/15 .. 15/15) */}
          {quizPhase === "playing" && (
            <div
              className="px-3 py-2 rounded-xl border font-mono text-xs font-bold tabular-nums"
              style={{
                backgroundColor: colors.bgCard,
                borderColor: colors.borderSubtle,
                color: colors.textSecondary
              }}
            >
              {currentIndex + 1}/{totalQuestions}
            </div>
          )}

          <button
            type="button"
            onClick={onBackToPresentation}
            className="px-3.5 py-2 rounded-xl border font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer hover:brightness-110 active:scale-95 whitespace-nowrap"
            style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle,
              color: colors.textPrimary
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Apresentação</span>
          </button>
        </div>
      </div>

      {/* Overall Progress Bar */}
      {quizPhase !== "intro" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums px-1" style={{ color: colors.textMuted }}>
            <span>
              {quizPhase === "playing"
                ? `${currentQuestion.stageLabel} · Progresso ${currentIndex + 1}/${QUIZ_TOTAL_QUESTIONS}`
                : `Quiz Concluído · ${QUIZ_TOTAL_QUESTIONS}/${QUIZ_TOTAL_QUESTIONS} perguntas`}
            </span>
            <span>{progressPercentage}%</span>
          </div>
          <div
            className="w-full rounded-full h-3 overflow-hidden border"
            style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle
            }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${progressPercentage}%`,
                background: "linear-gradient(90deg, #10b981 0%, #38bdf8 100%)",
                boxShadow: `0 0 12px ${glowColor}`
              }}
            />
          </div>
        </div>
      )}

      {/* PHASE 1: TELA INICIAL DO QUIZ */}
      {quizPhase === "intro" && (
        <div
          className="rounded-3xl p-6 sm:p-10 border-2 backdrop-blur-md space-y-8 shadow-2xl text-center animate-fade-in"
          style={{
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderMain,
            boxShadow: `0 0 32px ${glowColor}`
          }}
        >
          <div className="space-y-3 max-w-2xl mx-auto">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border-2 shadow-lg"
              style={{
                backgroundColor: colors.primary,
                color: colors.primaryText,
                borderColor: colors.borderMain
              }}
            >
              <Trophy className="w-8 h-8" />
            </div>
            <p className="text-xs font-mono font-bold tracking-widest uppercase" style={{ color: colors.accent }}>
              Renato Rosa — Assistente Virtual das Florestas
            </p>
            <h2
              className="font-display font-extrabold text-2xl sm:text-4xl tracking-tight"
              style={{ color: colors.textPrimary, textWrap: "balance" as any }}
            >
              QUIZ — DESAFIO DAS FLORESTAS
            </h2>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: colors.textSecondary }}>
              Teste seus conhecimentos em 3 etapas com 15 perguntas interativas. Cada resposta correta vale{" "}
              <strong className="font-mono">1.000 pontos</strong>, totalizando até{" "}
              <strong className="font-mono">15.000 pontos</strong>.
            </p>
          </div>

          {/* 3 Stages Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {QUIZ_THEMES_META.map((stage) => (
              <div
                key={stage.themeId}
                className="rounded-2xl p-5 border flex flex-col justify-between gap-3"
                style={{
                  backgroundColor: colors.bgCard,
                  borderColor: colors.borderSubtle
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {renderThemeIcon(stage.themeId, "w-5 h-5 shrink-0")}
                    <span className="font-display font-bold text-sm" style={{ color: colors.textPrimary }}>
                      {stage.label}
                    </span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
                  {stage.subtitle}
                </p>
                <div
                  className="pt-2 border-t flex items-center justify-between text-[11px] font-mono tabular-nums"
                  style={{ borderColor: colors.borderSubtle, color: colors.textMuted }}
                >
                  <span>{stage.questionRange}</span>
                  <span>{stage.maxPoints.toLocaleString("pt-BR")} pts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Rules strip */}
          <div
            className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono py-3 px-4 rounded-xl border max-w-2xl mx-auto"
            style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle,
              color: colors.textSecondary
            }}
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: colors.primary }} />
              <span>15 perguntas no total</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>5 por tema</span>
            <span aria-hidden="true">·</span>
            <span>1.000 pontos por acerto</span>
            <span aria-hidden="true">·</span>
            <span>1 pergunta por vez</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={handleStartQuiz}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl font-display font-extrabold text-sm sm:text-base uppercase tracking-wider border-2 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap"
              style={{
                backgroundColor: colors.primary,
                color: colors.primaryText,
                borderColor: colors.borderMain,
                boxShadow: `0 0 24px ${glowColor}`
              }}
            >
              <Play className="w-5 h-5 fill-current shrink-0" />
              <span>COMEÇAR</span>
            </button>

            <button
              type="button"
              onClick={onBackToPresentation}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider border flex items-center justify-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-95 whitespace-nowrap"
              style={{
                backgroundColor: colors.bgCard,
                color: colors.textPrimary,
                borderColor: colors.borderSubtle
              }}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>VOLTAR À APRESENTAÇÃO</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: PLAYING (1 QUESTION AT A TIME — KAHOOT STYLE) */}
      {quizPhase === "playing" && (
        <div
          key={currentQuestion.id}
          className="rounded-3xl p-5 sm:p-8 border-2 backdrop-blur-md space-y-6 shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderMain,
            boxShadow: `0 0 30px ${glowColor}`
          }}
        >
          {/* Current Theme / Stage Identification + Question Counter */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              {renderThemeIcon(currentQuestion.themeId, "w-4 h-4 shrink-0")}
              <span className="font-bold uppercase tracking-wide">{currentQuestion.stageLabel}</span>
              <span aria-hidden="true" style={{ color: colors.textMuted }}>
                ·
              </span>
              <span style={{ color: colors.textMuted }}>{currentQuestion.topic}</span>
            </div>
            <span className="tabular-nums font-bold" style={{ color: colors.accent }}>
              Pergunta {currentIndex + 1} de {totalQuestions} · 1.000 pts
            </span>
          </div>

          {/* Featured Question Box */}
          <div
            className="rounded-2xl p-5 sm:p-8 border text-center"
            style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle
            }}
          >
            <h2
              className="font-display font-bold text-lg sm:text-2xl md:text-[26px] leading-snug max-w-3xl mx-auto"
              style={{ color: colors.textPrimary, textWrap: "balance" as any }}
            >
              {currentQuestion.question}
            </h2>
          </div>

          {/* 4 Big Colorful Kahoot-Style Answer Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {currentQuestion.options.map((optionText, idx) => {
              const style = OPTION_STYLES[idx];
              const isSelected = selectedOption === idx;
              const isCorrectOption = idx === currentQuestion.correctIndex;

              let opacityClass = "opacity-100";
              let ringStyle = "";
              if (hasAnswered) {
                if (isCorrectOption) {
                  opacityClass = "opacity-100 scale-[1.01]";
                  ringStyle = "ring-4 ring-white shadow-[0_0_25px_rgba(255,255,255,0.45)]";
                } else if (isSelected && !isCorrectOption) {
                  opacityClass = "opacity-90";
                  ringStyle = "ring-4 ring-red-300";
                } else {
                  opacityClass = "opacity-40";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  disabled={hasAnswered}
                  className={`group relative w-full min-h-[84px] sm:min-h-[100px] p-4 sm:p-5 rounded-2xl border-2 text-left text-white transition-all duration-200 flex items-center gap-3.5 shadow-lg ${
                    !hasAnswered
                      ? "cursor-pointer hover:scale-[1.015] hover:brightness-110 active:scale-[0.985]"
                      : "cursor-default"
                  } ${opacityClass} ${ringStyle}`}
                  style={{
                    backgroundColor: style.bg,
                    borderColor: isSelected || (hasAnswered && isCorrectOption) ? "#ffffff" : style.border
                  }}
                >
                  {/* Geometric Shape + Letter */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-black/25 border border-white/30 flex flex-col items-center justify-center shrink-0 font-mono font-bold">
                    <span className="text-sm leading-none">{style.shape}</span>
                    <span className="text-[10px] leading-none mt-0.5 opacity-90">{style.letter}</span>
                  </div>

                  {/* Option Text */}
                  <span className="flex-1 font-sans font-semibold text-sm sm:text-base leading-snug text-white">
                    {optionText}
                  </span>

                  {/* Status Label after Answering */}
                  {hasAnswered && isCorrectOption && (
                    <div className="shrink-0 flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/40 text-[11px] font-mono font-bold uppercase">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                      <span className="hidden md:inline">Correta</span>
                    </div>
                  )}
                  {hasAnswered && isSelected && !isCorrectOption && (
                    <div className="shrink-0 flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/40 text-[11px] font-mono font-bold uppercase">
                      <XCircle className="w-4 h-4 text-red-200 shrink-0" />
                      <span className="hidden md:inline">Sua escolha</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Immediate Educational Feedback + Advance Button */}
          {hasAnswered && (
            <div
              className="rounded-2xl p-4 sm:p-5 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in"
              style={{
                backgroundColor: isCurrentCorrect ? "rgba(16, 185, 129, 0.14)" : "rgba(239, 68, 68, 0.14)",
                borderColor: isCurrentCorrect ? "#10b981" : "#ef4444"
              }}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 font-mono font-bold text-sm uppercase">
                  {isCurrentCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300">Resposta Correta · +1.000 pontos</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <span className="text-red-300">Resposta Incorreta · 0 pontos</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-sans leading-relaxed" style={{ color: colors.textPrimary }}>
                  {isCurrentCorrect ? currentQuestion.feedbackCorrect : currentQuestion.feedbackIncorrect}
                </p>
              </div>

              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-3.5 rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider border-2 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 shadow-md whitespace-nowrap"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.primaryText,
                  borderColor: colors.borderMain
                }}
              >
                <span>{currentIndex + 1 < totalQuestions ? "Próxima Pergunta" : "Ver Resultado Final"}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: FINAL RESULTS SCREEN */}
      {quizPhase === "results" && (
        <div
          className="rounded-3xl p-6 sm:p-10 border-2 backdrop-blur-md space-y-7 shadow-2xl text-center animate-fade-in"
          style={{
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderMain,
            boxShadow: `0 0 32px ${glowColor}`
          }}
        >
          {/* Total Score Header */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2 shadow-lg"
              style={{
                backgroundColor: colors.primary,
                color: colors.primaryText,
                borderColor: colors.borderMain
              }}
            >
              <Award className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: colors.textMuted }}>
                Resultado Final · Quiz Desafio das Florestas
              </p>
              <h2
                className="font-display font-extrabold text-3xl sm:text-5xl tabular-nums"
                style={{ color: colors.textPrimary }}
              >
                {score.toLocaleString("pt-BR")}{" "}
                <span className="text-lg sm:text-2xl opacity-75">
                  / {QUIZ_MAX_SCORE.toLocaleString("pt-BR")} pontos
                </span>
              </h2>
            </div>

            <p
              className="font-display font-bold text-base sm:text-xl max-w-xl mx-auto mt-1"
              style={{ color: colors.accent }}
            >
              {encouragementMessage}
            </p>
          </div>

          {/* General Metrics: Acertos, Erros, Aproveitamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto">
            <div
              className="p-4 rounded-2xl border flex flex-col items-center gap-1"
              style={{
                backgroundColor: colors.bgCard,
                borderColor: colors.borderSubtle
              }}
            >
              <span className="text-[11px] font-mono uppercase font-bold" style={{ color: colors.textMuted }}>
                Acertos
              </span>
              <span className="font-display font-extrabold text-2xl sm:text-3xl text-emerald-400 tabular-nums">
                {correctCount} <span className="text-sm opacity-75">/ {totalQuestions}</span>
              </span>
            </div>

            <div
              className="p-4 rounded-2xl border flex flex-col items-center gap-1"
              style={{
                backgroundColor: colors.bgCard,
                borderColor: colors.borderSubtle
              }}
            >
              <span className="text-[11px] font-mono uppercase font-bold" style={{ color: colors.textMuted }}>
                Erros
              </span>
              <span className="font-display font-extrabold text-2xl sm:text-3xl text-red-400 tabular-nums">
                {incorrectCount} <span className="text-sm opacity-75">/ {totalQuestions}</span>
              </span>
            </div>

            <div
              className="p-4 rounded-2xl border flex flex-col items-center gap-1"
              style={{
                backgroundColor: colors.bgCard,
                borderColor: colors.borderSubtle
              }}
            >
              <span className="text-[11px] font-mono uppercase font-bold" style={{ color: colors.textMuted }}>
                Aproveitamento
              </span>
              <span className="font-display font-extrabold text-2xl sm:text-3xl tabular-nums" style={{ color: colors.primary }}>
                {accuracyPercent}%
              </span>
            </div>
          </div>

          {/* Individual Performance by Theme (Florestas, Amazônia, Taiga) */}
          <div className="max-w-3xl mx-auto space-y-3 text-left">
            <div className="text-xs font-mono font-bold uppercase tracking-wider px-1" style={{ color: colors.textMuted }}>
              Desempenho por Tema
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {themeBreakdown.map((item) => (
                <div
                  key={item.themeId}
                  className="rounded-2xl border p-4 space-y-3"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderColor: colors.borderSubtle
                  }}
                >
                  <div className="flex items-center gap-2">
                    {renderThemeIcon(item.themeId, "w-4 h-4 shrink-0")}
                    <span className="font-display font-bold text-sm" style={{ color: colors.textPrimary }}>
                      {item.themeId === "florestas"
                        ? "Florestas"
                        : item.themeId === "amazonia"
                        ? "Floresta Amazônica"
                        : "Floresta Taiga"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between font-mono tabular-nums">
                    <span className="text-lg font-extrabold" style={{ color: colors.textPrimary }}>
                      {item.hits}/{item.totalQuestions} acertos
                    </span>
                    <span className="text-xs font-bold" style={{ color: colors.accent }}>
                      {item.points.toLocaleString("pt-BR")} pts
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full overflow-hidden bg-black/40">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.pct}%`,
                        backgroundColor:
                          item.themeId === "amazonia"
                            ? "#10b981"
                            : item.themeId === "taiga"
                            ? "#38bdf8"
                            : colors.primary
                      }}
                    />
                  </div>

                  <div className="text-[11px] font-mono tabular-nums" style={{ color: colors.textMuted }}>
                    {item.pct}% de aproveitamento neste tema
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 15-Question Summary List */}
          <div
            className="max-w-3xl mx-auto rounded-2xl border p-4 text-left space-y-2"
            style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.borderSubtle
            }}
          >
            <div
              className="text-xs font-mono font-bold uppercase tracking-wider pb-2 border-b"
              style={{ color: colors.textMuted, borderColor: colors.borderSubtle }}
            >
              Resumo das 15 Perguntas
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {answers.map((ans) => (
                <div key={ans.questionId} className="flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    {ans.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="tabular-nums opacity-70 shrink-0">#{ans.questionNumber}</span>
                    <span className="font-bold shrink-0" style={{ color: colors.accent }}>
                      {ans.themeName}
                    </span>
                    <span className="truncate opacity-85" style={{ color: colors.textPrimary }}>
                      · {ans.topic}
                    </span>
                  </div>
                  <span className={`font-bold shrink-0 tabular-nums ${ans.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                    {ans.isCorrect ? "+1.000 pts" : "0 pts"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Required Final Buttons: JOGAR NOVAMENTE + VOLTAR À APRESENTAÇÃO */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={handleRestartQuiz}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider border-2 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap"
              style={{
                backgroundColor: colors.primary,
                color: colors.primaryText,
                borderColor: colors.borderMain
              }}
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>JOGAR NOVAMENTE</span>
            </button>

            <button
              type="button"
              onClick={onBackToPresentation}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider border-2 flex items-center justify-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-95 shadow-lg whitespace-nowrap"
              style={{
                backgroundColor: colors.bgCard,
                color: colors.textPrimary,
                borderColor: colors.borderSubtle
              }}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>VOLTAR À APRESENTAÇÃO</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
