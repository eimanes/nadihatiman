import { auth, currentUser } from "@clerk/nextjs/server"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { DEFAULT_SUPERADMIN_EMAILS, PERMISSIONS, type Permission, type ViewerPermissions } from "@/lib/permission-types"

export { PERMISSIONS, type Permission, type ViewerPermissions } from "@/lib/permission-types"

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
    return { signedIn: false, email: null, isSuperadmin: false, permissions: [] }
  }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null
  if (!email) {
    return { signedIn: true, email: null, isSuperadmin: false, permissions: [] }
  }
  if (DEFAULT_SUPERADMIN_EMAILS.includes(email as (typeof DEFAULT_SUPERADMIN_EMAILS)[number])) {
    return { signedIn: true, email, isSuperadmin: true, permissions: ALL_PERMISSIONS }
  }
  if (!isMongoConfigured()) {
    return { signedIn: true, email, isSuperadmin: false, permissions: [] }
  }

  const db = await getDb()
  const account = await db.collection("account_permissions").findOne({ email })
  if (account?.role === "superadmin") {
    return { signedIn: true, email, isSuperadmin: true, permissions: ALL_PERMISSIONS }
  }
  return {
    signedIn: true,
    email,
    isSuperadmin: false,
    permissions: validPermissions(account?.permissions),
  }
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
