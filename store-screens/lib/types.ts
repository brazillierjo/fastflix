export type DeviceType = "mobile" | "tablet";

export interface GradientPreset {
  id: string;
  name: string;
  css: string;
}

export interface SlideConfig {
  id: string;
  title: string;
  subtitle: string;
  screenshotFile: File | null;
  screenshotDataUrl: string | null;
  backgroundType: "solid" | "gradient";
  backgroundColor: string;
  gradientPresetId: string;
  textPosition: "top" | "bottom";
  showDynamicIsland: boolean;
}

import type { Locale } from "./presets";

export type EditorAction =
  | { type: "ADD_SLIDE" }
  | { type: "ADD_SLIDES_BULK"; files: { file: File; dataUrl: string }[] }
  | { type: "REMOVE_SLIDE"; index: number }
  | { type: "SET_ACTIVE"; index: number }
  | { type: "UPDATE_SLIDE"; index: number; updates: Partial<SlideConfig> }
  | { type: "REORDER_SLIDES"; fromIndex: number; toIndex: number }
  | { type: "SET_LOCALE"; locale: Locale }
  | { type: "SET_DEVICE_TYPE"; deviceType: DeviceType };

export interface EditorState {
  mobileSlides: SlideConfig[];
  tabletSlides: SlideConfig[];
  activeDeviceType: DeviceType;
  activeSlideIndex: number;
  locale: Locale;
}
