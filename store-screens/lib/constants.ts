import type { DeviceType } from "./types";

// iPhone 6.5" / 6.7" — 1242 x 2688 (App Store Connect)
export const MOBILE_WIDTH = 1242;
export const MOBILE_HEIGHT = 2688;

// iPad 12.9" — 2064 x 2752 (App Store Connect)
export const TABLET_WIDTH = 2064;
export const TABLET_HEIGHT = 2752;

export function getDimensions(deviceType: DeviceType) {
  return deviceType === "tablet"
    ? { width: TABLET_WIDTH, height: TABLET_HEIGHT }
    : { width: MOBILE_WIDTH, height: MOBILE_HEIGHT };
}
