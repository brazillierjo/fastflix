"use client";

import { useCallback, useRef } from "react";
import type { SlideConfig, DeviceType } from "@/lib/types";
import { gradientPresets } from "@/lib/gradients";
import { getDimensions } from "@/lib/constants";
import { Images, Plus, Trash2 } from "lucide-react";
import { SlideForm } from "./SlideForm";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface SidebarProps {
  slides: SlideConfig[];
  activeIndex: number;
  deviceType: DeviceType;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onRemoveSlide: (index: number) => void;
  onUpdateSlide: (index: number, updates: Partial<SlideConfig>) => void;
  onBulkAdd: (files: { file: File; dataUrl: string }[]) => void;
}

export function Sidebar({
  slides,
  activeIndex,
  deviceType,
  onSelectSlide,
  onAddSlide,
  onRemoveSlide,
  onUpdateSlide,
  onBulkAdd,
}: SidebarProps) {
  const activeSlide = slides[activeIndex];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dims = getDimensions(deviceType);

  const handleBulkUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;
      const results = await Promise.all(
        files.map(async (file) => ({
          file,
          dataUrl: await readFileAsDataUrl(file),
        })),
      );
      onBulkAdd(results);
      // Reset input so same files can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onBulkAdd],
  );

  return (
    <div className="border-border bg-surface flex h-full w-96 flex-col border-r">
      {/* Upload Images button */}
      <div className="border-border border-b p-3">
        <label className="bg-primary hover:bg-primary-dark flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors">
          <Images size={18} />
          Upload Images
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleBulkUpload}
          />
        </label>
        <p className="text-text-muted mt-1.5 text-center text-[11px]">
          Select multiple images to create one slide per screenshot
        </p>
      </div>

      {/* Slide Thumbnails */}
      <div className="border-border border-b p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-text-muted text-xs font-semibold tracking-wider uppercase">
            Slides ({slides.length})
          </span>
          <button
            onClick={onAddSlide}
            className="text-text-muted hover:bg-surface-secondary hover:text-text rounded-md p-1 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slides.map((slide, i) => {
            const preset = gradientPresets.find((p) => p.id === slide.gradientPresetId);
            const thumbBg =
              slide.backgroundType === "solid" ? slide.backgroundColor : preset?.css || "#1a1a1a";
            return (
              <div
                key={slide.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectSlide(i)}
                onKeyDown={(e) => e.key === "Enter" && onSelectSlide(i)}
                className={`group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                  i === activeIndex
                    ? "border-primary ring-primary/20 ring-2"
                    : "border-border hover:border-text-muted"
                }`}
                style={{
                  width: 48,
                  height: 48 * (dims.height / dims.width),
                  background: thumbBg,
                }}
              >
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white drop-shadow">
                  {i + 1}
                </span>
                {slides.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSlide(i);
                    }}
                    className="absolute -top-1.5 -right-1.5 hidden rounded-full bg-red-500 p-0.5 text-white shadow group-hover:block"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide Configuration */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSlide && (
          <SlideForm
            slide={activeSlide}
            onChange={(updates) => onUpdateSlide(activeIndex, updates)}
          />
        )}
      </div>
    </div>
  );
}
