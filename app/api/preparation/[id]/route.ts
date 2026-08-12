import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb, isMongoConfigured } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
  error:
    "Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

const EVENTS = ["nikah", "sanding", "tandang", "umum"]

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, unknown> = {}
    if (typeof body.title === "string" && body.title.trim()) {
      updates.title = body.title.trim()
    }
    if (EVENTS.includes(body.event)) updates.event = body.event
    if (Array.isArray(body.items)) {
      updates.items = body.items
        .map((s: unknown) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
    }
    if (typeof body.order === "number") updates.order = body.order
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No changes." }, { status: 400 })
    }
    const db = await getDb()
    await db
      .collection("preparation")
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
    await db.collection("preparation").deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error." },
      { status: 500 },
    )
  }
}
