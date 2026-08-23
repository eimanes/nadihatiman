import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { PERMISSIONS, requireSuperadmin, validGuestEventScope } from "@/lib/permissions"

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
  if (existing.bootstrap === true && role !== "superadmin") {
    return NextResponse.json({ error: "A bootstrap superadmin cannot be demoted." }, { status: 400 })
  }
  if (existing.role === "superadmin" && role !== "superadmin") {
    const count = await db.collection("account_permissions").countDocuments({ role: "superadmin" })
    if (count <= 1) return NextResponse.json({ error: "Keep at least one managed superadmin." }, { status: 400 })
  }
  // Event scope applies to ANY editor permission (schedule, checklist,
  // guests, budget); an unchecked editor keeps full access (legacy
  // behaviour), superadmins are never scoped.
  const scope = validGuestEventScope(body.eventScope)
  const eventScope =
    role === "account" && permissions.length > 0 && scope.length > 0
      ? scope
      : null
  await db.collection("account_permissions").updateOne(
    { _id: new ObjectId(id) },
    { $set: { permissions, role, eventScope, updatedAt: new Date().toISOString(), updatedBy: superadmin.viewer.email } },
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
  if (existing.bootstrap === true) {
    return NextResponse.json({ error: "A bootstrap superadmin cannot be removed." }, { status: 400 })
  }
  if (existing.role === "superadmin") {
    const count = await db.collection("account_permissions").countDocuments({ role: "superadmin" })
    if (count <= 1) return NextResponse.json({ error: "Keep at least one managed superadmin." }, { status: 400 })
  }
  await db.collection("account_permissions").deleteOne({ _id: new ObjectId(id) })
  return NextResponse.json({ ok: true })
}