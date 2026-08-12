import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb, isMongoConfigured } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
  error:
    "Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, unknown> = {}
    if (typeof body.item === "string" && body.item.trim()) updates.item = body.item.trim()
    if (typeof body.event === "string") updates.event = body.event
    if (typeof body.category === "string") updates.category = body.category
    if (body.estimated !== undefined) updates.estimated = Number(body.estimated) || 0
    if (body.actual !== undefined) updates.actual = Number(body.actual) || 0
    if (typeof body.paid === "boolean") updates.paid = body.paid
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No changes." }, { status: 400 })
    }
    const db = await getDb()
    await db
      .collection("budget")
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
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const { id } = await params
    const db = await getDb()
    await db.collection("budget").deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error." },
      { status: 500 },
    )
  }
}
