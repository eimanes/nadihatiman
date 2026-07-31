"use client"

import { site } from "@/content/site"

type HeroProps = {
  entered: boolean
}

/** Full-viewport hero with a staggered entrance once the overlay opens. */
export default function Hero({ entered }: HeroProps) {
  const stagger = `transition-all duration-1000 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
    entered ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
  }`

  return (
    <header className="relative flex min-h-svh flex-col items-center justify-center p-6 text-center">
      <p className={`mb-5 text-xs uppercase tracking-[0.34em] text-muted ${stagger}`}>
        {site.hero.eyebrow}
      </p>
      <h1
        className={`font-serif text-[clamp(56px,12vw,148px)] leading-[1.05] tracking-wide ${stagger}`}
        style={{ transitionDelay: entered ? "0.15s" : "0s" }}
      >
        {site.couple.partnerA}{" "}
        <span className="align-middle text-[0.55em] italic text-gold">&amp;</span>{" "}
        {site.couple.partnerB}
      </h1>
      <p
        className={`mt-5 font-serif text-lg italic text-muted ${stagger}`}
        style={{ transitionDelay: entered ? "0.35s" : "0s" }}
      >
        {site.hero.subtitle}
      </p>
      {/* inset-x-0 (not transform) keeps the cue centered without fighting the entrance transition */}
      <div
        className={`absolute inset-x-0 bottom-9 flex flex-col items-center gap-2.5 ${stagger}`}
        style={{ transitionDelay: entered ? "0.55s" : "0s" }}
      >
        <span className="text-[11px] uppercase tracking-[0.3em] text-muted">
          {site.hero.scrollCue}
        </span>
        <span aria-hidden="true" className="relative block h-11 w-px overflow-hidden bg-muted">
          <span className="absolute left-0 h-full w-full animate-drip bg-ink" />
        </span>
      </div>
    </header>
  )
}
