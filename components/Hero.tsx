"use client"

import Image from "next/image"
import { useRef } from "react"
import { site } from "@/content/site"
import { useHomeContent } from "@/components/HomeContentProvider"
import { clamp, smoothstep, usePinProgress } from "@/components/usePinProgress"

// Side photos of the collage: position + when they appear (scroll progress).
// Kept near the edges (smaller on mobile) so they never cover the main card.
const SIDE = [
	{ cls: "left-[3%] top-[12%] w-[18vw] max-md:w-[24vw] aspect-[3/4]", start: 0.5 },
	{ cls: "left-[7%] bottom-[10%] w-[15vw] max-md:w-[20vw] aspect-square", start: 0.62 },
	{ cls: "right-[4%] top-[15%] w-[16vw] max-md:w-[22vw] aspect-square", start: 0.56 },
	{ cls: "right-[6%] bottom-[12%] w-[18vw] max-md:w-[24vw] aspect-[3/4]", start: 0.68 },
]

/**
 * Pinned hero. Starts as the main photo filling the whole frame with the
 * names overlaid. Scrolling down shrinks the main photo into a centered
 * card while more photos slide in around it, forming a collage.
 * Scrolling back up reverses everything.
 */
export default function Hero({ entered }: { entered: boolean }) {
	const { content, language } = useHomeContent()
	const outerRef = useRef<HTMLDivElement>(null)
	const p = usePinProgress(outerRef)

	const s = smoothstep(clamp(p / 0.55, 0, 1)) // main photo shrink phase
	const namesOpacity = 1 - clamp(p / 0.22, 0, 1)
	const cueOpacity = 1 - clamp(p / 0.15, 0, 1)

	return (
		<div id="top" ref={outerRef} className="relative" style={{ height: "260vh" }}>
			<div
				className={`sticky top-0 flex h-screen items-center justify-center overflow-hidden transition-opacity duration-1000 ${
					entered ? "opacity-100" : "opacity-0"
				}`}
			>
				{/* Side photos (fade + rise in as the main photo shrinks) */}
				{SIDE.map((side, i) => {
					const t = smoothstep(clamp((p - side.start) / 0.22, 0, 1))
					const item = site.landing.collage.items[i % site.landing.collage.items.length]
					const media = content.images.collage[i % content.images.collage.length]
					const image = media?.url || item.image
					return (
						<div
							key={image}
							className={`absolute ${side.cls} will-change-[opacity,transform]`}
							style={{ opacity: t, transform: `translateY(${(1 - t) * 64}px)` }}
						>
							<div className="relative h-full w-full overflow-hidden rounded-[10px] bg-sage-soft shadow-[0_14px_40px_rgba(0,0,0,.12)]">
								{media?.type === "video" ? <video src={image} autoPlay muted loop playsInline className="h-full w-full object-cover" /> : <Image src={image} alt={item.alt} fill sizes="(max-width: 820px) 24vw, 18vw" className="object-cover" />}
							</div>
						</div>
					)
				})}

				{/* Main photo: full frame → centered collage card */}
				<div
					className="relative z-10 overflow-hidden will-change-[width,height]"
					style={{
						width: `${100 - 56 * s}vw`,
						height: `${100 - 48 * s}svh`,
						borderRadius: `${s * 14}px`,
						boxShadow: s > 0.05 ? "0 24px 70px rgba(0,0,0,.18)" : "none",
					}}
				>
					{content.images.hero.type === "video" ? (
						<video src={content.images.hero.url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
					) : content.images.hero.url ? (
						<Image src={content.images.hero.url} alt={site.landing.hero.imageAlt} fill priority sizes="100vw" className="object-cover" />
					) : (
						<div className="h-full w-full bg-sage-soft" />
					)}
					{/* Names overlaid on the full-frame photo; fade out as it shrinks. */}
					<div
						className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 px-6 pb-24 pt-20 text-center text-white"
						style={{ opacity: namesOpacity, pointerEvents: "none" }}
					>
						<p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-white/85 md:mb-5 md:text-xs md:tracking-[0.34em]">
							{content[language].heroEyebrow}
						</p>
						<h1 className="max-w-full font-serif text-[clamp(40px,9vw,110px)] leading-[1.05] tracking-wide">
							{site.couple.bride}{" "}
							<span className="align-middle text-[0.55em] italic text-gold">&amp;</span>{" "}
							{site.couple.groom}
						</h1>
						<p className="mt-3 font-serif text-base italic text-white/85 md:mt-4 md:text-lg">
							{content[language].heroSubtitle}
						</p>
					</div>
				</div>

				{/* Scroll cue — sits in the reserved bottom padding, below the names */}
				<div
					className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-2.5"
					style={{ opacity: cueOpacity }}
				>
					<span className="text-[11px] uppercase tracking-[0.3em] text-white mix-blend-difference">
						{site.landing.hero.scrollCue}
					</span>
					<span aria-hidden="true" className="relative block h-9 w-px overflow-hidden bg-white/70 mix-blend-difference">
						<span className="absolute left-0 h-full w-full animate-drip bg-white" />
					</span>
				</div>
			</div>
		</div>
	)
}
