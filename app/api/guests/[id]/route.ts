import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireGuestEvent, getViewerPermissions } from "@/lib/permissions"
import { getDb, isMongoConfigured } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
	error:
		"Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

const EVENTS = ["nikah", "sanding", "tandang"]
const SIDES = ["bride", "groom"]
const STATUSES = ["dijemput", "disahkan", "tidak_hadir"]
const INVITATION_STATUSES = ["not_invited", "invited"]

export async function PATCH(
	req: Request,
	context: { params: Promise<{ id: string }> },
) {
	const editor = await requireGuestEvent()
	if (!editor.ok) {
		return NextResponse.json({ error: editor.error }, { status: editor.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const { id } = await context.params
		const body = await req.json()
		// Scoped editors can only touch guests of their own events. The
		// check uses the event AFTER the update so moving a guest into an
		// out-of-scope event is blocked as well.
		const db0 = await getDb()
		const existing = await db0.collection("guests").findOne({ _id: new ObjectId(id) })
		if (!existing) {
			return NextResponse.json({ error: "Guest not found." }, { status: 404 })
		}
		const nextEvent = EVENTS.includes(body.event) ? body.event : existing.event
		const scopeCheck = await requireGuestEvent(nextEvent)
		if (!scopeCheck.ok) {
			return NextResponse.json({ error: scopeCheck.error }, { status: scopeCheck.status })
		}
		const updates: Record<string, unknown> = {}
		if (typeof body.name === "string" && body.name.trim()) {
			updates.name = body.name.trim()
		}
		if (EVENTS.includes(body.event)) updates.event = body.event
		if (SIDES.includes(body.side)) updates.side = body.side
		if (body.invitedBy !== undefined) {
			updates.invitedBy =
				typeof body.invitedBy === "string" ? body.invitedBy.trim() : ""
		}
		if (body.category !== undefined) {
			updates.category =
				typeof body.category === "string" ? body.category.trim() : ""
		}
		if (body.pax !== undefined) {
			updates.pax = Math.max(1, Math.round(Number(body.pax) || 1))
		}
		if (typeof body.phone === "string") updates.phone = body.phone.trim()
		if (typeof body.note === "string") updates.note = body.note.trim()
		if (INVITATION_STATUSES.includes(body.invitationStatus)) {
			updates.invitationStatus = body.invitationStatus
		}
		if (STATUSES.includes(body.status)) updates.status = body.status
		if (Object.keys(updates).length === 0) {
			return NextResponse.json(
				{ error: "No valid changes." },
				{ status: 400 },
			)
		}
		const db = await getDb()
		await db
			.collection("guests")
			.updateOne({ _id: new ObjectId(id) }, { $set: updates })
		return NextResponse.json({ ok: true })
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}

export async function DELETE(
	_req: Request,
	context: { params: Promise<{ id: string }> },
) {
	const editor = await requireGuestEvent()
	if (!editor.ok) {
		return NextResponse.json({ error: editor.error }, { status: editor.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const { id } = await context.params
		// Scoped editors can only delete guests of their own events.
		const db0 = await getDb()
		const existing = await db0.collection("guests").findOne({ _id: new ObjectId(id) })
		if (!existing) {
			return NextResponse.json({ error: "Guest not found." }, { status: 404 })
		}
		const scopeCheck = await requireGuestEvent(existing.event)
		if (!scopeCheck.ok) {
			return NextResponse.json({ error: scopeCheck.error }, { status: scopeCheck.status })
		}
		const db = await getDb()
		await db.collection("guests").deleteOne({ _id: new ObjectId(id) })
		return NextResponse.json({ ok: true })
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}
