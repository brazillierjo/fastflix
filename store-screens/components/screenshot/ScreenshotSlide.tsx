import { forwardRef } from "react";
import { MOBILE_WIDTH, MOBILE_HEIGHT } from "@/lib/constants";
import type { SlideConfig } from "@/lib/types";
import { GradientBackground } from "./GradientBackground";

interface ScreenshotSlideProps {
  slide: SlideConfig;
  width?: number;
  height?: number;
}

// Screenshot takes ~85% of canvas width, with rounded corners like Duolingo style
const SCREENSHOT_WIDTH_RATIO = 0.85;

// Base dimensions for scaling (mobile is the reference)
const BASE_WIDTH = 1242;
const BASE_HEIGHT = 2688;

export const ScreenshotSlide = forwardRef<HTMLDivElement, ScreenshotSlideProps>(
  function ScreenshotSlide({ slide, width = MOBILE_WIDTH, height = MOBILE_HEIGHT }, ref) {
    const isTextTop = slide.textPosition === "top";
    const screenshotWidth = Math.round(width * SCREENSHOT_WIDTH_RATIO);
    // Use width-based scale for horizontal props (padding, border-radius, screenshot offset)
    const scale = width / BASE_WIDTH;
    // Use the more conservative ratio for text sizing so it doesn't overflow
    // on wider-but-not-taller canvases like tablet (2064x2752)
    const textScale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
    // Tablet has a wider aspect ratio — center text in the gap above screenshot
    const isTabletRatio = width / height > 0.6;

    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width,
          height,
        }}
      >
        {/* Background */}
        {slide.backgroundType === "gradient" ? (
          <GradientBackground presetId={slide.gradientPresetId} />
        ) : (
          <div className="absolute inset-0" style={{ background: slide.backgroundColor }} />
        )}

        {/* Text */}
        <div
          className="absolute right-0 left-0 z-10 flex flex-col items-center justify-center"
          style={{
            paddingLeft: Math.round(60 * textScale),
            paddingRight: Math.round(60 * textScale),
            ...(isTextTop
              ? {
                  top: 0,
                  height: isTabletRatio
                    ? Math.round(height * 0.14)
                    : Math.round(height * 0.30),
                }
              : { bottom: Math.round(120 * textScale) }),
          }}
        >
          {slide.title && (
            <div
              style={{
                fontFamily: "var(--font-nunito)",
                fontWeight: 800,
                fontSize: Math.round(100 * textScale),
                lineHeight: 1.05,
                color: "#ffffff",
                textAlign: "center",
                letterSpacing: -1 * textScale,
              }}
            >
              {slide.title}
            </div>
          )}
        </div>

        {/* Screenshot — raw image with rounded corners and shadow, overflows edge */}
        <div
          className="absolute left-1/2"
          style={{
            width: screenshotWidth,
            transform: "translateX(-50%)",
            ...(isTextTop
              ? isTabletRatio
                ? { top: Math.round(height * 0.14) }
                : { bottom: Math.round(-40 * scale) }
              : { top: Math.round(-60 * scale) }),
          }}
        >
          {slide.screenshotDataUrl ? (
            <img
              src={slide.screenshotDataUrl}
              alt="App screenshot"
              style={{
                width: "100%",
                display: "block",
                borderRadius: Math.round(40 * scale),
                boxShadow: "0 20px 80px rgba(0,0,0,0.35), 0 8px 30px rgba(0,0,0,0.2)",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: "1170 / 2532",
                borderRadius: Math.round(40 * scale),
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.3)",
                fontSize: Math.round(32 * scale),
                fontFamily: "var(--font-nunito)",
              }}
            >
              Drop screenshot here
            </div>
          )}
        </div>
      </div>
    );
  },
);
