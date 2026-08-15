import { NextResponse } from "next/server"
import { requireEditor } from "@/lib/admin"
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
  const editor = await requireEditor()
  if (!editor.ok) {
    return NextResponse.json({ error: editor.error }, { status: editor.status })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 })
  }
  try {
    const body = await req.json()
    const { events, invitations, guestlists } = body
    if (
      !Array.isArray(events) ||
      !Array.isArray(invitations) ||
      !Array.isArray(guestlists)
    ) {
      return NextResponse.json(
        { error: "Invalid format: events, invitations and guestlists are required." },
        { status: 400 },
      )
    }
    const db = await getDb()
    await db.collection("settings").updateOne(
      { key: "site" },
      {
        $set: {
          events,
          invitations,
          guestlists,
          updatedAt: new Date().toISOString(),
        },
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
