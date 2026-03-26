import type { GradientPreset } from "./types";

export const gradientPresets: GradientPreset[] = [
  {
    id: "fastflix-red",
    name: "FastFlix Red",
    css: "linear-gradient(180deg, #e50914 0%, #8b0000 35%, #1a0000 70%, #000000 100%)",
  },
  {
    id: "fastflix-dark",
    name: "FastFlix Dark",
    css: "linear-gradient(180deg, #b30710 0%, #4a0000 40%, #0a0a0a 75%, #000000 100%)",
  },
  {
    id: "fastflix-cinema",
    name: "FastFlix Cinema",
    css: "radial-gradient(ellipse at 50% 0%, #e50914 0%, transparent 60%), linear-gradient(180deg, #1a0000 0%, #000000 100%)",
  },
  {
    id: "fastflix-glow",
    name: "FastFlix Glow",
    css: "radial-gradient(ellipse at 50% 20%, #ff3333 0%, transparent 50%), linear-gradient(180deg, #2a0000 0%, #000000 80%)",
  },
  {
    id: "fastflix-ember",
    name: "FastFlix Ember",
    css: "linear-gradient(180deg, #cc0000 0%, #660000 30%, #1a0a0a 65%, #000000 100%)",
  },
  {
    id: "fastflix-midnight",
    name: "FastFlix Midnight",
    css: "linear-gradient(180deg, #990000 0%, #330000 40%, #0d0d0d 80%, #000000 100%)",
  },
];
