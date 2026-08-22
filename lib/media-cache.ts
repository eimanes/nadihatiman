import { site } from "@/content/site"
import { isHomeContent, type HomeContent } from "@/lib/home-content"

/**
 * Client-side cache for the home page content + its Cloudinary media.
 *
 * Goals (repeat visits should never wait on Cloudinary):
 *  1. The home CONTENT json is mirrored into localStorage so /home renders
 *     the correct media URLs instantly — before /api/home-content answers.
 *  2. The MEDIA itself is warmed on the entry screen (/) while the envelope
 *     video plays, so the bytes already sit in the browser HTTP cache by
 *     the time the user enters /home.
 *
 * The API is still called on every visit (source of truth stays fresh) —
 * it just never blocks the first paint.
 */

const CACHE_KEY = "nadihatiman:home-content:v1"

/** Home content saved on a previous visit, validated before use. */
export function readCachedHomeContent(): HomeContent | null {
	if (typeof window === "undefined") return null
	try {
		const raw = window.localStorage.getItem(CACHE_KEY)
		if (!raw) return null
		const parsed = JSON.parse(raw) as { content?: unknown }
		const candidate = parsed?.content
		return isHomeContent(candidate) ? candidate : null
	} catch {
		return null // corrupted entry — ignore and fall back to defaults
	}
}

/** Persist the home content so the next visit paints immediately. */
export function writeCachedHomeContent(content: HomeContent): void {
	if (typeof window === "undefined") return
	try {
		window.localStorage.setItem(
			CACHE_KEY,
			JSON.stringify({ savedAt: Date.now(), content }),
		)
	} catch {
		// Private mode / storage full — caching is best effort.
	}
}

const isVideo = (url: string) =>
	url.includes("/video/upload/") || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)

/**
 * Warm one image through Next's image optimizer, so the exact variant the
 * page will request (/_next/image?url=…&w=…&q=75) is already in the cache.
 */
function warmImage(url: string, width: number) {
	void fetch(
		`/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`,
	).catch(() => {})
}

/**
 * Warm one video via a hidden <video preload="auto">. Media-element fetches
 * are no-cors but still go through the HTTP cache, which works for the
 * Cloudinary URLs (served with long cache headers).
 */
function warmVideo(url: string) {
	const video = document.createElement("video")
	video.preload = "auto"
	video.muted = true
	video.setAttribute("hidden", "")
	video.src = url
	document.body.appendChild(video)
	// Give it time to buffer fully, then drop the element.
	window.setTimeout(() => video.remove(), 90_000)
}

/**
 * Preload the home media into the browser cache. Hero first (it is the
 * largest / most visible), then the collage + story media, staggered so it
 * never competes with the envelope video the user is watching.
 *
 * Slots without a Cloudinary URL warm their bundled local fallback instead,
 * so even the very first visit enters /home with everything ready.
 */
export function warmHomeMedia(content: HomeContent): void {
	if (typeof window === "undefined") return

	// Hero — warm desktop + mobile variants of the full-frame image.
	const hero = content.images.hero.url || site.landing.hero.image
	if (hero) {
		if (isVideo(hero)) {
			warmVideo(hero)
		} else {
			warmImage(hero, 1920)
			window.setTimeout(() => warmImage(hero, 828), 150)
		}
	}

	// Collage + story slots (Cloudinary URL when set, local fallback if not).
	const rest: string[] = [
		...content.images.collage.map(
			(m, i) => m?.url || site.landing.collage.items[i % site.landing.collage.items.length]?.image,
		),
		...content.images.story.map(
			(m, i) => m?.url || site.landing.story.chapters[i]?.image,
		),
	].filter((url): url is string => Boolean(url))

	rest.forEach((url, i) => {
		window.setTimeout(
			() => (isVideo(url) ? warmVideo(url) : warmImage(url, 640)),
			600 + i * 200,
		)
	})
}
