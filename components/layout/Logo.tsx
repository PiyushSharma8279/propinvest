import Image from "next/image";
import logoMark from "@/app/assets/logo-mark.png";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils/cn";

/*
 * logo-mark.png is app/assets/logo.png trimmed to the artwork with the white background
 * made transparent. If you replace logo.png, regenerate it (see README → Logo).
 */

const markHeights = { xs: 24, sm: 32, md: 40, lg: 56 } as const;
type MarkSize = keyof typeof markHeights;

/** The logo artwork on its own — used wherever space is tight (collapsed sidebar, favicons). */
export function BrandMark({
  size = "md",
  className,
  decorative = false,
}: {
  size?: MarkSize;
  className?: string;
  /** True when the name is shown as text right next to it, so screen readers skip the image. */
  decorative?: boolean;
}) {
  const height = markHeights[size];
  const width = Math.round((height * logoMark.width) / logoMark.height);
  return (
    <Image
      src={logoMark}
      alt={decorative ? "" : siteConfig.name}
      width={width}
      height={height}
      priority
      className={cn("shrink-0 object-contain", className)}
      style={{ width, height }}
    />
  );
}

/** "by Maa Rudrani Properties" with the company name in red (#c62828 stays readable at small sizes). */
function Byline({ light }: { light: boolean }) {
  const [by, ...name] = siteConfig.byline.split(" ");
  return (
    <>
      {by} <span className={light ? "text-on-primary" : "text-[#c62828]"}>{name.join(" ")}</span>
    </>
  );
}

/** Brand lockup: logo artwork + "InvestsProperty" + byline (or a custom subtitle). */
export default function Logo({
  tone = "dark",
  size = "md",
  subtitle = siteConfig.byline,
}: {
  tone?: "light" | "dark";
  size?: "sm" | "md";
  subtitle?: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark size={size} decorative />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "truncate font-display font-bold tracking-tight",
            size === "md" ? "text-lg" : "text-base",
            tone === "light" ? "text-on-primary" : "text-ink"
          )}
        >
          {siteConfig.name}
        </span>
        <span
          className={cn(
            "mt-1 truncate font-semibold",
            size === "md" ? "text-[13px]" : "text-xs",
            tone === "light" ? "text-on-primary" : "text-ink"
          )}
        >
          {subtitle === siteConfig.byline ? <Byline light={tone === "light"} /> : subtitle}
        </span>
      </span>
    </span>
  );
}
