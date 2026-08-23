import { NextResponse } from "next/server"
import { requireScoped } from "@/lib/permissions"
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
  const editor = await requireScoped("edit_checklist", "the checklist")
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
      // Scoped editors may only seed their own events ("umum" needs "general").
      const scope = editor.viewer.eventScope
      if (scope && !scope.includes("general")) {
        const blocked = body.items.filter(
          (i: { event?: string }) => i.event && i.event !== "umum" && !scope.includes(i.event as never),
        )
        const blockedUmum = body.items.some((i: { event?: string }) => (i.event ?? "umum") === "umum")
        if (blocked.length > 0 || blockedUmum) {
          return NextResponse.json(
            {
              error: `You can only seed the checklist for: ${scope.join(", ")}. Remove tasks of other events first.`,
            },
            { status: 403 },
          )
        }
      }
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
    // Scoped editors can only add tasks to their own events (umum → general).
    const scopeCheck = await requireScoped(
      "edit_checklist",
      "the checklist",
      body.event === "umum" ? "general" : body.event || "umum",
    )
    if (!scopeCheck.ok) {
      return NextResponse.json({ error: scopeCheck.error }, { status: scopeCheck.status })
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
