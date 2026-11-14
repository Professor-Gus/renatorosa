import React, { useState } from "react";
import {
  X,
  Cpu,
  Activity,
  Feather,
  Sliders,
  Trees,
  TreePine,
  Globe,
  Satellite
} from "lucide-react";
import { THEMES, THEME_LIST, ThemeDefinition, ThemeId } from "../themes";

interface SmartEcosystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeDefinition;
  onSelectTheme?: (themeId: ThemeId) => void;
  onOpenSettings: () => void;
}

export const SmartEcosystemModal: React.FC<SmartEcosystemModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  onOpenSettings
}) => {
  const [inspectThemeId, setInspectThemeId] = useState<ThemeId>(theme.id);

  if (!isOpen) return null;

  const activeTheme = THEMES[inspectThemeId] || theme;

  const renderIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case "Trees":
        return <Trees className={className} />;
      case "TreePine":
        return <TreePine className={className} />;
      case "Globe":
      default:
        return <Globe className={className} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ecosystem-title"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 flex flex-col shadow-2xl relative transition-all duration-300"
        style={{
          backgroundColor: activeTheme.colors.bgSurface,
          borderColor: activeTheme.colors.borderMain,
          boxShadow: `0 0 35px ${activeTheme.glowColor}`
        }}
      >
        {/* Header with Forest Monitoring Banner */}
        <div
          className="relative h-44 sm:h-52 overflow-hidden rounded-t-[22px] border-b"
          style={{ borderColor: activeTheme.colors.borderSubtle }}
        >
          <img
            src={activeTheme.bgImage}
            alt={activeTheme.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
            aria-label="Fechar painel de monitoramento"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner Title & Metadata */}
          <div className="absolute bottom-3 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-300 mb-1">
                <span>RENATO ROSA</span>
                <span aria-hidden="true">·</span>
                <span>{activeTheme.biome}</span>
              </div>
              <h2
                id="ecosystem-title"
                className="text-xl sm:text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2"
              >
                {renderIcon(activeTheme.iconName, "w-6 h-6 text-emerald-400")}
                <span>
                  {activeTheme.name} — {activeTheme.environmentTitle}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-sky-300 bg-black/75 px-2.5 py-1 rounded-lg border border-sky-500/30 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                5 Sensores IoT · 5 Espécies
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Interactive Theme Switcher: ONLY the 3 allowed themes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-black/30" style={{ borderColor: activeTheme.colors.borderSubtle }}>
              {THEME_LIST.map((t) => {
                const isSelected = t.id === inspectThemeId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setInspectThemeId(t.id);
                      onSelectTheme?.(t.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected ? "shadow-sm" : "opacity-75 hover:opacity-100"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: t.colors.primary,
                            color: t.colors.primaryText
                          }
                        : {
                            color: activeTheme.colors.textSecondary
                          }
                    }
                  >
                    {renderIcon(t.iconName, "w-3.5 h-3.5")}
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="text-xs font-mono font-bold hover:underline flex items-center gap-1 cursor-pointer self-end sm:self-auto"
              style={{ color: activeTheme.colors.accent }}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Abrir Configurações</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: activeTheme.colors.textSecondary }}>
            {activeTheme.description}
          </p>

          {/* Section 1: Sensores, Drones & Satélites */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: activeTheme.colors.borderSubtle }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: activeTheme.colors.primary, color: activeTheme.colors.primaryText }}
                >
                  <Satellite className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider" style={{ color: activeTheme.colors.textPrimary }}>
                  Sensores, Drones e Monitoramento Ambiental
                </h3>
              </div>
              <span className="text-[11px] font-mono" style={{ color: activeTheme.colors.textMuted }}>
                5 Unidades Conectadas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activeTheme.smartDevices.map((device, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all"
                  style={{
                    backgroundColor: activeTheme.colors.bgCard,
                    borderColor: activeTheme.colors.borderSubtle
                  }}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-xs font-bold leading-tight" style={{ color: activeTheme.colors.textPrimary }}>
                      {device.name}
                    </span>
                    <Cpu className="w-3.5 h-3.5 shrink-0" style={{ color: activeTheme.colors.accent }} />
                  </div>

                  <div className="text-[10px] font-mono" style={{ color: activeTheme.colors.textMuted }}>
                    {device.type}
                  </div>

                  <div
                    className="mt-1 pt-1.5 border-t text-[10px] font-mono flex items-center justify-between gap-1"
                    style={{ borderColor: activeTheme.colors.borderSubtle }}
                  >
                    <span style={{ color: activeTheme.colors.textMuted }}>Leitura:</span>
                    <span className="font-bold text-right" style={{ color: activeTheme.colors.accent }}>
                      {device.telemetry}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Fauna Monitorada */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: activeTheme.colors.borderSubtle }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: activeTheme.colors.accent, color: activeTheme.colors.accentText }}
                >
                  <Feather className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider" style={{ color: activeTheme.colors.textPrimary }}>
                  Fauna Característica Monitorada
                </h3>
              </div>
              <span className="text-[11px] font-mono" style={{ color: activeTheme.colors.textMuted }}>
                5 Espécies Catalogadas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activeTheme.animals.map((animal, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border flex flex-col justify-between gap-1.5 transition-all"
                  style={{
                    backgroundColor: activeTheme.colors.bgCard,
                    borderColor: activeTheme.colors.borderSubtle
                  }}
                >
                  <div>
                    <div className="text-xs font-bold" style={{ color: activeTheme.colors.textPrimary }}>
                      {animal.name}
                    </div>
                    <div className="text-[10px] italic" style={{ color: activeTheme.colors.textMuted }}>
                      {animal.scientificName} · {animal.category}
                    </div>
                  </div>

                  <div
                    className="mt-1 pt-1.5 border-t text-[10px] font-mono flex items-center justify-between gap-1"
                    style={{ borderColor: activeTheme.colors.borderSubtle }}
                  >
                    <span style={{ color: activeTheme.colors.textMuted }}>Status:</span>
                    <span className="font-semibold" style={{ color: activeTheme.colors.textSecondary }}>
                      {animal.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-mono font-bold text-xs uppercase cursor-pointer border transition-transform hover:scale-105 active:scale-95"
              style={{
                backgroundColor: activeTheme.colors.primary,
                color: activeTheme.colors.primaryText,
                borderColor: activeTheme.colors.borderMain
              }}
            >
              Fechar Monitoramento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
