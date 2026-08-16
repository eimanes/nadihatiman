import { NextResponse } from "next/server"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { PERMISSIONS, requireSuperadmin } from "@/lib/permissions"

export const dynamic = "force-dynamic"

export async function GET() {
  const superadmin = await requireSuperadmin()
  if (!superadmin.ok) {
    return NextResponse.json({ error: superadmin.error }, { status: superadmin.status })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 503 })
  }
  const db = await getDb()
  const accounts = await db
    .collection("account_permissions")
    .find({})
    .sort({ email: 1 })
    .toArray()
  return NextResponse.json({
    accounts: accounts.map((account) => ({ ...account, _id: account._id.toString() })),
    permissions: PERMISSIONS,
    defaultSuperadmins: ["es.swimmer15@gmail.com", "eimansalleh.5@gmail.com", "eimansalleh.15@gmail.com", "nadiaazamiera99@gmail.com"],
  })
}

export async function POST(req: Request) {
  const superadmin = await requireSuperadmin()
  if (!superadmin.ok) {
    return NextResponse.json({ error: superadmin.error }, { status: superadmin.status })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 503 })
  }
  const body = await req.json()
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  }
  const permissions = Array.isArray(body.permissions)
    ? body.permissions.filter((permission: unknown) =>
        PERMISSIONS.includes(permission as (typeof PERMISSIONS)[number]),
      )
    : []
  const role = body.role === "superadmin" ? "superadmin" : "account"
  const db = await getDb()
  await db.collection("account_permissions").updateOne(
    { email },
    {
      $set: {
        email,
        permissions,
        role,
        updatedAt: new Date().toISOString(),
        updatedBy: superadmin.viewer.email,
      },
      $setOnInsert: { createdAt: new Date().toISOString() },
    },
    { upsert: true },
  )
  return NextResponse.json({ ok: true })
}