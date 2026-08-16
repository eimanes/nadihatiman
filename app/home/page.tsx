"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import Countdown from "@/components/Countdown"
import Hero from "@/components/Hero"
import { HomeContentProvider } from "@/components/HomeContentProvider"
import LanguageToggle from "@/components/LanguageToggle"
import Reveal from "@/components/Reveal"
import Story from "@/components/Story"
import Ticker from "@/components/Ticker"
import { site, type WeddingEvent } from "@/content/site"
import { usePermissions } from "@/hooks/usePermissions"

const QUICK_LINKS = [
  { href: "/tentative", emoji: "🗓️", label: "Event Schedule" },
  { href: "/invitations", emoji: "💌", label: "Digital Invitations" },
  { href: "/guestlist", emoji: "🧑‍🤝‍🧑", label: "Guest List" },
  { href: "/preparation", emoji: "🎀", label: "Preparation" },
  { href: "/checklist", emoji: "✅", label: "Checklist" },
  { href: "/budget", emoji: "💰", label: "Budget" },
]

const COUNTDOWNS = [
  { id: "nikah", title: "Nikah", dateIso: "2026-09-04T08:00:00+08:00", location: "Negeri Sembilan" },
  { id: "sanding", title: "Sanding", dateIso: "2026-09-06T11:00:00+08:00", location: "Negeri Sembilan" },
  { id: "tandang", title: "Tandang", dateIso: "2026-10-04T11:00:00+08:00", location: "Melaka" },
]

/** Main wedding site, reached after completing the video entry at /. */
export default function HomePage() {
  return <HomeContentProvider><HomeContent /></HomeContentProvider>
}

function HomeContent() {
  const { can, isSuperadmin } = usePermissions()
  const [events, setEvents] = useState<WeddingEvent[]>(site.events)

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.settings?.events)) setEvents(d.settings.events)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <Hero entered />
      <Ticker />
      <Story />

      <section className="mx-auto max-w-[1080px] px-5 pb-24 pt-16">
        {isSuperadmin && <div className="mb-5 flex justify-end"><Link href="/home/edit" className="rounded-full border border-line bg-white px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-ink shadow-[0_1px_2px_rgba(0,0,0,.04)] hover:bg-sage-soft">✏️ Edit home</Link></div>}
        <div className="mx-auto mb-12 grid max-w-[620px] grid-cols-1 gap-4">
          {COUNTDOWNS.map((countdown, index) => (
            <Reveal key={countdown.id} delay={index * 0.08}>
              <section className="h-full rounded-2xl border border-line bg-white px-5 py-6 text-center shadow-[0_1px_2px_rgba(0,0,0,.04)]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-gold">{countdown.title}</p>
                <p className="mt-1 text-[12px] text-muted">{countdown.location}</p>
                <div className="mt-5 scale-[.76] origin-top"><Countdown dateIso={countdown.dateIso} /></div>
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <h2 className="mb-6 text-center font-serif text-3xl text-ink">
            Three events, one story
          </h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {events.map((event, i) => (
            <Reveal key={event.id} delay={i * 0.08}>
              <article className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
                <div className="text-3xl">{event.emoji}</div>
                <h3 className="font-serif text-xl leading-snug text-ink">{event.name}</h3>
                <p className="text-[13px] text-muted">{event.tagline}</p>
                <dl className="space-y-1.5 text-[13px]">
                  <div className="flex gap-2"><dt>📅</dt><dd className="text-ink">{event.dateDisplay}</dd></div>
                  <div className="flex gap-2"><dt>🕚</dt><dd className="text-ink">{event.timeDisplay}</dd></div>
                  {event.locations.map((loc) => (
                    <div key={loc.label} className="flex gap-2">
                      <dt>📍</dt>
                      <dd><a href={loc.url} target="_blank" rel="noreferrer" className="text-sage underline-offset-2 hover:underline">{loc.label}: {loc.name} ↗</a></dd>
                    </div>
                  ))}
                </dl>
                <Link href={`/tentative#${event.id}`} className="mt-auto inline-block w-fit rounded-full bg-sage px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-white transition-transform hover:-translate-y-px">
                  View schedule →
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {QUICK_LINKS.filter((link) => link.href !== "/budget" || can("view_budget")).map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full border border-line bg-white px-5 py-2.5 text-[12px] text-ink shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,.08)]">
                {link.emoji} {link.label}
              </Link>
            ))}
          </div>
        </Reveal>
      </section>
      <LanguageToggle />
    </>
  )
}
