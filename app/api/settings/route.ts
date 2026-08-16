import { NextResponse } from "next/server"
import { requireAnyPermission } from "@/lib/permissions"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { loadSettings } from "@/lib/settings"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED = {
  error:
    "Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

export async function GET() {
  const result = await loadSettings()
  return NextResponse.json(result)
}

export async function PUT(req: Request) {
  const editor = await requireAnyPermission(["edit_schedule", "edit_budget"])
  if (!editor.ok) {
    return NextResponse.json({ error: editor.error }, { status: editor.status })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const body = await req.json()
    const canEditSchedule = editor.viewer.permissions.includes("edit_schedule")
    const canEditBudget = editor.viewer.permissions.includes("edit_budget")
    const { events, invitations, guestlists, budgetSheetUrl } = body
    if (canEditSchedule && (!Array.isArray(events) || !Array.isArray(invitations) || !Array.isArray(guestlists))) {
      return NextResponse.json(
        { error: "Invalid format: events, invitations and guestlists are required." },
        { status: 400 },
      )
    }
    if (canEditBudget && budgetSheetUrl !== undefined && typeof budgetSheetUrl !== "string") {
      return NextResponse.json({ error: "Invalid budget sheet URL." }, { status: 400 })
    }
    const db = await getDb()
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (canEditSchedule) Object.assign(updates, { events, invitations, guestlists })
    if (canEditBudget && typeof budgetSheetUrl === "string") updates.budgetSheetUrl = budgetSheetUrl.trim()
    await db.collection("settings").updateOne(
      { key: "site" },
      {
        $set: updates,
      },
      { upsert: true },
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error." },
      { status: 500 },
    )
  }
}
