"use client"

import { useRef, useState } from "react"
import { site } from "@/content/site"

type EnterOverlayProps = {
	entered: boolean
	onEnter: () => void
}

/**
 * Landing screen: a full-viewport envelope video on black.
 * Clicking "Click to enter" plays the envelope-opening video; when it
 * ends, the overlay fades/scales away into the main page.
 *
 * Replace the video at public/envelope/willow-and-florals.mp4 (or point
 * site.landing.envelope.videoSrc at your own file).
 */
export default function EnterOverlay({ entered, onEnter }: EnterOverlayProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const firedRef = useRef(false)
	const [playing, setPlaying] = useState(false)

	const finish = () => {
		if (firedRef.current) return
		firedRef.current = true
		onEnter()
	}

	const start = () => {
		if (playing) return
		setPlaying(true)
		const video = videoRef.current
		if (!video) {
			finish()
			return
		}
		video.onended = finish
		video.onerror = finish
		const played = video.play()
		if (played) played.catch(finish) // missing/blocked video → enter directly
		// Safety net in case the video stalls.
		window.setTimeout(finish, 10000)
	}

	return (
		<div
			className={`fixed inset-0 z-50 bg-black ${entered ? "pointer-events-none" : ""}`}
			style={{
				opacity: entered ? 0 : 1,
				transform: entered ? "scale(1.04)" : "scale(1)",
				transition: "transform 500ms ease, opacity 500ms ease",
				willChange: "transform, opacity",
			}}
		>
			<video
				ref={videoRef}
				data-testid="envelope-video"
				src={site.landing.envelope.videoSrc}
				preload="auto"
				playsInline
				muted
				aria-hidden="true"
				className="h-full w-full object-cover"
			>
				Your browser does not support the invitation video.
			</video>

			{/* Intro layer with the enter button (fades once the video starts) */}
			<div
				className={`absolute inset-0 flex flex-col items-center justify-center gap-7 bg-black/40 transition-opacity duration-500 ${
					playing ? "pointer-events-none opacity-0" : ""
				}`}
			>
				<div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/40 bg-white/95 p-3 shadow-[0_6px_30px_rgba(0,0,0,.35)]">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={site.brand.logo}
						alt={`Logo ${site.brand.name}`}
						className="h-full w-full object-contain"
					/>
				</div>
				<div className="text-center font-serif text-[clamp(28px,5vw,44px)] tracking-wide text-white">
					{site.couple.bride} &amp; {site.couple.groom}
				</div>
				<button
					type="button"
					onClick={start}
					className="rounded-full border border-white/70 px-9 py-3.5 text-xs uppercase tracking-[0.3em] text-white transition-colors duration-300 hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
				>
					{site.landing.envelope.cta}
				</button>
			</div>
		</div>
	)
}
