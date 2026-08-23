import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/permissions"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { HOME_MERIDIN_SEED } from "@/lib/home-meridin-seed"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
	error:
		"Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

/**
 * Home Meridin — furniture & appliance budget, stored in MongoDB
 * (collection "home_items"). Seeded from the couple's Excel on first load.
 */

async function seedIfEmpty() {
	if (!isMongoConfigured()) return
	const db = await getDb()
	const count = await db.collection("home_items").countDocuments()
	if (count > 0) return
	const now = new Date().toISOString()
	await db.collection("home_items").insertMany(
		HOME_MERIDIN_SEED.map((b) => ({ ...b, createdAt: now })),
	)
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
			.collection("home_items")
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
		const name = typeof body.name === "string" ? body.name.trim() : ""
		if (!name) {
			return NextResponse.json(
				{ error: "Item name is required." },
				{ status: 400 },
			)
		}
		const qty = Math.max(1, Math.round(Number(body.qty) || 1))
		const price = Math.max(0, Number(body.price) || 0)
		const paid = Math.max(0, Number(body.paid) || 0)
		const totalPrice = price * qty
		const doc = {
			itemId: typeof body.itemId === "string" ? body.itemId.trim() : "",
			name,
			category: typeof body.category === "string" ? body.category.trim() : "Other",
			price,
			qty,
			totalPrice,
			paid,
			balance: Math.max(0, totalPrice - paid),
			paidBy: typeof body.paidBy === "string" ? body.paidBy.trim() : "",
			txnStatus: typeof body.txnStatus === "string" ? body.txnStatus.trim() : "",
			productStatus: typeof body.productStatus === "string" ? body.productStatus.trim() : "",
			notes: typeof body.notes === "string" ? body.notes.trim() : "",
			dimension: typeof body.dimension === "string" ? body.dimension.trim() : "",
			createdAt: new Date().toISOString(),
		}
		const db = await getDb()
		const result = await db.collection("home_items").insertOne(doc)
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
