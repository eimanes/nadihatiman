import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/permissions"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { INVITERS_CONFIG, createOption, listOptions } from "@/lib/guest-options"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
	error:
		"Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

/**
 * Guest inviters — the managed list of "invited by" options for guests
 * (e.g. "Abah's invitation", "Mama's invitation", "Eiman's side").
 * Collection: "guest_inviters" (docs: { name, createdAt }).
 * Guests reference an inviter by its current name (guests.invitedBy).
 */

export async function GET() {
	return listOptions(INVITERS_CONFIG)
}

export async function POST(req: Request) {
	return createOption(INVITERS_CONFIG, req)
}
