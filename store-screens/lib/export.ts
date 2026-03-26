import { domToPng } from "modern-screenshot";

export async function exportSlide(
  element: HTMLElement,
  width: number,
  height: number,
): Promise<Blob> {
  const dataUrl = await domToPng(element, {
    width,
    height,
    scale: 1,
    quality: 1.0,
  });
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function downloadSlide(
  element: HTMLElement,
  filename: string,
  width: number,
  height: number,
) {
  const blob = await exportSlide(element, width, height);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
