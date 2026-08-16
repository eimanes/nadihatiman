"use client"

import { useRouter } from "next/navigation"
import EnterOverlay from "@/components/EnterOverlay"

/** Dedicated invitation entry page. The main wedding site lives at /home. */
export default function EntryPage() {
	const router = useRouter()

	return <EnterOverlay entered={false} onEnter={() => router.push("/home")} />
}
