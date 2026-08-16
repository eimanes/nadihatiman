export const PERMISSIONS = [
  "edit_schedule",
  "edit_checklist",
  "edit_guests",
  "view_budget",
  "edit_budget",
] as const

export type Permission = (typeof PERMISSIONS)[number]

export type ViewerPermissions = {
  signedIn: boolean
  email: string | null
  isSuperadmin: boolean
  permissions: Permission[]
}

/** Bootstrap owner is always able to restore access if managed roles are changed incorrectly. */
export const BOOTSTRAP_SUPERADMIN_EMAIL = "es.swimmer15@gmail.com"
