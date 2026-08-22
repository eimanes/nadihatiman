"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import EnterOverlay from "@/components/EnterOverlay"
import { defaultHomeContent } from "@/lib/home-content"
import { readCachedHomeContent, warmHomeMedia } from "@/lib/media-cache"

/** Dedicated invitation entry page. The main wedding site lives at /home. */
export default function EntryPage() {
	const router = useRouter()

	// Warm the /home media (Cloudinary images/videos + bundled fallbacks)
	// into the browser cache while the user watches the envelope video, so
	// entering /home renders instantly with zero loading spinners.
	useEffect(() => {
		warmHomeMedia(readCachedHomeContent() ?? defaultHomeContent)
	}, [])

	return <EnterOverlay entered={false} onEnter={() => router.push("/home")} />
}
