import { NextResponse } from "next/server"
import { CATEGORIES_CONFIG, createOption, listOptions } from "@/lib/guest-options"

export const dynamic = "force-dynamic"

/**
 * Guest categories — the customizable list of guest categories, each OWNED
 * BY an inviter (e.g. Eiman → BSN, Abah → Family).
 * Collection: "guest_categories" (docs: { name, owner, createdAt }).
 * Guests reference a category by its current name (guests.category).
 *
 * GET accepts ?owner=<inviter name> to list only that invitation's categories.
 */

export async function GET(req: Request) {
	const owner = new URL(req.url).searchParams.get("owner") ?? undefined
	return listOptions(CATEGORIES_CONFIG, owner)
}

export async function POST(req: Request) {
	return createOption(CATEGORIES_CONFIG, req)
}
