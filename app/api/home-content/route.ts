import { NextResponse } from "next/server"
import { defaultHomeContent, isHomeContent } from "@/lib/home-content"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { requirePermission } from "@/lib/permissions"

export const dynamic = "force-dynamic"

export async function GET() {
  // Serve from the browser cache first (stale-while-revalidate): repeat
  // visits paint instantly, then the fetch above refreshes the cache. The
  // Cloudinary media URLs it carries are effectively immutable, so a short
  // max-age with revalidation keeps content edits visible quickly.
  const headers = {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
  }
  if (!isMongoConfigured()) return NextResponse.json({ content: defaultHomeContent }, { headers })
  try {
    const db = await getDb()
    const doc = await db.collection("site_content").findOne({ key: "home" })
    return NextResponse.json(
      { content: isHomeContent(doc?.content) ? doc.content : defaultHomeContent },
      { headers },
    )
  } catch {
    return NextResponse.json({ content: defaultHomeContent }, { headers })
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
