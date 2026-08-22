import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requirePermission } from "@/lib/permissions"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { INVITERS_CONFIG, deleteOption, renameOption } from "@/lib/guest-options"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
	error:
		"Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

type Params = { params: Promise<{ id: string }> }

/** Rename an inviter — cascades to all guests using the old name. */
export async function PATCH(req: Request, { params }: Params) {
	const { id } = await params
	return renameOption(INVITERS_CONFIG, req, id)
}

/** Delete an inviter — guests using it are unassigned (invitedBy → ""). */
export async function DELETE(_req: Request, { params }: Params) {
	const { id } = await params
	return deleteOption(INVITERS_CONFIG, id)
}

/** Escape user input before using it inside a $regex. */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
