"use client";

import { useRef, useCallback, useState } from "react";
import {
  getDimensions,
  MOBILE_WIDTH,
  MOBILE_HEIGHT,
  TABLET_WIDTH,
  TABLET_HEIGHT,
} from "@/lib/constants";
import type { SlideConfig, DeviceType } from "@/lib/types";
import { ScreenshotSlide } from "@/components/screenshot/ScreenshotSlide";

interface PreviewAreaProps {
  slides: SlideConfig[];
  activeIndex: number;
  deviceType: DeviceType;
  onSelectSlide: (index: number) => void;
  onUpdateSlide: (index: number, updates: Partial<SlideConfig>) => void;
  onBulkAdd: (files: { file: File; dataUrl: string }[]) => void;
  mobileSlides: SlideConfig[];
  tabletSlides: SlideConfig[];
  mobileSlideRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  tabletSlideRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Thumbnail width for the grid preview
const THUMB_WIDTH = 320;

export function PreviewArea({
  slides,
  activeIndex,
  deviceType,
  onSelectSlide,
  onUpdateSlide,
  onBulkAdd,
  mobileSlides,
  tabletSlides,
  mobileSlideRefs,
  tabletSlideRefs,
}: PreviewAreaProps) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const dims = getDimensions(deviceType);
  const previewScale = THUMB_WIDTH / dims.width;

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const imageFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (imageFiles.length === 0) return;

      if (imageFiles.length === 1) {
        const dataUrl = await readFileAsDataUrl(imageFiles[0]);
        onUpdateSlide(activeIndex, {
          screenshotFile: imageFiles[0],
          screenshotDataUrl: dataUrl,
        });
      } else {
        const results = await Promise.all(
          imageFiles.map(async (file) => ({
            file,
            dataUrl: await readFileAsDataUrl(file),
          })),
        );
        onBulkAdd(results);
      }
    },
    [activeIndex, onUpdateSlide, onBulkAdd],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  return (
    <div
      ref={dropRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative flex-1 overflow-y-auto p-6 ${dragOver ? "bg-primary/5" : ""}`}
    >
      {/* Slide grid */}
      <div className="flex flex-wrap gap-4">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => onSelectSlide(i)}
            className={`relative flex-shrink-0 overflow-hidden rounded-xl transition-all ${
              i === activeIndex
                ? "ring-primary shadow-lg ring-3"
                : "ring-border hover:ring-text-muted shadow-md ring-1"
            }`}
            style={{
              width: THUMB_WIDTH,
              height: dims.height * previewScale,
            }}
          >
            <div
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
                width: dims.width,
                height: dims.height,
              }}
            >
              <ScreenshotSlide slide={slide} width={dims.width} height={dims.height} />
            </div>
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white">
              {i + 1}
            </span>
          </button>
        ))}
      </div>

      <p className="text-text-muted mt-4 text-xs">
        {dims.width} x {dims.height} &middot; Drag & drop screenshots
      </p>

      {dragOver && (
        <div className="bg-primary/20 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="text-primary rounded-xl bg-white/90 px-6 py-3 text-sm font-semibold shadow-lg">
            Drop to add screenshots
          </div>
        </div>
      )}

      {/* Hidden full-resolution renders for export — both device types always rendered */}
      <div className="pointer-events-none fixed top-0 -left-[9999px]" aria-hidden="true">
        {mobileSlides.map((slide, i) => (
          <ScreenshotSlide
            key={`mobile-${slide.id}`}
            slide={slide}
            width={MOBILE_WIDTH}
            height={MOBILE_HEIGHT}
            ref={(el) => {
              if (el) {
                mobileSlideRefs.current.set(i, el);
              } else {
                mobileSlideRefs.current.delete(i);
              }
            }}
          />
        ))}
        {tabletSlides.map((slide, i) => (
          <ScreenshotSlide
            key={`tablet-${slide.id}`}
            slide={slide}
            width={TABLET_WIDTH}
            height={TABLET_HEIGHT}
            ref={(el) => {
              if (el) {
                tabletSlideRefs.current.set(i, el);
              } else {
                tabletSlideRefs.current.delete(i);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
