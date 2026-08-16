import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { PERMISSIONS, requireSuperadmin } from "@/lib/permissions"
import { DEFAULT_SUPERADMIN_EMAILS } from "@/lib/permission-types"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const superadmin = await requireSuperadmin()
  if (!superadmin.ok) {
    return NextResponse.json({ error: superadmin.error }, { status: superadmin.status })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 503 })
  }
  const body = await req.json()
  const permissions = Array.isArray(body.permissions)
    ? body.permissions.filter((permission: unknown) =>
        PERMISSIONS.includes(permission as (typeof PERMISSIONS)[number]),
      )
    : []
  const { id } = await params
  const db = await getDb()
  const existing = await db.collection("account_permissions").findOne({ _id: new ObjectId(id) })
  if (!existing) return NextResponse.json({ error: "Account not found." }, { status: 404 })
  const role = body.role === "superadmin" ? "superadmin" : "account"
  if (DEFAULT_SUPERADMIN_EMAILS.includes(existing.email as (typeof DEFAULT_SUPERADMIN_EMAILS)[number]) && role !== "superadmin") {
    return NextResponse.json({ error: "A default superadmin cannot be demoted." }, { status: 400 })
  }
  if (existing.role === "superadmin" && role !== "superadmin") {
    const count = await db.collection("account_permissions").countDocuments({ role: "superadmin" })
    if (count <= 1) return NextResponse.json({ error: "Keep at least one managed superadmin." }, { status: 400 })
  }
  await db.collection("account_permissions").updateOne(
    { _id: new ObjectId(id) },
    { $set: { permissions, role, updatedAt: new Date().toISOString(), updatedBy: superadmin.viewer.email } },
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: Params) {
  const superadmin = await requireSuperadmin()
  if (!superadmin.ok) {
    return NextResponse.json({ error: superadmin.error }, { status: superadmin.status })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 503 })
  }
  const { id } = await params
  const db = await getDb()
  const existing = await db.collection("account_permissions").findOne({ _id: new ObjectId(id) })
  if (!existing) return NextResponse.json({ error: "Account not found." }, { status: 404 })
  if (DEFAULT_SUPERADMIN_EMAILS.includes(existing.email as (typeof DEFAULT_SUPERADMIN_EMAILS)[number])) {
    return NextResponse.json({ error: "A default superadmin cannot be removed." }, { status: 400 })
  }
  if (existing.role === "superadmin") {
    const count = await db.collection("account_permissions").countDocuments({ role: "superadmin" })
    if (count <= 1) return NextResponse.json({ error: "Keep at least one managed superadmin." }, { status: 400 })
  }
  await db.collection("account_permissions").deleteOne({ _id: new ObjectId(id) })
  return NextResponse.json({ ok: true })
}