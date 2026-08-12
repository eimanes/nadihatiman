"use client"

import { useEffect, useState } from "react"

export const clamp = (v: number, min: number, max: number) =>
	Math.min(max, Math.max(min, v))

/** Smooth acceleration/deceleration for scroll-scrubbed values. */
export const smoothstep = (t: number) => t * t * (3 - 2 * t)

/**
 * Scroll progress (0..1) through a tall pinned container:
 * 0 when its top reaches the viewport top, 1 when its bottom leaves.
 */
export function usePinProgress(ref: React.RefObject<HTMLElement | null>) {
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		let rafId = 0
		const update = () => {
			const el = ref.current
			if (el) {
				const rect = el.getBoundingClientRect()
				const range = rect.height - window.innerHeight
				setProgress(range > 0 ? clamp(-rect.top / range, 0, 1) : 0)
			}
			rafId = requestAnimationFrame(update)
		}
		rafId = requestAnimationFrame(update)
		return () => cancelAnimationFrame(rafId)
	}, [ref])

	return progress
}
