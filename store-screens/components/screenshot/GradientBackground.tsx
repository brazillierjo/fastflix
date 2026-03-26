import { gradientPresets } from "@/lib/gradients";

interface GradientBackgroundProps {
  presetId: string;
}

export function GradientBackground({ presetId }: GradientBackgroundProps) {
  const preset = gradientPresets.find((p) => p.id === presetId) ?? gradientPresets[0];

  return <div className="absolute inset-0" style={{ background: preset.css }} />;
}
