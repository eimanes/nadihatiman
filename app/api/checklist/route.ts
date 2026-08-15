import { NextResponse } from "next/server"
import { requireEditor } from "@/lib/admin"
import { getDb, isMongoConfigured } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
  error:
    "Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const db = await getDb()
    const items = await db
      .collection("checklist")
      .find()
      .sort({ createdAt: 1 })
      .toArray()
    return NextResponse.json({
      items: items.map((i) => ({ ...i, _id: i._id.toString() })),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error." },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  const editor = await requireEditor()
  if (!editor.ok) {
    return NextResponse.json({ error: editor.error }, { status: editor.status })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const body = await req.json()

    // Bulk seed support: { items: [...] }
    if (Array.isArray(body.items)) {
      const docs = body.items
        .filter((i: { task?: string }) => typeof i.task === "string" && i.task.trim())
        .map((i: { task: string; event?: string; category?: string }) => ({
          task: i.task.trim(),
          event: i.event || "umum",
          category: i.category || "Lain-lain",
          done: false,
          createdAt: new Date().toISOString(),
        }))
      if (docs.length === 0) {
        return NextResponse.json({ error: "No valid items." }, { status: 400 })
      }
      const db = await getDb()
      await db.collection("checklist").insertMany(docs)
      return NextResponse.json({ inserted: docs.length }, { status: 201 })
    }

    const task = typeof body.task === "string" ? body.task.trim() : ""
    if (!task) {
      return NextResponse.json({ error: "Task is required." }, { status: 400 })
    }
    const doc = {
      task,
      event: body.event || "umum",
      category: body.category || "Lain-lain",
      done: false,
      createdAt: new Date().toISOString(),
    }
    const db = await getDb()
    const result = await db.collection("checklist").insertOne(doc)
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
