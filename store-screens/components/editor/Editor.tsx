"use client";

import { useReducer, useRef, useCallback } from "react";
import type { EditorState, EditorAction, SlideConfig, DeviceType } from "@/lib/types";
import { gradientPresets } from "@/lib/gradients";
import { mobilePresets, tabletPresets, LOCALES } from "@/lib/presets";
import type { Locale, SlidePreset } from "@/lib/presets";
import { getDimensions } from "@/lib/constants";
import { Sidebar } from "./Sidebar";
import { PreviewArea } from "./PreviewArea";
import { ExportButton } from "./ExportButton";

function createSlide(index: number): SlideConfig {
  return {
    id: crypto.randomUUID(),
    title: "",
    subtitle: "",
    screenshotFile: null,
    screenshotDataUrl: null,
    backgroundType: "solid",
    backgroundColor: "#895af6",
    gradientPresetId: gradientPresets[index % gradientPresets.length].id,
    textPosition: "top",
    showDynamicIsland: true,
  };
}

function createSlideFromPreset(preset: SlidePreset, locale: Locale): SlideConfig {
  return {
    id: crypto.randomUUID(),
    title: preset.titles[locale],
    subtitle: preset.subtitles[locale],
    screenshotFile: null,
    screenshotDataUrl: preset.screenshotPath,
    backgroundType: preset.backgroundType,
    backgroundColor: preset.backgroundColor,
    gradientPresetId: preset.gradientPresetId,
    textPosition: preset.textPosition,
    showDynamicIsland: preset.showDynamicIsland,
  };
}

function getActiveSlides(state: EditorState): SlideConfig[] {
  return state.activeDeviceType === "tablet" ? state.tabletSlides : state.mobileSlides;
}

function setActiveSlides(state: EditorState, slides: SlideConfig[]): Partial<EditorState> {
  return state.activeDeviceType === "tablet" ? { tabletSlides: slides } : { mobileSlides: slides };
}

function updateSlidesLocale(
  slides: SlideConfig[],
  presets: SlidePreset[],
  locale: Locale,
): SlideConfig[] {
  return slides.map((slide, i) => {
    const preset = presets[i];
    if (preset && slide.screenshotDataUrl === preset.screenshotPath) {
      return { ...slide, title: preset.titles[locale], subtitle: preset.subtitles[locale] };
    }
    return slide;
  });
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "ADD_SLIDE": {
      const slides = getActiveSlides(state);
      const newSlide = createSlide(slides.length);
      return {
        ...state,
        ...setActiveSlides(state, [...slides, newSlide]),
        activeSlideIndex: slides.length,
      };
    }
    case "ADD_SLIDES_BULK": {
      const slides = getActiveSlides(state);
      const hasEmptyInitial = slides.length === 1 && !slides[0].screenshotDataUrl;
      const baseSlides = hasEmptyInitial ? [] : slides;
      const newSlides = action.files.map((f, i) => ({
        ...createSlide(baseSlides.length + i),
        screenshotFile: f.file,
        screenshotDataUrl: f.dataUrl,
      }));
      return {
        ...state,
        ...setActiveSlides(state, [...baseSlides, ...newSlides]),
        activeSlideIndex: 0,
      };
    }
    case "REMOVE_SLIDE": {
      const slides = getActiveSlides(state).filter((_, i) => i !== action.index);
      return {
        ...state,
        ...setActiveSlides(state, slides),
        activeSlideIndex: Math.min(state.activeSlideIndex, slides.length - 1),
      };
    }
    case "SET_ACTIVE":
      return { ...state, activeSlideIndex: action.index };
    case "UPDATE_SLIDE": {
      const slides = getActiveSlides(state).map((slide, i) =>
        i === action.index ? { ...slide, ...action.updates } : slide,
      );
      return { ...state, ...setActiveSlides(state, slides) };
    }
    case "REORDER_SLIDES": {
      const slides = [...getActiveSlides(state)];
      const [moved] = slides.splice(action.fromIndex, 1);
      slides.splice(action.toIndex, 0, moved);
      return {
        ...state,
        ...setActiveSlides(state, slides),
        activeSlideIndex: action.toIndex,
      };
    }
    case "SET_LOCALE": {
      return {
        ...state,
        locale: action.locale,
        mobileSlides: updateSlidesLocale(state.mobileSlides, mobilePresets, action.locale),
        tabletSlides: updateSlidesLocale(state.tabletSlides, tabletPresets, action.locale),
      };
    }
    case "SET_DEVICE_TYPE":
      return {
        ...state,
        activeDeviceType: action.deviceType,
        activeSlideIndex: 0,
      };
    default:
      return state;
  }
}

const initialState: EditorState = {
  mobileSlides: mobilePresets.map((p) => createSlideFromPreset(p, "en")),
  tabletSlides: tabletPresets.map((p) => createSlideFromPreset(p, "en")),
  activeDeviceType: "mobile",
  activeSlideIndex: 0,
  locale: "en",
};

export function Editor() {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const mobileSlideRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const tabletSlideRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const slides = getActiveSlides(state);
  const slideRefs = state.activeDeviceType === "tablet" ? tabletSlideRefs : mobileSlideRefs;
  const dims = getDimensions(state.activeDeviceType);

  const handleSelectSlide = useCallback((index: number) => {
    dispatch({ type: "SET_ACTIVE", index });
  }, []);

  const handleAddSlide = useCallback(() => {
    dispatch({ type: "ADD_SLIDE" });
  }, []);

  const handleRemoveSlide = useCallback((index: number) => {
    dispatch({ type: "REMOVE_SLIDE", index });
  }, []);

  const handleUpdateSlide = useCallback((index: number, updates: Partial<SlideConfig>) => {
    dispatch({ type: "UPDATE_SLIDE", index, updates });
  }, []);

  const handleBulkAdd = useCallback((files: { file: File; dataUrl: string }[]) => {
    dispatch({ type: "ADD_SLIDES_BULK", files });
  }, []);

  const handleSetLocale = useCallback((locale: Locale) => {
    dispatch({ type: "SET_LOCALE", locale });
  }, []);

  const handleSetDeviceType = useCallback((deviceType: DeviceType) => {
    dispatch({ type: "SET_DEVICE_TYPE", deviceType });
  }, []);

  const getSlideElement = useCallback(
    (index: number) => slideRefs.current.get(index) ?? null,
    [slideRefs],
  );

  const getMobileSlideElement = useCallback(
    (index: number) => mobileSlideRefs.current.get(index) ?? null,
    [],
  );

  const getTabletSlideElement = useCallback(
    (index: number) => tabletSlideRefs.current.get(index) ?? null,
    [],
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Top Bar */}
      <div className="border-border bg-surface flex items-center justify-between border-b px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">FastFlix Screenshot Generator</h1>
          <p className="text-text-muted text-xs">
            App Store screenshots &middot; {dims.width} x {dims.height}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Device type toggle */}
          <div className="border-border flex rounded-lg border">
            {(["mobile", "tablet"] as const).map((dt) => (
              <button
                key={dt}
                onClick={() => handleSetDeviceType(dt)}
                className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  state.activeDeviceType === dt
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-surface-secondary"
                } ${dt === "mobile" ? "rounded-l-md" : "rounded-r-md"}`}
              >
                {dt}
              </button>
            ))}
          </div>
          {/* Locale selector */}
          <div className="flex gap-1">
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                onClick={() => handleSetLocale(loc.code)}
                title={loc.label}
                className={`rounded-md px-2 py-1 text-sm transition-colors ${
                  state.locale === loc.code
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-text-muted hover:bg-surface-secondary"
                }`}
              >
                {loc.flag}
              </button>
            ))}
          </div>
          <ExportButton
            getSlideElement={getSlideElement}
            getMobileSlideElement={getMobileSlideElement}
            getTabletSlideElement={getTabletSlideElement}
            activeIndex={state.activeSlideIndex}
            activeDeviceType={state.activeDeviceType}
            mobileSlides={state.mobileSlides}
            tabletSlides={state.tabletSlides}
            locale={state.locale}
            onSetLocale={handleSetLocale}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          slides={slides}
          activeIndex={state.activeSlideIndex}
          deviceType={state.activeDeviceType}
          onSelectSlide={handleSelectSlide}
          onAddSlide={handleAddSlide}
          onRemoveSlide={handleRemoveSlide}
          onUpdateSlide={handleUpdateSlide}
          onBulkAdd={handleBulkAdd}
        />
        <PreviewArea
          slides={slides}
          activeIndex={state.activeSlideIndex}
          deviceType={state.activeDeviceType}
          onSelectSlide={handleSelectSlide}
          onUpdateSlide={handleUpdateSlide}
          onBulkAdd={handleBulkAdd}
          mobileSlides={state.mobileSlides}
          tabletSlides={state.tabletSlides}
          mobileSlideRefs={mobileSlideRefs}
          tabletSlideRefs={tabletSlideRefs}
        />
      </div>
    </div>
  );
}
