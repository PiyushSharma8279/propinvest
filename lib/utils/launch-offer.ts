/** Pre-launch vs launch pricing. Safe to import from client components. */

export interface OfferPrice {
  /** ₹ per area unit */
  rate: number;
  /** rate × area, or 0 when the area is unknown */
  total: number;
}

export interface LaunchOffer {
  prelaunch: OfferPrice | null;
  launch: OfferPrice | null;
  /** Only when both rates are given and pre-launch is cheaper. */
  saving: { perUnit: number; total: number; percent: number } | null;
}

/**
 * Builds the offer from the rates stored on a listing (₹ per areaUnit) and its area.
 * Either rate may be missing; returns null when neither is set.
 */
export function launchOffer(input: { prelaunchRate: number; launchRate: number; areaMin: number }): LaunchOffer | null {
  const price = (rate: number): OfferPrice | null =>
    rate > 0 ? { rate, total: input.areaMin > 0 ? Math.round(rate * input.areaMin) : 0 } : null;
  const prelaunch = price(input.prelaunchRate);
  const launch = price(input.launchRate);
  if (!prelaunch && !launch) return null;

  const saving =
    prelaunch && launch && launch.rate > prelaunch.rate
      ? {
          perUnit: launch.rate - prelaunch.rate,
          total: launch.total - prelaunch.total,
          percent: Math.round(((launch.rate - prelaunch.rate) / launch.rate) * 100),
        }
      : null;
  return { prelaunch, launch, saving };
}
