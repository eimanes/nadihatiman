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

/** Default owners always retain full access; further superadmins can be managed in Other accounts. */
export const DEFAULT_SUPERADMIN_EMAILS = [
  "es.swimmer15@gmail.com",
  "eimansalleh.5@gmail.com",
  "eimansalleh.15@gmail.com",
  "nadiaazamiera99@gmail.com",
] as const
