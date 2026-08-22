import { CATEGORIES_CONFIG, createOption, listOptions } from "@/lib/guest-options"

export const dynamic = "force-dynamic"

/**
 * Guest categories — the customizable list of guest categories
 * (e.g. "Family", "Friends", "Colleagues", "VIP").
 * Collection: "guest_categories" (docs: { name, createdAt }).
 * Guests reference a category by its current name (guests.category).
 */

export async function GET() {
	return listOptions(CATEGORIES_CONFIG)
}

export async function POST(req: Request) {
	return createOption(CATEGORIES_CONFIG, req)
}
