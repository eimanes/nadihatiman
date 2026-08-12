"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type CanvaEmbedProps = {
  title: string
  subtitle?: string
  /** Canva read-only \"view?embed\" URL */
  embedUrl: string
  /** Canva view URL for opening in a new tab */
  openUrl: string
  /** Auto-refresh interval in minutes (default 5) */
  defaultIntervalMin?: number
}

const INTERVAL_OPTIONS = [1, 5, 10, 30]

/**
 * Read-only Canva embed that automatically reloads itself so the latest
 * version of the design (guest list) is always shown — no manual refresh
 * needed. The design is never edited from here; it is view-only.
 */
export default function CanvaEmbed({
  title,
  subtitle,
  embedUrl,
  openUrl,
  defaultIntervalMin = 5,
}: CanvaEmbedProps) {
  const [nonce, setNonce] = useState<number>(() => Date.now())
  const [intervalMin, setIntervalMin] = useState(defaultIntervalMin)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(() => {
    setNonce(Date.now())
    setLastRefresh(new Date())
  }, [])

  useEffect(() => {
    setLastRefresh(new Date())
  }, [])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(refresh, intervalMin * 60_000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [intervalMin, refresh])

  const src = `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}r=${nonce}`

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-serif text-xl text-ink">{title}</h2>
          {subtitle && <p className="text-[12px] text-muted">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <label className="flex items-center gap-1.5 text-muted">
            Auto-refresh:
            <select
              value={intervalMin}
              onChange={(e) => setIntervalMin(Number(e.target.value))}
              className="rounded-full border border-line bg-white px-2 py-1 text-ink"
            >
              {INTERVAL_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  every {m} min
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={refresh}
            className="rounded-full bg-sage px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-px"
          >
            ↻ Refresh now
          </button>
          <a
            href={openUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink"
          >
            Open in Canva ↗
          </a>
        </div>
      </header>

      <div className="relative h-[70vh] min-h-[480px] bg-cream">
        {/* key={nonce} forces a full iframe reload on every refresh */}
        <iframe
          key={nonce}
          src={src}
          title={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full border-0"
          allow="fullscreen"
        />
      </div>

      <footer className="flex items-center justify-between border-t border-line px-5 py-2.5 text-[11px] text-muted">
        <span>View only — data is read directly from Canva, no edits are made.</span>
        <span>
          Last updated:{" "}
          {lastRefresh ? lastRefresh.toLocaleTimeString("en-MY") : "—"}
        </span>
      </footer>
    </section>
  )
}
