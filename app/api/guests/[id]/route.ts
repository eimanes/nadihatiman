import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb, isMongoConfigured } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
	error:
		"Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

const EVENTS = ["nikah", "sanding", "tandang"]
const SIDES = ["bride", "groom"]
const STATUSES = ["dijemput", "disahkan", "tidak_hadir"]

export async function PATCH(
	req: Request,
	context: { params: Promise<{ id: string }> },
) {
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const { id } = await context.params
		const body = await req.json()
		const updates: Record<string, unknown> = {}
		if (typeof body.name === "string" && body.name.trim()) {
			updates.name = body.name.trim()
		}
		if (EVENTS.includes(body.event)) updates.event = body.event
		if (SIDES.includes(body.side)) updates.side = body.side
		if (body.pax !== undefined) {
			updates.pax = Math.max(1, Math.round(Number(body.pax) || 1))
		}
		if (typeof body.phone === "string") updates.phone = body.phone.trim()
		if (typeof body.note === "string") updates.note = body.note.trim()
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
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const { id } = await context.params
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
