import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Tv,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  ArrowRight,
  Settings,
  Video,
  Eye,
  EyeOff,
  Play,
  Image as ImageIcon,
  Maximize,
  Minimize,
  Smartphone,
  ShieldCheck,
  Lock,
  RefreshCw,
  Sliders,
  Save,
  Trees,
  TreePine,
  Globe,
  Award,
  CheckCircle2,
  Satellite,
  Radio,
  Leaf
} from "lucide-react";
import { Trigger } from "./types";
import { safeStorage } from "./safeStorage";
import { ThemeId, THEMES, THEME_LIST } from "./themes";
import {
  RENATO_ROSA_PROJECT,
  matchForestTrigger
} from "./themeTriggers";
import { SmartAmbientParticles } from "./components/SmartAmbientParticles";
import { SmartEcosystemModal } from "./components/SmartEcosystemDrawer";
import { ForestQuiz } from "./components/ForestQuiz";

export type ExperienceState =
  | "AGUARDANDO"
  | "INTRODUCAO"
  | "ESCUTANDO"
  | "PROCESSANDO"
  | "REPRODUZINDO";

export type VideoQualityPreference = "hd1080" | "hd720" | "large" | "medium" | "auto";

export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return Boolean(getYouTubeVideoId(url));
}

// Clear stale data from older projects once so no previous groups/biomes ever appear
function clearLegacyStorageIfNeeded() {
  try {
    const currentVersion = safeStorage.getItem("renato_rosa_project_v1");
    if (currentVersion !== "1") {
      const legacyKeys = [
        "eco_custom_questions",
        "eco_intro_url",
        "eco_intro_name",
        "wit_suggested_questions",
        "wit_selected_theme",
        "eco_used_trigger_ids"
      ];
      legacyKeys.forEach((k) => safeStorage.removeItem(k));
      safeStorage.setItem("renato_rosa_project_v1", "1");
    }
  } catch (_) {}
}

clearLegacyStorageIfNeeded();

export default function App() {
  const project = RENATO_ROSA_PROJECT;

  // Navigation Tabs: "chat" (Presentation & Voice Assistant) | "quiz" | "settings"
  const [activeTab, setActiveTab] = useState<"chat" | "quiz" | "settings">("chat");

  // Active Visual Theme ("florestas" | "amazonia" | "taiga")
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>("florestas");
  const currentTheme = THEMES[selectedThemeId] || THEMES.florestas;

  // Interactive Experience State
  const [experienceState, setExperienceState] = useState<ExperienceState>("AGUARDANDO");

  // Monitoring Center Modal
  const [showEcosystemModal, setShowEcosystemModal] = useState<boolean>(false);

  // Toast Notification
  const [saveToast, setSaveToast] = useState<{ message: string; visible: boolean } | null>(null);
  const showSaveSuccess = (message: string) => {
    setSaveToast({ message, visible: true });
    setTimeout(() => {
      setSaveToast((prev) => (prev ? { ...prev, visible: false } : null));
    }, 3500);
  };

  // Active Video Slot: "intro" or one of the 2 fixed triggers ("trigger_amazonia" | "trigger_taiga")
  const [activeVideoSlot, setActiveVideoSlot] = useState<string>("intro");
  const [ytReloadKey, setYtReloadKey] = useState<number>(0);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Assistant Interaction & Voice States
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastSpeechDetected, setLastSpeechDetected] = useState<string>("");
  const [realtimeSpeech, setRealtimeSpeech] = useState<string>("");
  const [speechError, setSpeechError] = useState("");
  const [aiResponseText, setAiResponseText] = useState<string>(
    "Central pronta. Clique em INICIAR APRESENTAÇÃO ou fale sobre a Amazônia ou sobre a Taiga."
  );

  // Playback States (No auto-loop, no auto-fullscreen, FIT mode)
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoPlayError, setVideoPlayError] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [viewedSlots, setViewedSlots] = useState<string[]>([]);
  const [videoFinished, setVideoFinished] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // Microphone & Audio Recording States
  const [isRecordingMedia, setIsRecordingMedia] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied" | "prompt" | "unsupported">("unknown");
  const [showMicModal, setShowMicModal] = useState<boolean>(false);
  const [preferredSpeechEngine, setPreferredSpeechEngine] = useState<"auto" | "gemini" | "native">(() => {
    const saved = safeStorage.getItem("eco_speech_engine");
    if (saved === "gemini" || saved === "native" || saved === "auto") return saved;
    return "auto";
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const autoStopTimeoutRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // Playback Execution Guard Refs
  const executionIdRef = useRef<number>(0);
  const activeExecutionIdRef = useRef<number>(0);
  const hasEndedCurrentExecutionRef = useRef<number>(-1);
  const handleVideoEndedRef = useRef<(source: string, execId?: number) => void>(() => {});
  const videoFinishedRef = useRef<boolean>(false);
  const isVideoPlayingRef = useRef<boolean>(false);

  // Responsive & Manual Fullscreen States (never automatic)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") return window.innerWidth < 768;
    return false;
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Video Quality Preferences (FIT is always "contain" to prevent cropping)
  const [preferredVideoQuality, setPreferredVideoQuality] = useState<VideoQualityPreference>(() => {
    const saved = safeStorage.getItem("eco_video_quality");
    if (saved === "hd1080" || saved === "hd720" || saved === "large" || saved === "medium" || saved === "auto") {
      return saved;
    }
    return "hd1080";
  });
  const preferredVideoQualityRef = useRef<VideoQualityPreference>(preferredVideoQuality);

  const [force1080pOnly, setForce1080pOnly] = useState<boolean>(() => {
    const saved = safeStorage.getItem("eco_force_1080p_only");
    return saved !== null ? saved === "true" : true;
  });

  // Environmental Background Controls
  const [showBgImage, setShowBgImage] = useState<boolean>(() => {
    const saved = safeStorage.getItem("eco_show_bg_image");
    return saved !== null ? saved === "true" : true;
  });
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const saved = safeStorage.getItem("eco_bg_opacity");
    return saved !== null ? Number(saved) : 35;
  });
  const [hidePanels, setHidePanels] = useState<boolean>(false);

  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerInstanceRef = useRef<any>(null);

  useEffect(() => {
    preferredVideoQualityRef.current = preferredVideoQuality;
    safeStorage.setItem("eco_video_quality", preferredVideoQuality);
  }, [preferredVideoQuality]);

  useEffect(() => {
    safeStorage.setItem("eco_force_1080p_only", String(force1080pOnly));
    if (force1080pOnly) {
      setPreferredVideoQuality("hd1080");
    }
  }, [force1080pOnly]);

  useEffect(() => {
    safeStorage.setItem("eco_speech_engine", preferredSpeechEngine);
  }, [preferredSpeechEngine]);

  useEffect(() => {
    safeStorage.setItem("eco_show_bg_image", String(showBgImage));
  }, [showBgImage]);

  useEffect(() => {
    safeStorage.setItem("eco_bg_opacity", String(bgOpacity));
  }, [bgOpacity]);

  // Check initial microphone permissions
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions && (navigator.permissions as any).query) {
      try {
        navigator.permissions
          .query({ name: "microphone" as PermissionName })
          .then((status) => {
            setMicPermission(status.state as any);
            status.onchange = () => {
              setMicPermission(status.state as any);
            };
          })
          .catch(() => setMicPermission("unknown"));
      } catch (_) {
        setMicPermission("unknown");
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, [isFullscreen]);

  // Load official YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Manual Fullscreen Toggle ONLY (Never triggered automatically on video playback)
  const enterFullscreenManual = async () => {
    setIsFullscreen(true);
    try {
      if (videoContainerRef.current && !document.fullscreenElement) {
        if (videoContainerRef.current.requestFullscreen) {
          await videoContainerRef.current.requestFullscreen().catch(() => {});
        }
      }
    } catch (_) {}
  };

  const exitFullscreenManual = async () => {
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch (_) {}
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await enterFullscreenManual();
    } else {
      await exitFullscreenManual();
    }
  };

  // Quality Enforcement Helpers
  const enforceYtQuality = (qualityOverride?: VideoQualityPreference) => {
    const q = qualityOverride || preferredVideoQualityRef.current || preferredVideoQuality;
    const targetQ = q === "auto" ? "hd1080" : q;

    if (ytPlayerInstanceRef.current) {
      try {
        ytPlayerInstanceRef.current.setPlaybackQuality?.(targetQ);
        ytPlayerInstanceRef.current.setPlaybackQualityRange?.(targetQ, "highres");
        ytPlayerInstanceRef.current.setSuggestedQuality?.(targetQ);
      } catch (_) {}
    }

    if (ytIframeRef.current?.contentWindow) {
      try {
        const win = ytIframeRef.current.contentWindow;
        win.postMessage('{"event":"listening","id":1,"channel":"widget"}', "*");
        win.postMessage(JSON.stringify({ event: "command", func: "setPlaybackQuality", args: [targetQ] }), "*");
        win.postMessage(JSON.stringify({ event: "command", func: "setPlaybackQualityRange", args: [targetQ, "highres"] }), "*");
        win.postMessage(JSON.stringify({ event: "command", func: "setSuggestedQuality", args: [targetQ] }), "*");
      } catch (_) {}
    }
  };

  const triggerQualityAutoPulse = (qualityOverride?: VideoQualityPreference) => {
    enforceYtQuality(qualityOverride);
    [50, 200, 500, 1000, 2000, 3500].forEach((delay) => {
      setTimeout(() => enforceYtQuality(qualityOverride), delay);
    });
  };

  useEffect(() => {
    if (!force1080pOnly || !hasStarted || videoFinished) return;
    const interval = setInterval(() => enforceYtQuality("hd1080"), 1500);
    return () => clearInterval(interval);
  }, [force1080pOnly, hasStarted, videoFinished, activeVideoSlot]);

  // Suspend voice recognition during active video playback to prevent accidental trigger activations
  const suspendSpeechRecognition = () => {
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    } catch (_) {}
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
    } catch (_) {}
    try {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
    } catch (_) {}
    setIsRecordingMedia(false);
    setIsListening(false);
    setIsTranscribing(false);
    setAudioLevel(0);
  };

  // Attach YouTube Player IFrame API for reliable end-of-video detection & anti-loop
  const attachYtPlayer = () => {
    if (typeof window === "undefined") return;
    const currentExec = activeExecutionIdRef.current;
    try {
      const YT = (window as any).YT;
      if (YT && YT.Player && ytIframeRef.current) {
        ytPlayerInstanceRef.current = new YT.Player(ytIframeRef.current, {
          events: {
            onReady: (e: any) => {
              try {
                const targetQ = preferredVideoQualityRef.current === "auto" ? "hd1080" : preferredVideoQualityRef.current;
                e.target.setPlaybackQuality?.(targetQ);
                e.target.setPlaybackQualityRange?.(targetQ, "highres");
                e.target.setSuggestedQuality?.(targetQ);
                if (videoFinishedRef.current) {
                  e.target.pauseVideo?.();
                  e.target.stopVideo?.();
                }
              } catch (_) {}
            },
            onStateChange: (e: any) => {
              if (videoFinishedRef.current && (e.data === 1 || e.data === 3)) {
                try {
                  e.target.pauseVideo?.();
                  e.target.stopVideo?.();
                } catch (_) {}
                return;
              }
              if (e.data === 1 || e.data === 3) {
                enforceYtQuality();
              }
              // 0 = ENDED -> stop immediately, no loop, return to interaction
              if (e.data === 0) {
                try {
                  e.target.pauseVideo?.();
                  e.target.stopVideo?.();
                } catch (_) {}
                handleVideoEndedRef.current("yt_player_ended", currentExec);
              }
            }
          }
        });
      }
    } catch (_) {}
  };

  // Trigger a video slot (Intro or one of the 2 triggers)
  const triggerVideoSlot = (slotId: string, announceText?: string) => {
    const execId = ++executionIdRef.current;
    activeExecutionIdRef.current = execId;
    hasEndedCurrentExecutionRef.current = -1;

    setHasStarted(true);
    setVideoFinished(false);

    // Suspend microphone while video plays so voice recognition does not fire accidentally
    suspendSpeechRecognition();

    const isSameSlot = activeVideoSlot === slotId;
    setActiveVideoSlot(slotId);
    if (isSameSlot) {
      setYtReloadKey((prev) => prev + 1);
    }

    if (slotId === "intro") {
      setSelectedThemeId("florestas");
      setExperienceState("INTRODUCAO");
      setAiResponseText(announceText || "Reproduzindo introdução: CONHECENDO AS FLORESTAS.");
    } else if (slotId === "trigger_amazonia") {
      setSelectedThemeId("amazonia");
      setExperienceState("REPRODUZINDO");
      setAiResponseText(announceText || 'Transmitindo conteúdo: "Me fale sobre a Amazônia."');
    } else if (slotId === "trigger_taiga") {
      setSelectedThemeId("taiga");
      setExperienceState("REPRODUZINDO");
      setAiResponseText(announceText || 'Transmitindo conteúdo: "Me fale sobre a Taiga."');
    }

    triggerQualityAutoPulse();
  };

  useEffect(() => {
    videoFinishedRef.current = videoFinished;
    isVideoPlayingRef.current = hasStarted && !videoFinished && activeTab === "chat";
  }, [videoFinished, hasStarted, activeTab]);

  // Unified End-of-Video Handler: stops playback (no loop), returns to interaction, re-enables mic
  const handleVideoEnded = (source: string = "unknown", execId?: number) => {
    const targetExec = execId ?? activeExecutionIdRef.current;
    if (hasEndedCurrentExecutionRef.current === targetExec) return;
    hasEndedCurrentExecutionRef.current = targetExec;

    try {
      ytPlayerInstanceRef.current?.pauseVideo?.();
      ytPlayerInstanceRef.current?.stopVideo?.();
    } catch (_) {}

    try {
      if (ytIframeRef.current?.contentWindow) {
        ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
        ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', "*");
      }
    } catch (_) {}

    try {
      videoRef.current?.pause();
    } catch (_) {}

    setVideoFinished(true);
    setViewedSlots((prev) => (prev.includes(activeVideoSlot) ? prev : [...prev, activeVideoSlot]));
    if (isFullscreen) {
      exitFullscreenManual();
    }

    setExperienceState("ESCUTANDO");
    setAiResponseText(
      "Vídeo concluído! O microfone está pronto: fale sobre a Amazônia ou sobre a Taiga, ou clique em um tema abaixo."
    );

    // Re-enable microphone if user already granted permission
    setTimeout(() => {
      if (micPermission === "granted") {
        startListeningIfAllowed();
      }
    }, 350);
  };

  useEffect(() => {
    handleVideoEndedRef.current = handleVideoEnded;
  });

  const handleReplayVideo = () => {
    triggerVideoSlot(activeVideoSlot);
  };

  // Continuous YouTube IFrame listener & safety timer to catch end-of-video reliably without loop
  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => {
      try {
        if (ytIframeRef.current?.contentWindow) {
          ytIframeRef.current.contentWindow.postMessage('{"event":"listening","id":1,"channel":"widget"}', "*");
        }
        if (!videoFinishedRef.current) {
          const currentExec = activeExecutionIdRef.current;
          if (ytPlayerInstanceRef.current && typeof ytPlayerInstanceRef.current.getCurrentTime === "function") {
            const curr = ytPlayerInstanceRef.current.getCurrentTime();
            const dur = ytPlayerInstanceRef.current.getDuration();
            if (dur > 0 && curr >= dur - 0.45) {
              try {
                ytPlayerInstanceRef.current.pauseVideo?.();
                ytPlayerInstanceRef.current.stopVideo?.();
              } catch (_) {}
              handleVideoEndedRef.current("interval_time_fallback", currentExec);
            }
          }
        }
      } catch (_) {}
    }, 350);
    return () => clearInterval(interval);
  }, [hasStarted]);

  // Stable window postMessage listener for YouTube player state
  useEffect(() => {
    const handleYtMessage = (event: MessageEvent) => {
      try {
        let payload: any = event.data;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (_) {
            return;
          }
        }
        if (!payload) return;
        const currentExec = activeExecutionIdRef.current;

        // Anti-loop protection
        if (
          videoFinishedRef.current &&
          (payload.info === 1 || payload.info?.playerState === 1 || payload.info === 3 || payload.info?.playerState === 3)
        ) {
          try {
            ytPlayerInstanceRef.current?.pauseVideo?.();
            ytPlayerInstanceRef.current?.stopVideo?.();
            ytIframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
            ytIframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"stopVideo","args":""}', "*");
          } catch (_) {}
          return;
        }

        if (
          payload.event === "onReady" ||
          payload.event === "initialDelivery" ||
          payload.event === "listening" ||
          payload.info === 1 ||
          payload.info === 3 ||
          (payload.info && (payload.info.playerState === 1 || payload.info.playerState === 3))
        ) {
          enforceYtQuality();
        }

        if (payload.event === "onStateChange" && payload.info === 0) {
          handleVideoEndedRef.current("postMessage_onStateChange", currentExec);
        } else if (payload.info && payload.info.playerState === 0) {
          handleVideoEndedRef.current("postMessage_playerState0", currentExec);
        }
      } catch (_) {}
    };

    window.addEventListener("message", handleYtMessage);
    return () => window.removeEventListener("message", handleYtMessage);
  }, []);

  // Sync mute state to YouTube iframe
  useEffect(() => {
    if (ytIframeRef.current?.contentWindow) {
      try {
        const cmd = videoMuted ? "mute" : "unMute";
        ytIframeRef.current.contentWindow.postMessage(`{"event":"command","func":"${cmd}","args":""}`, "*");
      } catch (_) {}
    }
  }, [videoMuted, ytReloadKey]);

  // Escape key lets presenter finish video early cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && hasStarted && !videoFinished && activeTab === "chat") {
        handleVideoEnded("escape_key");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasStarted, videoFinished, activeTab]);

  // Compute active video URL & title
  const activeVideoUrl = (() => {
    if (activeVideoSlot === "intro") return project.intro.videoUrl;
    const match = project.triggers.find((t) => t.id === activeVideoSlot);
    return match ? match.videoUrl : project.intro.videoUrl;
  })();

  const getActiveVideoTitle = () => {
    if (activeVideoSlot === "intro") return project.intro.title;
    const match = project.triggers.find((t) => t.id === activeVideoSlot);
    return match ? `${match.title} — ${match.phrase}` : project.intro.title;
  };

  // Navigate cleanly to QUIZ — DESAFIO DAS FLORESTAS
  const openForestQuiz = () => {
    suspendSpeechRecognition();
    try {
      ytPlayerInstanceRef.current?.pauseVideo?.();
    } catch (_) {}
    if (isFullscreen) {
      exitFullscreenManual();
    }
    setActiveTab("quiz");
  };

  // Incoming voice or text command handler
  const handleIncomingCommand = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Prevent accidental triggers while a video is actively playing
    if (isVideoPlayingRef.current) {
      return;
    }

    const lower = trimmed.toLowerCase();
    if (lower.includes("rever") || lower.includes("reassistir") || lower.includes("ver de novo")) {
      handleReplayVideo();
      setIsAnalyzing(false);
      return;
    }

    setLastSpeechDetected(trimmed);
    setInputText("");
    setIsAnalyzing(true);
    setSpeechError("");
    setExperienceState("PROCESSANDO");

    // 1. Direct local voice matcher for Renato Rosa triggers (Amazônia, Taiga, Intro)
    const matchedSlotId = matchForestTrigger(trimmed);
    if (matchedSlotId === "intro") {
      triggerVideoSlot("intro");
      setIsAnalyzing(false);
      return;
    } else if (matchedSlotId) {
      triggerVideoSlot(matchedSlotId);
      setIsAnalyzing(false);
      return;
    }

    // 2. Semantic fallback via /api/gemini/analyze
    try {
      const virtualTriggers: Trigger[] = [
        ...project.triggers.map((t) => ({
          id: t.id,
          phrase: t.phrase,
          videoUrl: t.videoUrl,
          description: t.description
        }))
      ];

      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: trimmed,
          triggers: virtualTriggers
        })
      });

      if (response.ok) {
        const result = await response.json();
        const matchedId = result.matchedTriggerId;
        if (matchedId === "trigger_amazonia" || matchedId === "trigger_taiga") {
          triggerVideoSlot(matchedId, result.response);
          setIsAnalyzing(false);
          return;
        }
      }
    } catch (_) {}

    setAiResponseText(
      'Comando não identificado. Experimente falar: "Me fale sobre a Amazônia." ou "Me fale sobre a Taiga."'
    );
    setIsAnalyzing(false);
    setExperienceState(micPermission === "granted" ? "ESCUTANDO" : "AGUARDANDO");
  };

  // Microphone Permission & Audio Capture Logic
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSpeechError("Navegador não possui suporte para acesso ao microfone.");
        setMicPermission("unsupported");
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      setMicPermission("granted");
      setSpeechError("");
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicPermission("denied");
        setSpeechError("Microfone bloqueado pelo navegador. Libere a permissão para usar os comandos de voz.");
        setShowMicModal(true);
      } else {
        setSpeechError(`Erro no microfone: ${err.message || err.name}`);
      }
      return false;
    }
  };

  const cleanupAudioRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      audioStreamRef.current = null;
    }
    setAudioLevel(0);
    setIsRecordingMedia(false);
  };

  const stopMediaRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {
        cleanupAudioRecording();
        setIsListening(false);
      }
    } else {
      cleanupAudioRecording();
      setIsListening(false);
    }
  };

  const startMediaRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSpeechError("Captura de microfone indisponível neste navegador.");
        return;
      }

      setSpeechError("");
      setRealtimeSpeech("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      audioStreamRef.current = stream;
      setMicPermission("granted");
      setIsListening(true);
      setIsRecordingMedia(true);
      setRecordingDuration(0);
      setExperienceState("ESCUTANDO");

      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          const ctx = new AudioCtxClass();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.5;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          audioContextRef.current = ctx;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const tickLevel = () => {
            if (!audioStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 120) * 100)));
            animationFrameRef.current = requestAnimationFrame(tickLevel);
          };
          tickLevel();
        }
      } catch (_) {}

      const candidateMimes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac", "audio/ogg;codecs=opus"];
      let selectedMime = "";
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
        for (const m of candidateMimes) {
          if (MediaRecorder.isTypeSupported(m)) {
            selectedMime = m;
            break;
          }
        }
      }

      const recorder = selectedMime ? new MediaRecorder(stream, { mimeType: selectedMime }) : new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const recordedMime = recorder.mimeType || selectedMime || "audio/webm";
        const chunks = [...audioChunksRef.current];
        cleanupAudioRecording();
        setIsListening(false);

        if (chunks.length === 0) {
          setSpeechError("Nenhum áudio detectado.");
          return;
        }

        const audioBlob = new Blob(chunks, { type: recordedMime });
        if (audioBlob.size < 400) {
          setSpeechError('Áudio muito curto. Fale "Me fale sobre a Amazônia" ou "Me fale sobre a Taiga".');
          return;
        }

        setIsAnalyzing(true);
        setIsTranscribing(true);
        setSpeechError("");

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64Data = reader.result as string;
              const res = await fetch("/api/transcribe-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audioData: base64Data, mimeType: recordedMime })
              });
              if (!res.ok) throw new Error(`Status ${res.status}`);
              const data = await res.json();
              setIsTranscribing(false);
              setIsAnalyzing(false);

              if (data.transcript && data.transcript.trim()) {
                if (isVideoPlayingRef.current) return;
                const text = data.transcript.trim();
                setLastSpeechDetected(text);
                setRealtimeSpeech("");
                handleIncomingCommand(text);
              } else {
                setSpeechError("Nenhuma fala detectada. Tente falar mais próximo do microfone.");
              }
            } catch (_) {
              setIsTranscribing(false);
              setIsAnalyzing(false);
              setSpeechError("Não foi possível transcrever o áudio gravado.");
            }
          };
        } catch (_) {
          setIsTranscribing(false);
          setIsAnalyzing(false);
          setSpeechError("Erro ao processar áudio.");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      autoStopTimeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 7000);
    } catch (err: any) {
      cleanupAudioRecording();
      setIsListening(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicPermission("denied");
        setSpeechError("Acesso ao microfone negado.");
        setShowMicModal(true);
      } else {
        setSpeechError(`Erro ao abrir microfone: ${err.message || err.name}`);
      }
    }
  };

  const startListeningNative = (SpeechRecognitionClass: any) => {
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.lang = "pt-BR";
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setIsRecordingMedia(false);
        setSpeechError("");
        setRealtimeSpeech("");
        setExperienceState("ESCUTANDO");
      };

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else interimTranscript += event.results[i][0].transcript;
        }
        if (interimTranscript) setRealtimeSpeech(interimTranscript);
        if (finalTranscript) {
          if (isVideoPlayingRef.current) {
            setIsListening(false);
            return;
          }
          setLastSpeechDetected(finalTranscript);
          setRealtimeSpeech("");
          setIsListening(false);
          handleIncomingCommand(finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        setIsListening(false);
        setRealtimeSpeech("");
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicPermission("denied");
          startMediaRecording();
        } else if (event.error === "no-speech") {
          setSpeechError("Nenhuma fala detectada. Toque no microfone e fale claramente.");
        } else if (event.error === "network") {
          startMediaRecording();
        } else {
          setSpeechError(`Aviso do microfone: ${event.error}`);
        }
      };

      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
      rec.start();
    } catch (_) {
      startMediaRecording();
    }
  };

  const startListeningIfAllowed = () => {
    if (micPermission !== "granted") return;
    if (isListening || isRecordingMedia) return;
    if (isVideoPlayingRef.current) return;
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (isMobile || preferredSpeechEngine === "gemini" || !SpeechRecognitionClass) {
      startMediaRecording();
    } else {
      startListeningNative(SpeechRecognitionClass);
    }
  };

  const toggleListening = async () => {
    if (isVideoPlayingRef.current) {
      showSaveSuccess("Microfone aguardando a conclusão do vídeo para evitar acionamento acidental.");
      return;
    }

    if (isListening || isRecordingMedia) {
      if (isRecordingMedia) {
        stopMediaRecording();
      } else if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      setExperienceState("AGUARDANDO");
      return;
    }

    setSpeechError("");
    setRealtimeSpeech("");
    setExperienceState("ESCUTANDO");

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (isMobile || preferredSpeechEngine === "gemini" || !SpeechRecognitionClass) {
      await startMediaRecording();
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setMicPermission("granted");
      }
      startListeningNative(SpeechRecognitionClass);
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicPermission("denied");
        setSpeechError("Permissão de microfone negada. Autorize o microfone no navegador.");
        setShowMicModal(true);
      } else {
        await startMediaRecording();
      }
    }
  };

  const handleSaveSettings = () => {
    try {
      safeStorage.setItem("eco_video_quality", preferredVideoQuality);
      safeStorage.setItem("eco_force_1080p_only", String(force1080pOnly));
      safeStorage.setItem("eco_speech_engine", preferredSpeechEngine);
      safeStorage.setItem("eco_show_bg_image", String(showBgImage));
      safeStorage.setItem("eco_bg_opacity", String(bgOpacity));
      showSaveSuccess("Preferências do Projeto Renato Rosa salvas!");
    } catch (_) {
      showSaveSuccess("Preferências mantidas na sessão atual.");
    }
  };

  const renderThemeIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case "Trees":
        return <Trees className={className} />;
      case "TreePine":
        return <TreePine className={className} />;
      default:
        return <Globe className={className} />;
    }
  };

  return (
    <div
      id="renato-rosa-root"
      className="min-h-screen font-sans flex flex-col relative overflow-x-hidden transition-colors duration-500 forest-monitor-grid"
      style={{
        backgroundColor: currentTheme.colors.bgApp,
        color: currentTheme.colors.textPrimary
      }}
    >
      {/* Toast Notification */}
      {saveToast && saveToast.visible && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none animate-fade-in">
          <div
            className="font-mono font-bold text-xs px-5 py-2.5 rounded-xl shadow-2xl border-2 flex items-center gap-2.5"
            style={{
              backgroundColor: currentTheme.colors.primary,
              color: currentTheme.colors.primaryText,
              borderColor: currentTheme.colors.borderMain
            }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveToast.message}</span>
          </div>
        </div>
      )}

      {/* Futuristic Forest Monitoring Backdrop */}
      {showBgImage && (
        <div
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-700"
          aria-hidden="true"
          style={{ opacity: bgOpacity / 100 }}
        >
          <img
            key={currentTheme.id}
            src={currentTheme.bgImage}
            alt={`${currentTheme.name} — ${currentTheme.environmentTitle}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center scale-[1.01] transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020c13]/65 via-[#020c13]/70 to-[#020c13]" />
        </div>
      )}

      {/* Ambient Particles (Fireflies for Florestas/Amazônia, Snow for Taiga) */}
      <SmartAmbientParticles particleType={currentTheme.particleType} glowColor={currentTheme.glowColor} />

      {/* Top Navigation Bar */}
      {!hidePanels && !isFullscreen && (
        <header
          className="backdrop-blur-md border-b py-3 px-3 sm:px-6 sticky top-0 z-20 transition-colors duration-300"
          style={{
            backgroundColor: currentTheme.colors.bgSurface,
            borderColor: currentTheme.colors.borderSubtle
          }}
        >
          <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
            {/* Brand Identification: RENATO ROSA — ASSISTENTE VIRTUAL DAS FLORESTAS */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 shadow-md"
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  color: currentTheme.colors.primaryText,
                  borderColor: currentTheme.colors.borderMain,
                  boxShadow: `0 0 14px ${currentTheme.glowColor}`
                }}
              >
                <Trees className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-display font-extrabold text-base sm:text-lg tracking-wide whitespace-nowrap"
                    style={{ color: currentTheme.colors.textPrimary }}
                  >
                    RENATO ROSA
                  </span>
                </div>
                <div
                  className="text-[10px] sm:text-xs font-mono tracking-wider uppercase truncate"
                  style={{ color: currentTheme.colors.accent }}
                >
                  ASSISTENTE VIRTUAL DAS FLORESTAS
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar py-0.5">
              {/* Monitoring Center Trigger */}
              <button
                type="button"
                onClick={() => setShowEcosystemModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer whitespace-nowrap shrink-0 hover:brightness-110"
                style={{
                  backgroundColor: currentTheme.colors.bgCard,
                  color: currentTheme.colors.textSecondary,
                  borderColor: currentTheme.colors.borderSubtle
                }}
                title="Abrir Painel de Sensores, Satélites e Fauna das Florestas"
              >
                <Satellite className="w-3.5 h-3.5 shrink-0" style={{ color: currentTheme.colors.accent }} />
                <span className="hidden lg:inline">Monitoramento</span>
              </button>

              {/* QUIZ — DESAFIO DAS FLORESTAS */}
              <button
                type="button"
                onClick={() => (activeTab === "quiz" ? setActiveTab("chat") : openForestQuiz())}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all border-2 cursor-pointer whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-95"
                style={{
                  backgroundColor: activeTab === "quiz" ? currentTheme.colors.accent : currentTheme.colors.bgCard,
                  color: activeTab === "quiz" ? currentTheme.colors.accentText : currentTheme.colors.accent,
                  borderColor: currentTheme.colors.accent
                }}
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>QUIZ — DESAFIO DAS FLORESTAS</span>
              </button>

              {/* Voice Trigger Button in Header */}
              {activeTab === "chat" && (
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isVideoPlayingRef.current}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all border-2 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isListening || isRecordingMedia ? "bg-red-600 text-white border-white" : ""
                  }`}
                  style={
                    !(isListening || isRecordingMedia)
                      ? {
                          backgroundColor: currentTheme.colors.primary,
                          color: currentTheme.colors.primaryText,
                          borderColor: currentTheme.colors.borderMain
                        }
                      : undefined
                  }
                >
                  {isListening || isRecordingMedia ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 shrink-0" />
                      <span>{isRecordingMedia ? `Ouvindo (${recordingDuration}s)` : "Ouvindo..."}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 shrink-0" />
                      <span>Falar</span>
                    </>
                  )}
                </button>
              )}

              {/* Settings / Player Switch */}
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "chat" ? "settings" : "chat")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: activeTab === "settings" ? currentTheme.colors.primary : currentTheme.colors.bgCard,
                  color: activeTab === "settings" ? currentTheme.colors.primaryText : currentTheme.colors.textSecondary,
                  borderColor: activeTab === "settings" ? currentTheme.colors.borderMain : currentTheme.colors.borderSubtle
                }}
              >
                {activeTab === "chat" ? (
                  <>
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Ajustes</span>
                  </>
                ) : (
                  <>
                    <Tv className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Apresentação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 w-full max-w-7xl mx-auto ${
          isFullscreen ? "p-0 max-w-none" : "px-3 sm:px-6 py-4 sm:py-7"
        } flex flex-col justify-start relative z-10`}
      >
        {/* VIEW 1: ASSISTENTE VIRTUAL DAS FLORESTAS */}
        {activeTab === "chat" && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto w-full">
            {/* Project Banner & Visual Indicators for the 3 Allowed Themes (Florestas · Amazônia · Taiga) */}
            {!isFullscreen && !hidePanels && (
              <div
                className="rounded-2xl p-4 sm:p-5 border-2 backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl"
                style={{
                  backgroundColor: currentTheme.colors.bgSurface,
                  borderColor: currentTheme.colors.borderSubtle,
                  boxShadow: `0 0 26px ${currentTheme.glowColor}`
                }}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono" style={{ color: currentTheme.colors.textMuted }}>
                    <span className="font-bold" style={{ color: currentTheme.colors.primary }}>
                      PROJETO EDUCATIVO RENATO ROSA
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Centro de Monitoramento das Florestas</span>
                    <span aria-hidden="true">·</span>
                    <span style={{ color: currentTheme.colors.accent }}>Estado: {experienceState}</span>
                  </div>
                  <h1
                    className="font-display font-extrabold text-lg sm:text-2xl tracking-tight"
                    style={{ color: currentTheme.colors.textPrimary }}
                  >
                    RENATO ROSA — ASSISTENTE VIRTUAL DAS FLORESTAS
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono" style={{ color: currentTheme.colors.textSecondary }}>
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Florestas</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1.5">
                      <Trees className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Floresta Amazônica</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1.5">
                      <TreePine className="w-3.5 h-3.5 text-sky-400" />
                      <span>Floresta Taiga</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => triggerVideoSlot("intro")}
                    className="px-4 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider border-2 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-md whitespace-nowrap"
                    style={{
                      backgroundColor: currentTheme.colors.primary,
                      color: currentTheme.colors.primaryText,
                      borderColor: currentTheme.colors.borderMain
                    }}
                  >
                    <Play className="w-4 h-4 fill-current shrink-0" />
                    <span>INICIAR APRESENTAÇÃO</span>
                  </button>

                  <button
                    type="button"
                    onClick={openForestQuiz}
                    className="px-4 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider border-2 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-md whitespace-nowrap"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      color: currentTheme.colors.accent,
                      borderColor: currentTheme.colors.accent
                    }}
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>QUIZ — DESAFIO DAS FLORESTAS</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Video Player Stage (16:9 FIT — No Auto-Fullscreen, No Loop) */}
            <div className="w-full relative">
              <div
                ref={videoContainerRef}
                className={
                  isFullscreen
                    ? "fixed inset-0 z-50 w-screen h-[100dvh] bg-black m-0 p-0 overflow-hidden flex flex-col justify-center items-center"
                    : "border-2 rounded-2xl sm:rounded-3xl relative w-full aspect-video max-h-[75vh] sm:max-h-[580px] min-h-[240px] sm:min-h-[360px] flex flex-col justify-center items-center overflow-hidden transition-all duration-300"
                }
                style={
                  !isFullscreen
                    ? {
                        backgroundColor: "#020b12",
                        borderColor: currentTheme.colors.borderMain,
                        boxShadow: `0 0 30px ${currentTheme.glowColor}, 0 12px 40px rgba(0,0,0,0.75)`
                      }
                    : undefined
                }
              >
                <div
                  className={`absolute inset-0 ${
                    isFullscreen ? "rounded-none" : "rounded-[14px] sm:rounded-[22px]"
                  } overflow-hidden flex flex-col justify-center items-center w-full h-full`}
                >
                  {/* Top-right Player Controls */}
                  {!isFullscreen && hasStarted && (
                    <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-sky-500/30 shadow-xl">
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="bg-black/90 hover:bg-emerald-500 hover:text-black border border-slate-700 text-white text-[10px] font-mono font-bold uppercase px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                        title="Alternar Tela Cheia Manualmente"
                      >
                        <Maximize className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Tela Cheia</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideoMuted((prev) => !prev)}
                        className="bg-black/90 hover:bg-sky-500 hover:text-black border border-slate-700 text-white text-[10px] font-mono font-bold uppercase px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                        title={videoMuted ? "Ativar Áudio" : "Silenciar Áudio"}
                      >
                        {videoMuted ? (
                          <VolumeX className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setHidePanels((prev) => !prev)}
                        className="bg-black/90 hover:bg-emerald-500 hover:text-black border border-slate-700 text-white text-[10px] font-mono font-bold uppercase px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                      >
                        {hidePanels ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                        <span className="hidden md:inline">{hidePanels ? "Ver Painel" : "Focar Vídeo"}</span>
                      </button>
                    </div>
                  )}

                  {/* WELCOME SCREEN BEFORE PRESENTATION STARTS */}
                  {!hasStarted ? (
                    <div className="absolute inset-0 bg-[#03121b]/95 flex flex-col items-center justify-center p-5 sm:p-8 text-center z-30 animate-fade-in">
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(circle at center, rgba(16,185,129,0.16) 0%, rgba(56,189,248,0.08) 45%, transparent 75%)"
                        }}
                      />

                      <div className="relative z-10 flex items-center gap-3 mb-4">
                        <div
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border-2 shadow-lg"
                          style={{
                            backgroundColor: currentTheme.colors.bgCard,
                            borderColor: currentTheme.colors.borderMain,
                            color: currentTheme.colors.primary,
                            boxShadow: `0 0 24px ${currentTheme.glowColor}`
                          }}
                        >
                          <Trees className="w-7 h-7 sm:w-9 sm:h-9" />
                        </div>
                      </div>

                      <div className="space-y-2.5 max-w-xl relative z-10">
                        <p className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest" style={{ color: currentTheme.colors.accent }}>
                          RENATO ROSA — ASSISTENTE VIRTUAL DAS FLORESTAS
                        </p>
                        <h2
                          className="font-display font-extrabold text-xl sm:text-3xl tracking-tight leading-tight"
                          style={{ color: currentTheme.colors.textPrimary, textWrap: "balance" as any }}
                        >
                          CONHECENDO AS FLORESTAS
                        </h2>
                        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: currentTheme.colors.textSecondary }}>
                          Clique em <strong>INICIAR APRESENTAÇÃO</strong> para assistir à introdução geral sobre as florestas e, em seguida, interaja por voz sobre a <strong>Floresta Amazônica</strong> e a <strong>Floresta Taiga</strong>.
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 relative z-10">
                        <button
                          type="button"
                          onClick={() => {
                            setVideoMuted(false);
                            triggerVideoSlot("intro");
                          }}
                          className="px-7 sm:px-9 py-3.5 sm:py-4 font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap hover:scale-105 active:scale-95 shadow-xl"
                          style={{
                            backgroundColor: currentTheme.colors.primary,
                            color: currentTheme.colors.primaryText,
                            borderColor: currentTheme.colors.borderMain,
                            boxShadow: `0 0 24px ${currentTheme.glowColor}`
                          }}
                        >
                          <Play className="w-5 h-5 fill-current shrink-0" />
                          <span>INICIAR APRESENTAÇÃO</span>
                        </button>

                        <button
                          type="button"
                          onClick={openForestQuiz}
                          className="px-5 sm:px-6 py-3.5 sm:py-4 font-display font-bold text-xs sm:text-sm uppercase tracking-wider rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap hover:scale-105 active:scale-95 shadow-lg"
                          style={{
                            backgroundColor: currentTheme.colors.bgCard,
                            color: currentTheme.colors.accent,
                            borderColor: currentTheme.colors.accent
                          }}
                        >
                          <Award className="w-4 h-4 shrink-0" />
                          <span>QUIZ — DESAFIO DAS FLORESTAS</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ACTIVE VIDEO PLAYER (YouTube FIT Contain, No Loop) */
                    <div className="absolute inset-0 bg-black flex items-center justify-center w-full h-full overflow-hidden">
                      {isYouTubeUrl(activeVideoUrl) ? (
                        <iframe
                          ref={ytIframeRef}
                          id="renato-rosa-yt-player"
                          key={`${activeVideoSlot}-${getYouTubeVideoId(activeVideoUrl)}-${ytReloadKey}`}
                          src={
                            videoFinished
                              ? "about:blank"
                              : `https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(
                                  activeVideoUrl
                                )}?autoplay=1&mute=${videoMuted ? 1 : 0}&enablejsapi=1&origin=${encodeURIComponent(
                                  typeof window !== "undefined" ? window.location.origin : ""
                                )}&playsinline=1&rel=0&modestbranding=1&controls=1&loop=0&vq=hd1080&hd=1&suggestedQuality=hd1080`
                          }
                          title={getActiveVideoTitle()}
                          onLoad={() => {
                            if (!videoFinishedRef.current) {
                              triggerQualityAutoPulse();
                              attachYtPlayer();
                            }
                          }}
                          className={`w-full h-full max-w-full max-h-full border-0 video-fit-contain transition-opacity duration-300 ${
                            videoFinished ? "opacity-0 pointer-events-none" : "opacity-100"
                          }`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          key={activeVideoSlot}
                          ref={videoRef}
                          src={activeVideoUrl}
                          className="w-full h-full video-fit-contain"
                          autoPlay
                          loop={false}
                          muted={videoMuted}
                          playsInline
                          onEnded={() => handleVideoEnded("html5_video_ended")}
                          onError={() => setVideoPlayError("Não foi possível reproduzir este vídeo.")}
                        />
                      )}

                      {/* POST-VIDEO INTERACTION RETURN OVERLAY */}
                      {videoFinished && (
                        <div className="absolute inset-0 bg-[#020d15]/92 backdrop-blur-md flex flex-col justify-center items-center p-4 sm:p-6 z-40 animate-fade-in overflow-y-auto">
                          <div
                            className="w-full max-w-2xl rounded-3xl p-5 sm:p-6 border-2 space-y-5 shadow-2xl"
                            style={{
                              backgroundColor: currentTheme.colors.bgSurface,
                              borderColor: currentTheme.colors.borderMain,
                              boxShadow: `0 0 30px ${currentTheme.glowColor}`
                            }}
                          >
                            <div className="text-center space-y-2">
                              <div className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: currentTheme.colors.accent }}>
                                Vídeo Concluído · Microfone Disponível
                              </div>
                              <h3 className="font-display font-extrabold text-lg sm:text-2xl" style={{ color: currentTheme.colors.textPrimary }}>
                                Qual floresta você deseja explorar agora?
                              </h3>
                              <p className="text-xs sm:text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                                Fale no microfone ou selecione diretamente um dos dois temas disponíveis:
                              </p>
                            </div>

                            {/* Speak Button */}
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={toggleListening}
                                className={`px-6 py-3 rounded-2xl border-2 font-mono text-xs sm:text-sm font-bold uppercase flex items-center gap-2.5 transition-all cursor-pointer shadow-lg ${
                                  isListening || isRecordingMedia ? "bg-red-600 text-white border-white" : ""
                                }`}
                                style={
                                  !(isListening || isRecordingMedia)
                                    ? {
                                        backgroundColor: currentTheme.colors.primary,
                                        color: currentTheme.colors.primaryText,
                                        borderColor: currentTheme.colors.borderMain
                                      }
                                    : undefined
                                }
                              >
                                {isListening || isRecordingMedia ? (
                                  <>
                                    <MicOff className="w-4 h-4 shrink-0" />
                                    <span>{isRecordingMedia ? `Ouvindo (${recordingDuration}s)...` : "Ouvindo... Fale agora"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Mic className="w-4 h-4 shrink-0" />
                                    <span>FALAR NO MICROFONE</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Exact 2 Triggers: Amazônia & Taiga */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {project.triggers.map((trig) => (
                                <button
                                  key={trig.id}
                                  type="button"
                                  onClick={() => triggerVideoSlot(trig.id)}
                                  className="p-4 rounded-2xl border-2 text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-between gap-3"
                                  style={{
                                    backgroundColor: currentTheme.colors.bgCard,
                                    borderColor: trig.themeKey === "amazonia" ? "#10b981" : "#38bdf8"
                                  }}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div
                                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                      style={{
                                        backgroundColor: trig.themeKey === "amazonia" ? "#10b981" : "#38bdf8",
                                        color: "#021610"
                                      }}
                                    >
                                      {trig.themeKey === "amazonia" ? (
                                        <Trees className="w-5 h-5" />
                                      ) : (
                                        <TreePine className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[11px] font-mono uppercase font-bold" style={{ color: currentTheme.colors.textMuted }}>
                                        {trig.title}
                                      </div>
                                      <div className="font-display font-bold text-sm truncate" style={{ color: currentTheme.colors.textPrimary }}>
                                        "{trig.phrase}"
                                      </div>
                                    </div>
                                  </div>
                                  <Play className="w-4 h-4 shrink-0" style={{ color: currentTheme.colors.primary }} />
                                </button>
                              ))}
                            </div>

                            {/* Secondary Footer Actions */}
                            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 border-t" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                              <button
                                type="button"
                                onClick={handleReplayVideo}
                                className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                                style={{
                                  backgroundColor: currentTheme.colors.bgCard,
                                  borderColor: currentTheme.colors.borderSubtle,
                                  color: currentTheme.colors.textSecondary
                                }}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Rever Vídeo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => triggerVideoSlot("intro")}
                                className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                                style={{
                                  backgroundColor: currentTheme.colors.bgCard,
                                  borderColor: currentTheme.colors.borderSubtle,
                                  color: currentTheme.colors.textSecondary
                                }}
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Conhecendo as Florestas</span>
                              </button>

                              <button
                                type="button"
                                onClick={openForestQuiz}
                                className="px-4 py-2 rounded-xl border text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                                style={{
                                  backgroundColor: currentTheme.colors.accent,
                                  borderColor: currentTheme.colors.accent,
                                  color: currentTheme.colors.accentText
                                }}
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>QUIZ — DESAFIO DAS FLORESTAS</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Active Video Title Indicator (Non-intrusive bottom bar while playing) */}
                      {!videoFinished && !isFullscreen && (
                        <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/30 text-[10px] font-mono text-white pointer-events-none">
                          <Radio className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold">{getActiveVideoTitle()}</span>
                          <span className="opacity-60">·</span>
                          <span className="text-sky-300">FIT · 1080p</span>
                        </div>
                      )}

                      {videoPlayError && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-5 text-center z-40">
                          <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
                          <p className="text-sm font-mono text-red-300">{videoPlayError}</p>
                          <button
                            type="button"
                            onClick={() => setVideoPlayError("")}
                            className="mt-3 px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold uppercase cursor-pointer"
                          >
                            Fechar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Fullscreen Exit Dock */}
                  {isFullscreen && (
                    <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20">
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="flex items-center gap-1.5 text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        <Minimize className="w-4 h-4" />
                        <span>Sair da Tela Cheia</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AVAILABLE VOICE TRIGGERS PANEL (EXACTLY 2 TRIGGERS: AMAZÔNIA & TAIGA) */}
            {!hidePanels && !isFullscreen && (
              <div
                className="backdrop-blur-md border-2 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-xl"
                style={{
                  backgroundColor: currentTheme.colors.bgSurface,
                  borderColor: currentTheme.colors.borderSubtle,
                  boxShadow: `0 0 24px ${currentTheme.glowColor}`
                }}
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3"
                  style={{ borderColor: currentTheme.colors.borderSubtle }}
                >
                  <div>
                    <h2
                      className="font-display font-bold text-sm sm:text-base uppercase tracking-wider"
                      style={{ color: currentTheme.colors.textPrimary }}
                    >
                      Temas Específicos & Gatilhos de Voz (2 Disponíveis)
                    </h2>
                    <p className="text-xs font-mono mt-0.5" style={{ color: currentTheme.colors.textMuted }}>
                      Fale no microfone ou clique em um tema para assistir ao vídeo correspondente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerVideoSlot("intro")}
                    className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:brightness-110 transition-all self-start sm:self-auto whitespace-nowrap"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      borderColor: currentTheme.colors.borderMain,
                      color: currentTheme.colors.primary
                    }}
                  >
                    <Play className="w-3.5 h-3.5 shrink-0" />
                    <span>Introdução: Conhecendo as Florestas</span>
                  </button>
                </div>

                {/* Grid of the EXACT 2 Triggers: Floresta Amazônica & Floresta Taiga */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.triggers.map((trig, idx) => {
                    const isActive = hasStarted && activeVideoSlot === trig.id && !videoFinished;
                    const isWatched = viewedSlots.includes(trig.id);
                    const themeColor = trig.themeKey === "amazonia" ? "#10b981" : "#38bdf8";

                    return (
                      <button
                        key={trig.id}
                        type="button"
                        onClick={() => triggerVideoSlot(trig.id)}
                        className={`group relative flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                          isActive ? "scale-[1.01]" : "hover:brightness-110 active:scale-[0.99]"
                        }`}
                        style={{
                          backgroundColor: isActive ? currentTheme.colors.bgElevated : currentTheme.colors.bgCard,
                          borderColor: isActive ? themeColor : currentTheme.colors.borderSubtle,
                          boxShadow: isActive ? `0 0 20px ${currentTheme.glowColor}` : undefined
                        }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: themeColor,
                              color: "#021610",
                              borderColor: themeColor
                            }}
                          >
                            {trig.themeKey === "amazonia" ? (
                              <Trees className="w-6 h-6" />
                            ) : (
                              <TreePine className="w-6 h-6" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase" style={{ color: themeColor }}>
                              <span>Gatilho {idx + 1} · {trig.title}</span>
                              {isWatched && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-300">Assistido</span>
                                </>
                              )}
                            </div>
                            <div className="font-display font-bold text-base sm:text-lg truncate" style={{ color: currentTheme.colors.textPrimary }}>
                              "{trig.phrase}"
                            </div>
                            <p className="text-xs line-clamp-1" style={{ color: currentTheme.colors.textMuted }}>
                              {trig.description}
                            </p>
                          </div>
                        </div>

                        <span
                          className="shrink-0 text-xs font-mono font-bold uppercase px-3 py-2 rounded-xl border flex items-center gap-1.5 whitespace-nowrap"
                          style={{
                            backgroundColor: currentTheme.colors.bgApp,
                            borderColor: themeColor,
                            color: themeColor
                          }}
                        >
                          <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                          <span>Assistir</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ASSISTANT INTERACTION DECK (MICROPHONE + VOICE TRANSCRIPTION + MANUAL COMMAND) */}
            {!hidePanels && !isFullscreen && (
              <div
                className="backdrop-blur-md border-2 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row gap-6 items-stretch shadow-xl"
                style={{
                  backgroundColor: currentTheme.colors.bgSurface,
                  borderColor: currentTheme.colors.borderSubtle,
                  boxShadow: `0 0 24px ${currentTheme.glowColor}`
                }}
              >
                {/* Microphone Control Box */}
                <div
                  className="border rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-4 min-w-[230px] shrink-0"
                  style={{
                    backgroundColor: currentTheme.colors.bgCard,
                    borderColor: currentTheme.colors.borderSubtle
                  }}
                >
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 cursor-pointer shadow-lg ${
                      isListening || isRecordingMedia
                        ? "bg-red-600 text-white border-white"
                        : "hover:scale-105 active:scale-95"
                    }`}
                    style={
                      !(isListening || isRecordingMedia)
                        ? {
                            backgroundColor: currentTheme.colors.primary,
                            color: currentTheme.colors.primaryText,
                            borderColor: currentTheme.colors.borderMain,
                            boxShadow: `0 0 20px ${currentTheme.glowColor}`
                          }
                        : undefined
                    }
                    title={isListening || isRecordingMedia ? "Parar escuta" : "Ativar microfone"}
                  >
                    {isListening || isRecordingMedia ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>

                  <div className="space-y-1.5 w-full">
                    {isTranscribing ? (
                      <div className="flex flex-col items-center gap-1 py-1">
                        <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                        <span className="text-xs font-mono font-bold text-sky-300">Transcrevendo fala...</span>
                      </div>
                    ) : isListening || isRecordingMedia ? (
                      <div className="space-y-2">
                        <span className="text-xs font-mono font-bold text-red-400 uppercase block">
                          {isRecordingMedia ? `Gravando (${recordingDuration}s)` : "Escuta Ativa..."}
                        </span>
                        <div className="flex items-end justify-center gap-1.5 h-6">
                          {[0.25, 0.45, 0.35, 0.2].map((factor, i) => (
                            <div
                              key={i}
                              className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75"
                              style={{ height: `${Math.max(6, Math.min(24, Math.round(audioLevel * factor + 4)))}px` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : isAnalyzing ? (
                      <span className="text-xs font-mono font-bold text-sky-300">Identificando comando...</span>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-xs font-bold block" style={{ color: currentTheme.colors.textPrimary }}>
                          Reconhecimento de Voz
                        </span>
                        <span
                          className="text-[11px] font-mono block"
                          style={{
                            color:
                              micPermission === "granted"
                                ? "#34d399"
                                : micPermission === "denied"
                                ? "#f87171"
                                : currentTheme.colors.textMuted
                          }}
                        >
                          {micPermission === "granted"
                            ? "Microfone Pronto"
                            : micPermission === "denied"
                            ? "Microfone Bloqueado"
                            : "Clique para Falar"}
                        </span>
                      </div>
                    )}
                  </div>

                  {speechError && (
                    <div className="w-full p-2.5 bg-red-950/60 border border-red-800 rounded-xl text-[11px] text-red-200 font-mono space-y-1.5">
                      <p>{speechError}</p>
                      <button
                        type="button"
                        onClick={requestMicrophonePermission}
                        className="w-full py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[10px] uppercase cursor-pointer"
                      >
                        Habilitar Microfone
                      </button>
                    </div>
                  )}
                </div>

                {/* Transcript, Assistant Status & Manual Input */}
                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div
                    className="border rounded-2xl p-4 sm:p-5 flex-1 flex flex-col justify-center gap-2"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      borderColor: currentTheme.colors.borderSubtle
                    }}
                  >
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider block" style={{ color: currentTheme.colors.textMuted }}>
                        {isListening ? "Transcrição em Tempo Real" : "Último Comando"}
                      </span>
                      <p className="font-display font-bold text-sm sm:text-base mt-1" style={{ color: currentTheme.colors.textPrimary }}>
                        {isListening
                          ? realtimeSpeech
                            ? `"${realtimeSpeech}"`
                            : "Ouvindo... fale sobre a Amazônia ou sobre a Taiga."
                          : lastSpeechDetected
                          ? `"${lastSpeechDetected}"`
                          : aiResponseText}
                      </p>
                    </div>
                    {lastSpeechDetected && !isListening && (
                      <p className="text-xs font-mono" style={{ color: currentTheme.colors.accent }}>
                        {aiResponseText}
                      </p>
                    )}
                  </div>

                  {/* Quick Voice Commands */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono" style={{ color: currentTheme.colors.textMuted }}>
                      Comandos rápidos:
                    </span>
                    {project.triggers.map((trig) => (
                      <button
                        key={trig.id}
                        type="button"
                        onClick={() => handleIncomingCommand(trig.phrase)}
                        className="px-3 py-1.5 border text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer hover:brightness-125"
                        style={{
                          backgroundColor: currentTheme.colors.chipBg,
                          borderColor: currentTheme.colors.borderSubtle,
                          color: currentTheme.colors.textSecondary
                        }}
                      >
                        "{trig.phrase}"
                      </button>
                    ))}
                  </div>

                  {/* Text Input Backup */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleIncomingCommand(inputText);
                    }}
                    className="relative"
                  >
                    <input
                      type="text"
                      className="w-full border-2 rounded-xl pl-4 pr-12 py-3 text-xs sm:text-sm font-mono focus:outline-none transition-all"
                      style={{
                        backgroundColor: currentTheme.colors.bgInput,
                        borderColor: currentTheme.colors.borderSubtle,
                        color: currentTheme.colors.textPrimary
                      }}
                      placeholder='Digite um comando (ex: "Me fale sobre a Amazônia" ou "Me fale sobre a Taiga")...'
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isAnalyzing}
                    />
                    <button
                      type="submit"
                      disabled={isAnalyzing || !inputText.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer disabled:opacity-40 transition-all"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: currentTheme.colors.primaryText,
                        borderColor: currentTheme.colors.borderMain
                      }}
                      aria-label="Enviar comando"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Bottom Action Bar */}
            {!hidePanels && !isFullscreen && (
              <div
                className="backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between border gap-4"
                style={{
                  backgroundColor: currentTheme.colors.bgSurface,
                  borderColor: currentTheme.colors.borderSubtle
                }}
              >
                <div className="flex items-center gap-2.5 text-xs font-mono" style={{ color: currentTheme.colors.textSecondary }}>
                  <Leaf className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>RENATO ROSA — Assistente Virtual das Florestas · Florestas, Amazônia e Taiga</span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={openForestQuiz}
                    className="rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 uppercase border"
                    style={{
                      backgroundColor: currentTheme.colors.accent,
                      color: currentTheme.colors.accentText,
                      borderColor: currentTheme.colors.accent
                    }}
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>QUIZ — DESAFIO DAS FLORESTAS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className="rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 uppercase border"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      color: currentTheme.colors.textPrimary,
                      borderColor: currentTheme.colors.borderSubtle
                    }}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span>Configurações</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: QUIZ — DESAFIO DAS FLORESTAS */}
        {activeTab === "quiz" && (
          <ForestQuiz
            colors={currentTheme.colors}
            glowColor={currentTheme.glowColor}
            onBackToPresentation={() => setActiveTab("chat")}
          />
        )}

        {/* VIEW 3: SETTINGS (Exclusively Renato Rosa Project Config) */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto w-full">
            <div
              className="border-2 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl"
              style={{
                backgroundColor: currentTheme.colors.bgSurface,
                borderColor: currentTheme.colors.borderSubtle
              }}
            >
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4"
                style={{ borderColor: currentTheme.colors.borderSubtle }}
              >
                <div>
                  <h2 className="text-lg font-display font-bold" style={{ color: currentTheme.colors.textPrimary }}>
                    Configuração Exclusiva — Projeto Renato Rosa
                  </h2>
                  <p className="text-xs font-mono mt-0.5" style={{ color: currentTheme.colors.textMuted }}>
                    Introdução Geral (Conhecendo as Florestas), Gatilhos (Amazônia e Taiga), Visual e Microfone.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border cursor-pointer font-mono uppercase"
                    style={{
                      backgroundColor: currentTheme.colors.bgCard,
                      color: currentTheme.colors.textPrimary,
                      borderColor: currentTheme.colors.borderSubtle
                    }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("chat")}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border cursor-pointer font-mono uppercase"
                    style={{
                      backgroundColor: currentTheme.colors.primary,
                      color: currentTheme.colors.primaryText,
                      borderColor: currentTheme.colors.borderMain
                    }}
                  >
                    <span>Voltar ao Player</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Intro Video + Visual + Mic */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Intro Config (Read-only fixed URL) */}
                  <div
                    className="rounded-2xl p-4 border space-y-3"
                    style={{ backgroundColor: currentTheme.colors.bgCard, borderColor: currentTheme.colors.borderSubtle }}
                  >
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                      <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: currentTheme.colors.textPrimary }}>
                        <Video className="w-4 h-4 text-emerald-400" />
                        Introdução: {project.intro.title}
                      </span>
                      <Lock className="w-3.5 h-3.5" style={{ color: currentTheme.colors.accent }} />
                    </div>
                    <p className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>
                      {project.intro.description}
                    </p>
                    <input
                      type="text"
                      value={project.intro.videoUrl}
                      readOnly
                      className="w-full rounded-lg px-3 py-2 text-xs font-mono border cursor-not-allowed select-all"
                      style={{
                        backgroundColor: currentTheme.colors.bgInput,
                        borderColor: currentTheme.colors.borderSubtle,
                        color: currentTheme.colors.textMuted
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        triggerVideoSlot("intro");
                        setActiveTab("chat");
                      }}
                      className="w-full py-2 px-3 rounded-xl font-mono text-xs font-bold uppercase border cursor-pointer hover:brightness-110"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: currentTheme.colors.primaryText,
                        borderColor: currentTheme.colors.borderMain
                      }}
                    >
                      Reproduzir Introdução
                    </button>
                  </div>

                  {/* Theme Visual Preview (Only Florestas, Amazônia, Taiga) */}
                  <div
                    className="rounded-2xl p-4 border space-y-3"
                    style={{ backgroundColor: currentTheme.colors.bgCard, borderColor: currentTheme.colors.borderSubtle }}
                  >
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                      <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: currentTheme.colors.textPrimary }}>
                        <ImageIcon className="w-4 h-4 text-sky-400" />
                        Cenário Visual do Centro de Monitoramento
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {THEME_LIST.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedThemeId(t.id)}
                          className="p-2 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 cursor-pointer transition-all"
                          style={{
                            backgroundColor: selectedThemeId === t.id ? t.colors.primary : currentTheme.colors.bgInput,
                            color: selectedThemeId === t.id ? t.colors.primaryText : currentTheme.colors.textSecondary,
                            borderColor: selectedThemeId === t.id ? t.colors.borderMain : currentTheme.colors.borderSubtle
                          }}
                        >
                          {renderThemeIcon(t.iconName, "w-4 h-4")}
                          <span className="truncate w-full text-center text-[11px]">{t.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono" style={{ color: currentTheme.colors.textMuted }}>
                        <span>Opacidade do Cenário:</span>
                        <span>{bgOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        step="5"
                        value={bgOpacity}
                        onChange={(e) => setBgOpacity(Number(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBgImage((p) => !p)}
                        className="w-full py-2 rounded-xl border text-xs font-mono font-bold uppercase cursor-pointer"
                        style={{
                          backgroundColor: currentTheme.colors.bgInput,
                          borderColor: currentTheme.colors.borderSubtle,
                          color: currentTheme.colors.textPrimary
                        }}
                      >
                        {showBgImage ? "Ocultar Imagem de Fundo" : "Ativar Imagem de Fundo"}
                      </button>
                    </div>
                  </div>

                  {/* Video Quality & FIT Info */}
                  <div
                    className="rounded-2xl p-4 border space-y-3"
                    style={{ backgroundColor: currentTheme.colors.bgCard, borderColor: currentTheme.colors.borderSubtle }}
                  >
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                      <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: currentTheme.colors.textPrimary }}>
                        <Sliders className="w-4 h-4 text-emerald-400" />
                        Reprodução & Enquadramento (FIT)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300">FIT · SEM LOOP</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: currentTheme.colors.textSecondary }}>
                      Vídeos padronizados para reproduzir uma vez por ativação (sem loop), sem tela cheia automática e ajustados em modo <strong>FIT (contain)</strong> sem cortes.
                    </p>
                    <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ backgroundColor: currentTheme.colors.bgInput, borderColor: currentTheme.colors.borderSubtle }}>
                      <span className="text-xs font-mono" style={{ color: currentTheme.colors.textPrimary }}>
                        Travar em 1080p Full HD
                      </span>
                      <button
                        type="button"
                        onClick={() => setForce1080pOnly((p) => !p)}
                        className="px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer"
                        style={{
                          backgroundColor: force1080pOnly ? currentTheme.colors.primary : currentTheme.colors.bgCard,
                          color: force1080pOnly ? currentTheme.colors.primaryText : currentTheme.colors.textMuted
                        }}
                      >
                        {force1080pOnly ? "Ativo" : "Inativo"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Exact 2 Fixed Triggers + Mic Diagnostics */}
                <div className="lg:col-span-7 space-y-5">
                  <div
                    className="rounded-2xl p-5 border space-y-4"
                    style={{ backgroundColor: currentTheme.colors.bgCard, borderColor: currentTheme.colors.borderSubtle }}
                  >
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                      <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: currentTheme.colors.textPrimary }}>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Gatilhos Cadastrados ({project.triggers.length} Fixos)
                      </span>
                      <span className="text-[11px] font-mono" style={{ color: currentTheme.colors.accent }}>
                        Projeto Renato Rosa
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {project.triggers.map((trig, idx) => (
                        <div
                          key={trig.id}
                          className="rounded-2xl p-4 border space-y-3"
                          style={{ backgroundColor: currentTheme.colors.bgInput, borderColor: currentTheme.colors.borderSubtle }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold" style={{ color: trig.themeKey === "amazonia" ? "#10b981" : "#38bdf8" }}>
                              Gatilho {idx + 1} · {trig.title}
                            </span>
                            <Lock className="w-3 h-3" style={{ color: currentTheme.colors.textMuted }} />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono uppercase" style={{ color: currentTheme.colors.textMuted }}>
                              Comando de Voz:
                            </span>
                            <input
                              type="text"
                              value={trig.phrase}
                              readOnly
                              className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold border cursor-not-allowed"
                              style={{
                                backgroundColor: currentTheme.colors.bgCard,
                                borderColor: currentTheme.colors.borderSubtle,
                                color: currentTheme.colors.textPrimary
                              }}
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono uppercase" style={{ color: currentTheme.colors.textMuted }}>
                              URL do Vídeo:
                            </span>
                            <input
                              type="text"
                              value={trig.videoUrl}
                              readOnly
                              className="w-full rounded-lg px-2.5 py-1.5 text-[11px] font-mono border cursor-not-allowed select-all"
                              style={{
                                backgroundColor: currentTheme.colors.bgCard,
                                borderColor: currentTheme.colors.borderSubtle,
                                color: currentTheme.colors.textMuted
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              triggerVideoSlot(trig.id);
                              setActiveTab("chat");
                            }}
                            className="w-full py-2 rounded-xl font-mono text-xs font-bold uppercase border cursor-pointer hover:brightness-110"
                            style={{
                              backgroundColor: currentTheme.colors.bgCard,
                              borderColor: currentTheme.colors.borderMain,
                              color: currentTheme.colors.primary
                            }}
                          >
                            Testar no Player
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Microphone Diagnostics */}
                  <div
                    className="rounded-2xl p-5 border space-y-3"
                    style={{ backgroundColor: currentTheme.colors.bgCard, borderColor: currentTheme.colors.borderSubtle }}
                  >
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: currentTheme.colors.borderSubtle }}>
                      <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: currentTheme.colors.textPrimary }}>
                        <Mic className="w-4 h-4 text-emerald-400" />
                        Configuração e Teste do Microfone
                      </span>
                      <span className="text-xs font-mono" style={{ color: currentTheme.colors.accent }}>
                        {micPermission === "granted" ? "LIBERADO" : micPermission === "denied" ? "BLOQUEADO" : "PENDENTE"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "auto", label: "Automático" },
                        { id: "gemini", label: "IA Áudio" },
                        { id: "native", label: "Web Speech" }
                      ].map((eng) => (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() => setPreferredSpeechEngine(eng.id as any)}
                          className="py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer"
                          style={{
                            backgroundColor:
                              preferredSpeechEngine === eng.id ? currentTheme.colors.primary : currentTheme.colors.bgInput,
                            color:
                              preferredSpeechEngine === eng.id ? currentTheme.colors.primaryText : currentTheme.colors.textSecondary,
                            borderColor:
                              preferredSpeechEngine === eng.id ? currentTheme.colors.borderMain : currentTheme.colors.borderSubtle
                          }}
                        >
                          {eng.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={requestMicrophonePermission}
                      className="w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase border cursor-pointer hover:brightness-110"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: currentTheme.colors.primaryText,
                        borderColor: currentTheme.colors.borderMain
                      }}
                    >
                      {micPermission === "granted" ? "Testar Permissão do Microfone" : "Autorizar Microfone"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clean Footer */}
      {!hidePanels && !isFullscreen && (
        <footer
          className="mt-auto py-5 border-t backdrop-blur-sm relative z-10"
          style={{
            backgroundColor: currentTheme.colors.bgSurface,
            borderColor: currentTheme.colors.borderSubtle
          }}
        >
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-xs font-mono gap-2" style={{ color: currentTheme.colors.textMuted }}>
            <span>RENATO ROSA — ASSISTENTE VIRTUAL DAS FLORESTAS</span>
            <span>Florestas · Floresta Amazônica · Floresta Taiga</span>
          </div>
        </footer>
      )}

      {/* Hidden-Panel Floating Dock (when user toggles "Focar Vídeo") */}
      {hidePanels && !isFullscreen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50 animate-fade-in">
          <div
            className="backdrop-blur-md border-2 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2.5"
            style={{
              backgroundColor: currentTheme.colors.bgSurface,
              borderColor: currentTheme.colors.borderMain
            }}
          >
            <button
              type="button"
              onClick={toggleListening}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase cursor-pointer border"
              style={{
                backgroundColor: isListening || isRecordingMedia ? "#dc2626" : currentTheme.colors.primary,
                color: isListening || isRecordingMedia ? "#ffffff" : currentTheme.colors.primaryText,
                borderColor: currentTheme.colors.borderMain
              }}
            >
              {isListening || isRecordingMedia ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isListening || isRecordingMedia ? "Ouvindo..." : "Falar"}</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              {project.triggers.map((trig) => (
                <button
                  key={trig.id}
                  type="button"
                  onClick={() => triggerVideoSlot(trig.id)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold cursor-pointer"
                  style={{
                    backgroundColor: currentTheme.colors.bgCard,
                    borderColor: currentTheme.colors.borderSubtle,
                    color: currentTheme.colors.textSecondary
                  }}
                >
                  {trig.title}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setHidePanels(false)}
                className="px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase cursor-pointer"
                style={{
                  backgroundColor: currentTheme.colors.accent,
                  color: currentTheme.colors.accentText,
                  borderColor: currentTheme.colors.accent
                }}
              >
                Ver Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Permission Guide Modal */}
      {showMicModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="border-2 rounded-3xl w-full max-w-lg p-6 flex flex-col gap-4 shadow-2xl"
            style={{
              backgroundColor: currentTheme.colors.bgSurface,
              borderColor: currentTheme.colors.borderMain,
              color: currentTheme.colors.textPrimary
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: currentTheme.colors.borderSubtle }}>
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                  Como Habilitar o Microfone
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMicModal(false)}
                className="p-1 text-xs font-mono font-bold cursor-pointer"
                style={{ color: currentTheme.colors.textMuted }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono" style={{ color: currentTheme.colors.textSecondary }}>
              <p>Para utilizar os comandos de voz sobre a Amazônia e a Taiga, autorize o acesso ao microfone no navegador:</p>
              <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: currentTheme.colors.bgCard, borderColor: currentTheme.colors.borderSubtle }}>
                <span className="font-bold flex items-center gap-1.5" style={{ color: currentTheme.colors.textPrimary }}>
                  <Smartphone className="w-3.5 h-3.5" />
                  Navegador Desktop ou Android (Chrome):
                </span>
                <p>Toque no ícone de cadeado / configurações ao lado da URL e marque Microfone como Permitir.</p>
              </div>
              <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: currentTheme.colors.bgCard, borderColor: currentTheme.colors.borderSubtle }}>
                <span className="font-bold flex items-center gap-1.5" style={{ color: currentTheme.colors.textPrimary }}>
                  <Smartphone className="w-3.5 h-3.5" />
                  iPhone / iPad (Safari):
                </span>
                <p>Toque em aA na barra de endereços, selecione Ajustes do Site e libere o Microfone.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t" style={{ borderColor: currentTheme.colors.borderSubtle }}>
              <button
                type="button"
                onClick={() => setShowMicModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-mono font-bold uppercase cursor-pointer"
                style={{
                  backgroundColor: currentTheme.colors.bgCard,
                  borderColor: currentTheme.colors.borderSubtle,
                  color: currentTheme.colors.textSecondary
                }}
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await requestMicrophonePermission();
                  if (ok) {
                    setShowMicModal(false);
                    setSpeechError("");
                  }
                }}
                className="px-4 py-2 rounded-xl border text-xs font-mono font-bold uppercase cursor-pointer"
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  color: currentTheme.colors.primaryText,
                  borderColor: currentTheme.colors.borderMain
                }}
              >
                Autorizar Microfone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forest Monitoring Center Modal */}
      <SmartEcosystemModal
        isOpen={showEcosystemModal}
        onClose={() => setShowEcosystemModal(false)}
        theme={currentTheme}
        onSelectTheme={(id) => setSelectedThemeId(id)}
        onOpenSettings={() => setActiveTab("settings")}
      />
    </div>
  );
}
