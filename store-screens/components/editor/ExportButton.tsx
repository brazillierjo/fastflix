"use client";

import { useState, useCallback } from "react";
import { Download, FolderDown, Loader2 } from "lucide-react";
import { downloadSlide, exportSlide } from "@/lib/export";
import { LOCALES } from "@/lib/presets";
import type { Locale } from "@/lib/presets";
import type { SlideConfig, DeviceType } from "@/lib/types";
import {
  getDimensions,
  MOBILE_WIDTH,
  MOBILE_HEIGHT,
  TABLET_WIDTH,
  TABLET_HEIGHT,
} from "@/lib/constants";
import JSZip from "jszip";

interface ExportButtonProps {
  getSlideElement: (index: number) => HTMLDivElement | null;
  getMobileSlideElement: (index: number) => HTMLDivElement | null;
  getTabletSlideElement: (index: number) => HTMLDivElement | null;
  activeIndex: number;
  activeDeviceType: DeviceType;
  mobileSlides: SlideConfig[];
  tabletSlides: SlideConfig[];
  locale: Locale;
  onSetLocale: (locale: Locale) => void;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ExportButton({
  getSlideElement,
  getMobileSlideElement,
  getTabletSlideElement,
  activeIndex,
  activeDeviceType,
  mobileSlides,
  tabletSlides,
  locale,
  onSetLocale,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState("");

  const dims = getDimensions(activeDeviceType);

  const handleExportCurrent = async () => {
    const element = getSlideElement(activeIndex);
    if (!element) return;
    setExporting(true);
    try {
      await downloadSlide(element, `${activeIndex + 1}.png`, dims.width, dims.height);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAllLanguages = useCallback(async () => {
    setExportingAll(true);
    const zip = new JSZip();
    const originalLocale = locale;

    try {
      for (const loc of LOCALES) {
        setExportProgress(`${loc.flag} ${loc.label}...`);
        onSetLocale(loc.code);
        // Wait for React to re-render the off-screen slides
        await sleep(500);

        // Export mobile slides
        const mobileFolder = zip.folder(`mobile/${loc.code}`)!;
        for (let i = 0; i < mobileSlides.length; i++) {
          const element = getMobileSlideElement(i);
          if (!element) continue;
          const blob = await exportSlide(element, MOBILE_WIDTH, MOBILE_HEIGHT);
          mobileFolder.file(`${i + 1}.png`, blob);
        }

        // Export tablet slides
        const tabletFolder = zip.folder(`tablet/${loc.code}`)!;
        for (let i = 0; i < tabletSlides.length; i++) {
          const element = getTabletSlideElement(i);
          if (!element) continue;
          const blob = await exportSlide(element, TABLET_WIDTH, TABLET_HEIGHT);
          tabletFolder.file(`${i + 1}.png`, blob);
        }
      }

      // Restore original locale
      onSetLocale(originalLocale);

      setExportProgress("Zipping...");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fastflix-screenshots.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export all languages failed:", err);
      onSetLocale(originalLocale);
    } finally {
      setExportingAll(false);
      setExportProgress("");
    }
  }, [
    locale,
    mobileSlides.length,
    tabletSlides.length,
    getMobileSlideElement,
    getTabletSlideElement,
    onSetLocale,
  ]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportCurrent}
        disabled={exporting || exportingAll}
        className="bg-primary hover:bg-primary-dark flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        Download PNG
      </button>
      {(mobileSlides.length > 1 || tabletSlides.length > 1) && (
        <button
          onClick={handleExportAllLanguages}
          disabled={exportingAll}
          className="border-border bg-surface text-text hover:bg-surface-secondary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {exportingAll ? <Loader2 size={16} className="animate-spin" /> : <FolderDown size={16} />}
          {exportingAll ? exportProgress : `Export All (${LOCALES.length} langs)`}
        </button>
      )}
    </div>
  );
}
