import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/permissions"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { BUDGET_SEED } from "@/lib/budget-seed"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
	error:
		"Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

/**
 * Budget list — stored in MongoDB (collection "budget").
 * Seeded from the couple's Excel on first load if the collection is empty.
 * Each item: { item, event, category, vendor, estimated, paid, balance,
 * date, paidBy, notes, createdAt }.
 */

/** Insert missing event seeds the first time they're loaded. */
async function seedIfEmpty() {
	if (!isMongoConfigured()) return
	const db = await getDb()
	const col = db.collection("budget")
	const existing = new Set(
		await col.distinct("event"),
	)
	const now = new Date().toISOString()
	for (const event of ["sanding", "tandang"]) {
		if (existing.has(event)) continue
		const rows = BUDGET_SEED.filter((b) => b.event === event)
		if (rows.length > 0) {
			await col.insertMany(rows.map((b) => ({ ...b, createdAt: now })))
		}
	}
}

export async function GET() {
	const viewer = await requirePermission("view_budget")
	if (!viewer.ok) {
		return NextResponse.json({ error: viewer.error }, { status: viewer.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json({ items: [], seeded: false })
	}
	try {
		await seedIfEmpty()
		const db = await getDb()
		const docs = await db
			.collection("budget")
			.find({})
			.sort({ createdAt: 1 })
			.toArray()
		return NextResponse.json({
			items: docs.map((d) => ({ ...d, _id: d._id.toString() })),
			seeded: true,
		})
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}

export async function POST(req: Request) {
	const editor = await requirePermission("edit_budget")
	if (!editor.ok) {
		return NextResponse.json({ error: editor.error }, { status: editor.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const body = await req.json()
		const item = typeof body.item === "string" ? body.item.trim() : ""
		if (!item) {
			return NextResponse.json(
				{ error: "Item name is required." },
				{ status: 400 },
			)
		}
		const doc = {
			item,
			event: typeof body.event === "string" ? body.event : "sanding",
			category: typeof body.category === "string" ? body.category.trim() : "",
			vendor: typeof body.vendor === "string" ? body.vendor.trim() : "",
			estimated: Math.max(0, Number(body.estimated) || 0),
			paid: Math.max(0, Number(body.paid) || 0),
			balance: Math.max(0, Number(body.balance) || 0),
			date: typeof body.date === "string" ? body.date.trim() : "",
			paidBy: typeof body.paidBy === "string" ? body.paidBy.trim() : "",
			notes: typeof body.notes === "string" ? body.notes.trim() : "",
			createdAt: new Date().toISOString(),
		}
		const db = await getDb()
		const result = await db.collection("budget").insertOne(doc)
		return NextResponse.json(
			{ item: { ...doc, _id: result.insertedId.toString() } },
			{ status: 201 },
		)
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}

/** DELETE — clear all budget items and reseed from the defaults. */
export async function DELETE() {
	const editor = await requirePermission("edit_budget")
	if (!editor.ok) {
		return NextResponse.json({ error: editor.error }, { status: editor.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const db = await getDb()
		await db.collection("budget").deleteMany({})
		const now = new Date().toISOString()
		await db.collection("budget").insertMany(
			BUDGET_SEED.map((b) => ({ ...b, createdAt: now })),
		)
		const docs = await db
			.collection("budget")
			.find({})
			.sort({ createdAt: 1 })
			.toArray()
		return NextResponse.json({
			items: docs.map((d) => ({ ...d, _id: d._id.toString() })),
			reseeded: docs.length,
		})
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}
