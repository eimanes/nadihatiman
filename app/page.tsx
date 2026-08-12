"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import Countdown from "@/components/Countdown"
import EnterOverlay from "@/components/EnterOverlay"
import Hero from "@/components/Hero"
import Reveal from "@/components/Reveal"
import Story from "@/components/Story"
import Ticker from "@/components/Ticker"
import { site, type WeddingEvent } from "@/content/site"

const QUICK_LINKS = [
	{ href: "/tentative", emoji: "🗓️", label: "Event Schedule" },
	{ href: "/invitations", emoji: "💌", label: "Digital Invitations" },
	{ href: "/guestlist", emoji: "🧑‍🤝‍🧑", label: "Guest List" },
	{ href: "/preparation", emoji: "🎀", label: "Preparation" },
	{ href: "/checklist", emoji: "✅", label: "Checklist" },
	{ href: "/budget", emoji: "💰", label: "Budget" },
	{ href: "/admin", emoji: "✏️", label: "Edit Details" },
]

/**
 * Landing page — the original cordially experience:
 * envelope video ("Click to enter") → pinned hero collage → marquee →
 * scroll-scrubbed love story → event overview + planner links.
 */
export default function Home() {
	const [entered, setEntered] = useState(false)
	const [events, setEvents] = useState<WeddingEvent[]>(site.events)

	// Lock scrolling until the guest enters through the invitation video.
	useEffect(() => {
		document.body.style.overflow = entered ? "" : "hidden"
		return () => {
			document.body.style.overflow = ""
		}
	}, [entered])

	// Live event details come from MongoDB (falls back to the defaults).
	useEffect(() => {
		fetch("/api/settings", { cache: "no-store" })
			.then((r) => r.json())
			.then((d) => {
				if (Array.isArray(d?.settings?.events)) setEvents(d.settings.events)
			})
			.catch(() => {})
	}, [])

	const nextEvent = events.find((e) => e.dateIso)

	return (
		<>
			<EnterOverlay entered={entered} onEnter={() => setEntered(true)} />
			<Hero entered={entered} />
			<Ticker />
			<Story />

			{/* Event overview + planner quick links */}
			<section className="mx-auto max-w-[1080px] px-5 pb-24 pt-16">
				{nextEvent?.dateIso && (
					<Reveal>
						<div className="mx-auto mb-12 max-w-[620px] rounded-2xl border border-line bg-white px-6 py-8 text-center shadow-[0_1px_2px_rgba(0,0,0,.04)]">
							<p className="mb-5 text-[11px] uppercase tracking-[0.28em] text-muted">
								Counting down to {nextEvent.name} — {nextEvent.dateDisplay}
							</p>
							<Countdown dateIso={nextEvent.dateIso} />
						</div>
					</Reveal>
				)}

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
									<div className="flex gap-2">
										<dt>📅</dt>
										<dd className="text-ink">{event.dateDisplay}</dd>
									</div>
									<div className="flex gap-2">
										<dt>🕚</dt>
										<dd className="text-ink">{event.timeDisplay}</dd>
									</div>
									{event.locations.map((loc) => (
										<div key={loc.label} className="flex gap-2">
											<dt>📍</dt>
											<dd>
												<a
													href={loc.url}
													target="_blank"
													rel="noreferrer"
													className="text-sage underline-offset-2 hover:underline"
												>
													{loc.label}: {loc.name} ↗
												</a>
											</dd>
										</div>
									))}
								</dl>
								<Link
									href={`/tentative#${event.id}`}
									className="mt-auto inline-block w-fit rounded-full bg-sage px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-white transition-transform hover:-translate-y-px"
								>
									View schedule →
								</Link>
							</article>
						</Reveal>
					))}
				</div>

				<Reveal>
					<div className="mt-10 flex flex-wrap justify-center gap-2.5">
						{QUICK_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="rounded-full border border-line bg-white px-5 py-2.5 text-[12px] text-ink shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,.08)]"
							>
								{link.emoji} {link.label}
							</Link>
						))}
					</div>
				</Reveal>
			</section>
		</>
	)
}
