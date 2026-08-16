"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * The hero photograph field.
 *
 * Frame one is server rendered and carries `priority`: it is the LCP element.
 * The trailing frames do NOT render until the window load event, because
 * measured on a 1.6Mbps connection they began downloading at 1.1s and starved
 * frame one, pushing LCP from 2.4s to 3.4s. `fetchPriority="low"` was not
 * enough; they had to not exist yet.
 *
 * With a reduced-motion preference the trailing frames are never mounted at
 * all, so those visitors get one photograph and none of the bytes.
 */


export type Frame = { src: string; alt: string };

export function HeroSlideshow({ lead, frames }: { lead: Frame; frames: Frame[] }) {
  const FRAMES = frames;
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const start = () => {
      // One more frame of headroom after load, so decode of the LCP image is
      // genuinely finished rather than merely requested.
      window.setTimeout(() => setRotating(true), 300);
    };
    if (document.readyState === "complete") {
      start();
      return;
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  return (
    <div className="hero__pic" data-rotating={rotating ? "" : undefined}>
      <Image
        src={lead.src}
        alt={lead.alt}
        fill
        sizes="(max-width: 900px) 100vw, 55vw"
        priority
        style={{ objectFit: "cover" }}
      />
      {rotating &&
        FRAMES.map((f) => (
          <Image
            key={f.src}
            src={f.src}
            alt={f.alt}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            quality={50}
            fetchPriority="low"
            style={{ objectFit: "cover" }}
          />
        ))}
    </div>
  );
}
