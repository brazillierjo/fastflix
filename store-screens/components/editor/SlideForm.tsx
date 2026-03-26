"use client";

import { gradientPresets } from "@/lib/gradients";
import type { SlideConfig } from "@/lib/types";
import { Upload } from "lucide-react";
import { useCallback } from "react";

const SOLID_COLOR_PRESETS = [
  "#895af6", // Mio purple
  "#6d28d9", // Deep purple
  "#3A75E2", // Practice blue
  "#1e40af", // Deep blue
  "#34C759", // Roleplay green
  "#16a34a", // Forest green
  "#FF9843", // Streak orange
  "#ea580c", // Deep orange
  "#ef4444", // Red
  "#ec4899", // Pink
];

interface SlideFormProps {
  slide: SlideConfig;
  onChange: (updates: Partial<SlideConfig>) => void;
}

export function SlideForm({ slide, onChange }: SlideFormProps) {
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onChange({
          screenshotFile: file,
          screenshotDataUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Screenshot Upload */}
      <div>
        <label className="text-text-muted mb-1.5 block text-sm font-medium">Screenshot</label>
        <label className="border-border bg-surface hover:bg-surface-secondary flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors">
          <Upload size={16} className="text-text-muted" />
          <span className="text-text-muted">
            {slide.screenshotFile
              ? slide.screenshotFile.name
              : slide.screenshotDataUrl
                ? slide.screenshotDataUrl.split("/").pop()
                : "Upload screenshot..."}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Title */}
      <div>
        <label className="text-text-muted mb-1.5 block text-sm font-medium">Title</label>
        <input
          type="text"
          value={slide.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Speak with Confidence"
          className="border-border bg-surface focus:border-primary w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="text-text-muted mb-1.5 block text-sm font-medium">Subtitle</label>
        <input
          type="text"
          value={slide.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Become fluent stress-free with AI."
          className="border-border bg-surface focus:border-primary w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none"
        />
      </div>

      {/* Text Position */}
      <div>
        <label className="text-text-muted mb-1.5 block text-sm font-medium">Text Position</label>
        <div className="flex gap-2">
          {(["top", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => onChange({ textPosition: pos })}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                slide.textPosition === pos
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-muted hover:bg-surface-secondary"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Background Type */}
      <div>
        <label className="text-text-muted mb-1.5 block text-sm font-medium">Background</label>
        <div className="mb-3 flex gap-2">
          {(["solid", "gradient"] as const).map((type) => (
            <button
              key={type}
              onClick={() => onChange({ backgroundType: type })}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                slide.backgroundType === type
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-muted hover:bg-surface-secondary"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {slide.backgroundType === "solid" ? (
          <div>
            <div className="mb-2 grid grid-cols-5 gap-2">
              {SOLID_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => onChange({ backgroundColor: color })}
                  className={`aspect-square rounded-lg border-2 transition-all ${
                    slide.backgroundColor === color
                      ? "border-primary ring-primary/30 ring-2"
                      : "hover:border-border border-transparent"
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={slide.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="border-border h-8 w-8 cursor-pointer rounded border"
              />
              <input
                type="text"
                value={slide.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="border-border bg-surface focus:border-primary flex-1 rounded-lg border px-3 py-1.5 font-mono text-xs outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {gradientPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onChange({ gradientPresetId: preset.id })}
                title={preset.name}
                className={`aspect-square rounded-lg border-2 transition-all ${
                  slide.gradientPresetId === preset.id
                    ? "border-primary ring-primary/30 ring-2"
                    : "hover:border-border border-transparent"
                }`}
                style={{ background: preset.css }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
