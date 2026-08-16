import { NextResponse } from "next/server"
import { defaultHomeContent, isHomeContent } from "@/lib/home-content"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { requirePermission } from "@/lib/permissions"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!isMongoConfigured()) return NextResponse.json({ content: defaultHomeContent })
  try {
    const db = await getDb()
    const doc = await db.collection("site_content").findOne({ key: "home" })
    return NextResponse.json({ content: isHomeContent(doc?.content) ? doc.content : defaultHomeContent })
  } catch {
    return NextResponse.json({ content: defaultHomeContent })
  }
}

export async function PUT(req: Request) {
  const editor = await requirePermission("edit_schedule")
  if (!editor.ok) return NextResponse.json({ error: editor.error }, { status: editor.status })
  if (!isMongoConfigured()) return NextResponse.json({ error: "Storage is not configured." }, { status: 503 })
  const body = await req.json()
  if (!isHomeContent(body.content)) return NextResponse.json({ error: "Invalid home content." }, { status: 400 })
  const db = await getDb()
  await db.collection("site_content").updateOne(
    { key: "home" },
    { $set: { key: "home", content: body.content, updatedAt: new Date().toISOString() } },
    { upsert: true },
  )
  return NextResponse.json({ ok: true })
}
