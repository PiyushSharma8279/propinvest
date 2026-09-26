"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SIDE_THUMBS = 3;

/** Large main photo with prev/next arrows, plus a column (desktop) or strip (mobile) of thumbnails. */
export default function PropertyGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;

  const count = images.length;
  const go = (delta: number) => setActive((i) => (i + delta + count) % count);
  const side = images.slice(0, SIDE_THUMBS + 1).filter((_, i) => i !== active).slice(0, SIDE_THUMBS);
  const hidden = count - 1 - side.length;

  const arrowClass =
    "absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow-card backdrop-blur transition hover:bg-surface";

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="relative h-72 w-full shrink-0 overflow-hidden lg:w-auto lg:flex-1 rounded-card bg-surface-muted sm:h-[26rem] lg:h-[28rem]">
        <Image
          key={images[active]}
          src={images[active]}
          alt={`${alt} - photo ${active + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 75vw"
          className="object-cover"
          priority={active === 0}
        />
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className={cn(arrowClass, "left-4")} aria-label="Previous photo">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} className={cn(arrowClass, "right-4")} aria-label="Next photo">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-ink/60 px-3 py-1 text-xs font-medium text-on-primary backdrop-blur-sm">
          <Images className="h-3.5 w-3.5" aria-hidden="true" />
          {active + 1} / {count}
        </span>
      </div>

      {count > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {side.map((src, i) => {
            const index = images.indexOf(src);
            const isLast = i === side.length - 1 && hidden > 0;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setActive(index)}
                className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl ring-primary transition hover:ring-2 lg:h-auto lg:w-full lg:flex-1"
                aria-label={`Show photo ${index + 1}`}
              >
                <Image src={src} alt="" fill sizes="(max-width: 1024px) 112px, 224px" className="object-cover" />
                {isLast && (
                  <span className="absolute inset-0 hidden place-items-center bg-ink/55 lg:grid text-sm font-semibold text-on-primary">
                    +{hidden} photos
                  </span>
                )}
              </button>
            );
          })}
          {/* Mobile: the rest as a scrollable strip */}
          {images.map((src, index) =>
            side.includes(src) || index === active ? null : (
              <button
                key={`m-${src}`}
                type="button"
                onClick={() => setActive(index)}
                className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl lg:hidden"
                aria-label={`Show photo ${index + 1}`}
              >
                <Image src={src} alt="" fill sizes="112px" className="object-cover" />
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
