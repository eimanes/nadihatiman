import { NextResponse } from "next/server"
import { getDb, isMongoConfigured } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
  error:
    "Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

const EVENTS = ["nikah", "sanding", "tandang", "umum"]

const sanitizeItems = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
    : []

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const db = await getDb()
    const sections = await db
      .collection("preparation")
      .find()
      .sort({ order: 1, createdAt: 1 })
      .toArray()
    return NextResponse.json({
      sections: sections.map((s) => ({ ...s, _id: s._id.toString() })),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error." },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const body = await req.json()

    // Bulk seed support: { sections: [{ title, event, items }, ...] }
    if (Array.isArray(body.sections)) {
      const now = new Date().toISOString()
      const docs = body.sections
        .filter(
          (s: { title?: string }) =>
            typeof s.title === "string" && s.title.trim(),
        )
        .map((s: { title: string; event?: string; items?: unknown }, i: number) => ({
          title: s.title.trim(),
          event: EVENTS.includes(s.event as string) ? s.event : "sanding",
          items: sanitizeItems(s.items),
          order: i,
          createdAt: now,
        }))
      if (docs.length === 0) {
        return NextResponse.json({ error: "No valid sections." }, { status: 400 })
      }
      const db = await getDb()
      const result = await db.collection("preparation").insertMany(docs)
      const sections = docs.map((d: object, i: number) => ({
        ...d,
        _id: result.insertedIds[i].toString(),
      }))
      return NextResponse.json({ sections, inserted: sections.length }, { status: 201 })
    }

    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title) {
      return NextResponse.json({ error: "Section title is required." }, { status: 400 })
    }
    const db = await getDb()
    const count = await db.collection("preparation").countDocuments()
    const doc = {
      title,
      event: EVENTS.includes(body.event) ? body.event : "sanding",
      items: sanitizeItems(body.items),
      order: count,
      createdAt: new Date().toISOString(),
    }
    const result = await db.collection("preparation").insertOne(doc)
    return NextResponse.json(
      { section: { ...doc, _id: result.insertedId.toString() } },
      { status: 201 },
    )
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error." },
      { status: 500 },
    )
  }
}
