import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requirePermission } from "@/lib/permissions"
import { getDb, isMongoConfigured } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
	error:
		"Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
	const editor = await requirePermission("edit_budget")
	if (!editor.ok) {
		return NextResponse.json({ error: editor.error }, { status: editor.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const { id } = await params
		const body = await req.json()
		const updates: Record<string, unknown> = {}
		if (typeof body.itemId === "string") updates.itemId = body.itemId
		if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim()
		if (typeof body.category === "string") updates.category = body.category
		if (body.price !== undefined) updates.price = Number(body.price) || 0
		if (body.qty !== undefined) updates.qty = Math.max(1, Math.round(Number(body.qty) || 1))
		if (body.paid !== undefined) updates.paid = Number(body.paid) || 0
		if (typeof body.paidBy === "string") updates.paidBy = body.paidBy
		if (typeof body.txnStatus === "string") updates.txnStatus = body.txnStatus
		if (typeof body.productStatus === "string") updates.productStatus = body.productStatus
		if (typeof body.notes === "string") updates.notes = body.notes
		if (typeof body.dimension === "string") updates.dimension = body.dimension
		// Recalculate totals when price/qty/paid change.
		const price = (updates.price as number) ?? body.price
		const qty = (updates.qty as number) ?? body.qty
		const paidAmt = (updates.paid as number) ?? body.paid
		if (price !== undefined || qty !== undefined) {
			updates.totalPrice = (price ?? 0) * (qty ?? 1)
		}
		if (updates.totalPrice !== undefined || paidAmt !== undefined) {
			const tp = (updates.totalPrice as number) ?? 0
			const pd = (updates.paid as number) ?? 0
			updates.balance = Math.max(0, tp - pd)
		}
		if (Object.keys(updates).length === 0) {
			return NextResponse.json({ error: "No changes." }, { status: 400 })
		}
		const db = await getDb()
		await db
			.collection("home_items")
			.updateOne({ _id: new ObjectId(id) }, { $set: updates })
		return NextResponse.json({ ok: true })
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}

export async function DELETE(_req: Request, { params }: Params) {
	const editor = await requirePermission("edit_budget")
	if (!editor.ok) {
		return NextResponse.json({ error: editor.error }, { status: editor.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const { id } = await params
		const db = await getDb()
		await db.collection("home_items").deleteOne({ _id: new ObjectId(id) })
		return NextResponse.json({ ok: true })
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}
