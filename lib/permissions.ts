import { auth, currentUser } from "@clerk/nextjs/server"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import {
  GUEST_EVENT_SCOPES,
  PERMISSIONS,
  validGuestEventScope,
  type GuestEventScope,
  type Permission,
  type ViewerPermissions,
} from "@/lib/permission-types"

export {
  GUEST_EVENT_SCOPES,
  PERMISSIONS,
  validGuestEventScope,
  type GuestEventScope,
  type Permission,
  type ViewerPermissions,
} from "@/lib/permission-types"

const ALL_PERMISSIONS = [...PERMISSIONS]

const validPermissions = (value: unknown): Permission[] =>
  Array.isArray(value)
    ? value.filter((permission): permission is Permission =>
        PERMISSIONS.includes(permission as Permission),
      )
    : []

export async function getViewerPermissions(): Promise<ViewerPermissions> {
  const { userId } = await auth()
  if (!userId) {
    return { signedIn: false, email: null, isSuperadmin: false, permissions: [], eventScope: null }
  }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null
  if (!email) {
    return { signedIn: true, email: null, isSuperadmin: false, permissions: [], eventScope: null }
  }
  if (!isMongoConfigured()) {
    return { signedIn: true, email, isSuperadmin: false, permissions: [], eventScope: null }
  }

  const db = await getDb()
  // Superadmin status comes from the DB (bootstrap accounts are seeded there).
  const account = await db.collection("account_permissions").findOne({ email })
  if (account?.role === "superadmin") {
    return { signedIn: true, email, isSuperadmin: true, permissions: ALL_PERMISSIONS, eventScope: null }
  }
  const permissions = validPermissions(account?.permissions)
  // Scope applies to any editor permission; a missing/empty scope keeps
  // the legacy behaviour (full access to all events).
  const rawScope = validGuestEventScope(account?.eventScope)
  const eventScope =
    permissions.length > 0 && rawScope.length > 0 ? rawScope : null
  return {
    signedIn: true,
    email,
    isSuperadmin: false,
    permissions,
    eventScope,
  }
}

/**
 * Guard for guest mutations scoped to an event ("nikah" | "sanding" |
 * "tandang"; checklist also allows "umum"). Pass no event for
 * manager-level actions (import, inviters, categories). Null scope
 * (unscoped editor or superadmin) allows any event; a scope containing
 * "general" likewise grants all events.
 */
export async function requireGuestEvent(event?: string) {
  const viewer = await getViewerPermissions()
  if (!viewer.signedIn) {
    return { ok: false as const, status: 401 as const, error: "Sign in is required to make changes." }
  }
  if (!viewer.permissions.includes("edit_guests") && !viewer.isSuperadmin) {
    return { ok: false as const, status: 403 as const, error: "This account does not have permission for this action." }
  }
  if (
    event &&
    viewer.eventScope &&
    !viewer.eventScope.includes("general") &&
    !viewer.eventScope.includes(event as GuestEventScope)
  ) {
    return {
      ok: false as const,
      status: 403 as const,
      error: `This account can only edit guests for: ${viewer.eventScope.join(", ")}.`,
    }
  }
  return { ok: true as const, viewer }
}

/**
 * Generic scoped guard — same rules as requireGuestEvent but for any
 * module permission (edit_schedule, edit_checklist, edit_budget, …).
 * `event` may be any string the module uses (checklist adds "umum");
 * out-of-scope events get a module-specific error message.
 */
export async function requireScoped(
  permission: Permission,
  moduleLabel: string,
  event?: string,
) {
  const viewer = await getViewerPermissions()
  if (!viewer.signedIn) {
    return { ok: false as const, status: 401 as const, error: "Sign in is required to make changes." }
  }
  if (!viewer.permissions.includes(permission) && !viewer.isSuperadmin) {
    return { ok: false as const, status: 403 as const, error: "This account does not have permission for this action." }
  }
  if (
    event &&
    viewer.eventScope &&
    !viewer.eventScope.includes("general") &&
    !viewer.eventScope.includes(event as GuestEventScope)
  ) {
    return {
      ok: false as const,
      status: 403 as const,
      error: `This account can only edit ${moduleLabel} for: ${viewer.eventScope.join(", ")}.`,
    }
  }
  return { ok: true as const, viewer }
}

export async function requirePermission(permission: Permission) {
  const viewer = await getViewerPermissions()
  if (!viewer.signedIn) {
    return { ok: false as const, status: 401 as const, error: "Sign in is required to make changes." }
  }
  if (!viewer.permissions.includes(permission)) {
    return { ok: false as const, status: 403 as const, error: "This account does not have permission for this action." }
  }
  return { ok: true as const, viewer }
}

export async function requireAnyPermission(permissions: Permission[]) {
  const viewer = await getViewerPermissions()
  if (!viewer.signedIn) {
    return { ok: false as const, status: 401 as const, error: "Sign in is required to make changes." }
  }
  if (!permissions.some((permission) => viewer.permissions.includes(permission))) {
    return { ok: false as const, status: 403 as const, error: "This account does not have permission for this action." }
  }
  return { ok: true as const, viewer }
}

export async function requireSuperadmin() {
  const viewer = await getViewerPermissions()
  if (!viewer.signedIn) {
    return { ok: false as const, status: 401 as const, error: "Sign in is required." }
  }
  if (!viewer.isSuperadmin) {
    return { ok: false as const, status: 403 as const, error: "Only superadmins can manage accounts." }
  }
  return { ok: true as const, viewer }
}
