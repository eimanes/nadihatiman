import { NextResponse } from "next/server"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import {
  GUEST_EVENT_SCOPES,
  PERMISSIONS,
  requireSuperadmin,
  validGuestEventScope,
} from "@/lib/permissions"
import { isEmailConfigured, sendWelcomeEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

const PERMISSION_LABELS: Record<string, string> = {
  edit_schedule: "Edit schedule",
  edit_checklist: "Edit checklist",
  edit_guests: "Edit guests",
  view_budget: "View budget",
  edit_budget: "Edit budget",
}

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
    guestEventScopes: GUEST_EVENT_SCOPES,
  })}

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
  // Event scope applies to ANY editor permission (schedule, checklist,
  // guests, budget). Unchecked → null keeps the legacy behaviour (all
  // events); superadmins are never scoped.
  const scope = validGuestEventScope(body.eventScope)
  const eventScope =
    role === "account" && permissions.length > 0 && scope.length > 0
      ? scope
      : null
  const db = await getDb()
  // Reject duplicates — the add form is for new accounts; edits go through PATCH.
  const existing = await db.collection("account_permissions").findOne({ email })
  if (existing) {
    return NextResponse.json(
      { error: `The account "${email}" already exists.` },
      { status: 409 },
    )
  }
  const result = await db.collection("account_permissions").updateOne(
    { email },
    {
      $set: {
        email,
        permissions,
        role,
        eventScope,
        updatedAt: new Date().toISOString(),
        updatedBy: superadmin.viewer.email,
      },
      $setOnInsert: { createdAt: new Date().toISOString() },
    },
    { upsert: true },
  )

  // Send the welcome email only for a brand-new account (not a re-save).
  // Email failures never block the account from being created.
  let emailSent = false
  if (result.upsertedCount > 0 && isEmailConfigured()) {
    try {
      const access =
        role === "superadmin"
          ? "Full access (all modules)"
          : permissions.length > 0
            ? permissions.map((p: string) => PERMISSION_LABELS[p] ?? p).join(", ")
            : "View only"
      await sendWelcomeEmail({ email, access, role })
      emailSent = true
    } catch {
      emailSent = false
    }
  }
  return NextResponse.json({ ok: true, emailSent })
}