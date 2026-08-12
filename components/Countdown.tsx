"use client"

import { Fragment, useEffect, useState } from "react"

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

const LABELS = ["Days", "Hours", "Minutes", "Seconds"]

/** Live countdown to an ISO date-time (no RSVP — planner view only). */
export default function Countdown({ dateIso }: { dateIso: string }) {
  const [parts, setParts] = useState<Parts | null>(null)

  useEffect(() => {
    const target = new Date(dateIso).getTime()
    const tick = () => setParts(diffParts(target))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [dateIso])

  const values = parts ? [parts.d, parts.h, parts.m, parts.s] : [0, 0, 0, 0]

  return (
    <div className="flex flex-wrap items-start justify-center gap-[clamp(10px,3vw,24px)]">
      {values.map((value, i) => (
        <Fragment key={LABELS[i]}>
          {i > 0 && (
            <span
              aria-hidden="true"
              className="pt-1 font-serif text-[clamp(24px,4vw,36px)] text-sage/40 max-md:hidden"
            >
              :
            </span>
          )}
          <div className="min-w-[clamp(56px,10vw,92px)]">
            <span
              key={value}
              className="block animate-cdPop font-serif text-[clamp(30px,5vw,48px)] leading-none text-sage"
            >
              {value}
            </span>
            <span className="mt-2 block text-[10px] uppercase tracking-[0.26em] text-muted">
              {LABELS[i]}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
