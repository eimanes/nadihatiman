import type { Metadata } from "next"
import ScheduleEditLink from "@/components/ScheduleEditLink"
import SwimLane from "@/components/SwimLane"
import Reveal from "@/components/Reveal"
import { site } from "@/content/site"
import { loadSettings } from "@/lib/settings"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Event Schedule — ${site.brand.name}`,
}

export default async function TentativePage() {
  const { settings } = await loadSettings()

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-20 pt-24">
      <header className="py-10 text-center">
        <Reveal>
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">
            Schedule
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="font-serif text-4xl text-ink">Event schedule</h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-relaxed text-muted">
            The full flow of all three events as a swim lane — follow each lane
            to see the movements of Eiman, Nadia and family: when, where, and
            what to do.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <ScheduleEditLink />
        </Reveal>
      </header>

      <div className="space-y-16">
        {settings.events.map((event) => (
          <section key={event.id} id={event.id} className="scroll-mt-28">
            <Reveal>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-serif text-3xl text-ink">
                    {event.emoji} {event.name}
                  </h2>
                  <p className="mt-1 text-muted">
                    {event.dateDisplay} · {event.timeDisplay}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.locations.map((loc) => (
                    <a
                      key={loc.label}
                      href={loc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-line bg-white px-4 py-1.5 text-[12px] text-sage underline-offset-2 hover:underline"
                    >
                      📍 {loc.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <SwimLane event={event} />
            </Reveal>

            {/* Dress code */}
            <Reveal delay={0.12}>
              <div className="mt-4 rounded-2xl border border-line bg-white p-5">
                <h3 className="mb-3 text-[11px] uppercase tracking-[0.24em] text-muted">
                  Dress code / theme colors
                </h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {event.dressCode.map((dc) => (
                    <div
                      key={dc.group}
                      className="flex items-center gap-2.5 rounded-xl bg-cream px-3.5 py-2.5 text-[13px]"
                    >
                      <span className="flex shrink-0 gap-1">
                        {dc.swatches.map((hex) => (
                          <span
                            key={hex}
                            className="h-4 w-4 rounded-full border border-line"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </span>
                      <span className="text-muted">
                        <b className="font-medium text-ink">{dc.group}:</b>{" "}
                        {dc.theme}
                      </span>
                    </div>
                  ))}
                </div>
                {event.notes.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-[12px] text-muted">
                    {event.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          </section>
        ))}
      </div>
    </div>
  )
}
