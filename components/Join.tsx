"use client"

import { Fragment, useEffect, useState } from "react"
import Reveal from "@/components/Reveal"
import { site } from "@/content/site"

type Parts = { d: number; h: number; m: number; s: number }

function diffParts(targetMs: number): Parts {
  const diff = Math.max(0, targetMs - Date.now())
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor(diff / 3_600_000) % 24,
    m: Math.floor(diff / 60_000) % 60,
    s: Math.floor(diff / 1_000) % 60,
  }
}

/** Sage banner with live countdown, venue, and RSVP button. */
export default function Join() {
  const [parts, setParts] = useState<Parts>({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    const target = new Date(site.event.dateIso).getTime()
    const tick = () => setParts(diffParts(target))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const units: Array<[number, string]> = [
    [parts.d, "Days"],
    [parts.h, "Hours"],
    [parts.m, "Minutes"],
    [parts.s, "Seconds"],
  ]

  return (
    <section className="bg-sage px-6 py-24 text-center text-white">
      <div className="mx-auto max-w-[1080px]">
        <Reveal>
          <p className="mb-3.5 text-xs uppercase tracking-[0.3em] text-[#D9C9A8]">
            {site.event.label}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mb-10 font-serif text-[clamp(40px,7vw,72px)] tracking-wide">
            {site.event.dateDisplay}
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mb-14 flex flex-wrap items-start justify-center gap-[clamp(10px,3vw,28px)]">
            {units.map(([value, label], i) => (
              <Fragment key={label}>
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="pt-1.5 font-serif text-[clamp(30px,5vw,48px)] text-white/40 max-md:hidden"
                  >
                    :
                  </span>
                )}
                <div className="min-w-[clamp(64px,12vw,110px)]">
                  {/* Remounting on value change re-triggers the pop animation */}
                  <span
                    key={value}
                    className="block animate-cdPop font-serif text-[clamp(40px,7vw,64px)] leading-none"
                  >
                    {value}
                  </span>
                  <span className="mt-2.5 block text-[11px] uppercase tracking-[0.28em] text-white/65">
                    {label}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <p className="mb-2 font-serif text-[clamp(22px,3vw,30px)]">
            {site.event.venueName}
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mb-8 text-white/70">{site.event.venueAddress}</p>
        </Reveal>
        <Reveal delay={0.16}>
          <a
            href={site.event.rsvpHref}
            className="inline-block rounded-full bg-white px-9 py-4 text-[13px] uppercase tracking-[0.22em] text-sage transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,.18)]"
          >
            {site.event.rsvpCta}
          </a>
        </Reveal>
      </div>
    </section>
  )
}
