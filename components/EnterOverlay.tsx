"use client"

import { site } from "@/content/site"

type EnterOverlayProps = {
  entered: boolean
  onEnter: () => void
}

/** Full-screen "Click to enter" splash that slides away on click. */
export default function EnterOverlay({ entered, onEnter }: EnterOverlayProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Click to enter the wedding website"
      onClick={onEnter}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEnter()
      }}
      className={`fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-6 bg-sage transition-[transform,opacity] duration-1000 ease-[cubic-bezier(.77,0,.18,1)] motion-reduce:duration-200 ${
        entered
          ? "pointer-events-none -translate-y-full opacity-95 motion-reduce:translate-y-0 motion-reduce:opacity-0"
          : ""
      }`}
    >
      <div className="flex h-24 w-24 animate-breathe items-center justify-center rounded-full border border-white/50 font-serif text-[28px] italic text-white">
        {site.couple.monogram}
      </div>
      <div className="font-serif text-[clamp(28px,5vw,44px)] tracking-wide text-white">
        {site.couple.partnerA} &amp; {site.couple.partnerB}
      </div>
      <div className="animate-pulseSoft text-xs uppercase tracking-[0.32em] text-white/75">
        {site.enterCta}
      </div>
    </div>
  )
}
