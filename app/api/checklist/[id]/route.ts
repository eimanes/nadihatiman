import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireScoped } from "@/lib/permissions"
import { getDb, isMongoConfigured } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
  error:
    "Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const editor = await requireScoped("edit_checklist", "the checklist")
  if (!editor.ok) {
    return NextResponse.json({ error: editor.error }, { status: editor.status })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    // Scoped editors can only touch tasks of their own events; the check
    // uses the event AFTER the update so moving a task out of scope is
    // blocked as well.
    const db0 = await getDb()
    const existing = await db0.collection("checklist").findOne({ _id: new ObjectId(id) })
    if (!existing) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 })
    }
    const nextEvent =
      typeof body.event === "string"
        ? body.event === "umum" || !body.event
          ? "general"
          : body.event
        : existing.event === "umum"
          ? "general"
          : existing.event
    const scopeCheck = await requireScoped("edit_checklist", "the checklist", nextEvent)
    if (!scopeCheck.ok) {
      return NextResponse.json({ error: scopeCheck.error }, { status: scopeCheck.status })
    }
    const updates: Record<string, unknown> = {}
    if (typeof body.done === "boolean") updates.done = body.done
    if (typeof body.task === "string" && body.task.trim()) updates.task = body.task.trim()
    if (typeof body.event === "string") updates.event = body.event
    if (typeof body.category === "string") updates.category = body.category
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No changes." }, { status: 400 })
    }
    const db = await getDb()
    await db
      .collection("checklist")
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
  const editor = await requireScoped("edit_checklist", "the checklist")
  if (!editor.ok) {
    return NextResponse.json({ error: editor.error }, { status: editor.status })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const { id } = await params
    // Scoped editors can only delete tasks of their own events.
    const db0 = await getDb()
    const existing = await db0.collection("checklist").findOne({ _id: new ObjectId(id) })
    if (!existing) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 })
    }
    const scopeCheck = await requireScoped(
      "edit_checklist",
      "the checklist",
      existing.event === "umum" ? "general" : existing.event,
    )
    if (!scopeCheck.ok) {
      return NextResponse.json({ error: scopeCheck.error }, { status: scopeCheck.status })
    }
    const db = await getDb()
    await db.collection("checklist").deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error." },
      { status: 500 },
    )
  }
}
