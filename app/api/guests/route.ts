import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/permissions"
import { getDb, isMongoConfigured } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
	error:
		"Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

const EVENTS = ["nikah", "sanding", "tandang"]
const SIDES = ["bride", "groom"]
const STATUSES = ["dijemput", "disahkan", "tidak_hadir"]

export async function GET() {
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const db = await getDb()
		const guests = await db
			.collection("guests")
			.find({})
			.sort({ createdAt: 1 })
			.toArray()
		return NextResponse.json({
			guests: guests.map((g) => ({ ...g, _id: g._id.toString() })),
		})
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}

export async function POST(req: Request) {
	const editor = await requirePermission("edit_guests")
	if (!editor.ok) {
		return NextResponse.json({ error: editor.error }, { status: editor.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const body = await req.json()

		// Bulk import support (e.g. guest data exported from Canva as CSV):
		// { guests: [{ name, event, side, pax, phone, note, status }, ...] }
		if (Array.isArray(body.guests)) {
			const now = new Date().toISOString()
			const docs = body.guests
				.map((g: Record<string, unknown>) => ({
					name: typeof g.name === "string" ? g.name.trim() : "",
					event: EVENTS.includes(g.event as string) ? g.event : "sanding",
					side: SIDES.includes(g.side as string) ? g.side : "groom",
					pax: Math.max(1, Math.round(Number(g.pax) || 1)),
					phone: typeof g.phone === "string" ? g.phone.trim() : "",
					note: typeof g.note === "string" ? g.note.trim() : "",
					status: STATUSES.includes(g.status as string)
						? g.status
						: "dijemput",
					createdAt: now,
				}))
				.filter((g: { name: string }) => g.name)
			if (docs.length === 0) {
				return NextResponse.json(
					{ error: "No valid guests to import." },
					{ status: 400 },
				)
			}
			const db = await getDb()
			const result = await db.collection("guests").insertMany(docs)
			const guests = docs.map((d: object, i: number) => ({
				...d,
				_id: result.insertedIds[i].toString(),
			}))
			return NextResponse.json({ guests, inserted: guests.length }, { status: 201 })
		}

		const name = typeof body.name === "string" ? body.name.trim() : ""
		if (!name) {
			return NextResponse.json(
				{ error: "Guest name is required." },
				{ status: 400 },
			)
		}
		const doc = {
			name,
			event: EVENTS.includes(body.event) ? body.event : "sanding",
			side: SIDES.includes(body.side) ? body.side : "groom",
			pax: Math.max(1, Math.round(Number(body.pax) || 1)),
			phone: typeof body.phone === "string" ? body.phone.trim() : "",
			note: typeof body.note === "string" ? body.note.trim() : "",
			status: STATUSES.includes(body.status) ? body.status : "dijemput",
			createdAt: new Date().toISOString(),
		}
		const db = await getDb()
		const result = await db.collection("guests").insertOne(doc)
		return NextResponse.json(
			{ guest: { ...doc, _id: result.insertedId.toString() } },
			{ status: 201 },
		)
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}
