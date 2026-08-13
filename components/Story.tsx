"use client"

import Image from "next/image"
import { useRef } from "react"
import { site } from "@/content/site"
import { clamp, usePinProgress } from "@/components/usePinProgress"

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const ROTATIONS = [-4, 3, -2]

/**
 * "Our story" — the page pins (freezes) while scrolling flies polaroid
 * frames up from below, stacking them on top of each other. Each
 * chapter's text is visible while its polaroid flies in and fades away
 * once the polaroid lands on the stack. Fully reversible on scroll-up.
 */
export default function Story() {
	const outerRef = useRef<HTMLDivElement>(null)
	const progress = usePinProgress(outerRef)
	const chapters = site.landing.story.chapters
	const n = chapters.length

	return (
		<section id="story">
			<div ref={outerRef} className="relative" style={{ height: `${n * 100 + 160}vh` }}>
				<div className="sticky top-0 grid h-screen grid-rows-[auto_1fr_auto] overflow-hidden px-4">
					{/* Row 1: heading (extra top padding so the fixed nav never overlaps it) */}
					<div className="pointer-events-none z-30 pt-24 text-center md:pt-28">
						<p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold md:mb-3">
							{site.landing.story.label}
						</p>
						<h2 className="font-serif text-[clamp(30px,5vw,52px)] leading-tight">
							{site.landing.story.title}
						</h2>
					</div>

					{/* Row 2: polaroid stack (sized to always fit inside its row) */}
					<div className="relative min-h-0 w-full">
						{chapters.map((chapter, i) => {
							const seg = clamp(progress * n - i, 0, 1)
							const enter = easeOut(seg)
							const flyY = (1 - enter) * 115 // vh
							const rot = ROTATIONS[i % ROTATIONS.length] * enter
							return (
								<figure
									key={chapter.title}
									className="absolute left-1/2 top-1/2 w-[min(62vw,30vh,360px)] rounded-[4px] bg-white p-3 pb-14 shadow-[0_18px_50px_rgba(0,0,0,.18)] will-change-transform"
									style={{
										transform: `translate(-50%, calc(-50% + ${i * 10}px + ${flyY}vh)) rotate(${rot}deg)`,
										zIndex: i + 1,
									}}
								>
									<div className="relative aspect-square overflow-hidden bg-sage-soft">
										<Image
											src={chapter.image}
											alt={chapter.imageAlt}
											fill
											sizes="(max-width: 820px) 62vw, 360px"
											className="object-cover"
										/>
									</div>
									<figcaption className="absolute inset-x-2 bottom-4 truncate text-center font-serif text-base italic text-ink/75 md:text-lg">
										{chapter.title}
									</figcaption>
								</figure>
							)
						})}
					</div>

					{/* Row 3: chapter text — own reserved zone, never under the photos */}
					<div className="pointer-events-none relative z-30 mx-auto min-h-[170px] w-full max-w-[600px] pb-[4vh] md:min-h-[140px]">
						{chapters.map((chapter, i) => {
							const seg = clamp(progress * n - i, 0, 1)
							const fadeIn = clamp((seg - 0.05) / 0.2, 0, 1)
							const fadeOut = clamp((seg - 0.78) / 0.22, 0, 1) // fades as it lands
							const opacity = fadeIn * (1 - fadeOut)
							return (
								<div
									key={chapter.title}
									className="absolute inset-x-0 top-0 mx-auto px-4 text-center"
									style={{ opacity, transform: `translateY(${(1 - fadeIn) * 18}px)` }}
								>
									<p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-gold">
										{chapter.kicker}
									</p>
									<p className="text-[14px] leading-relaxed text-muted md:text-[15px]">
										{chapter.text}
									</p>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		</section>
	)
}
