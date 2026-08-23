export const PERMISSIONS = [
  "edit_schedule",
  "edit_checklist",
  "edit_guests",
  "view_budget",
  "edit_budget",
] as const

export type Permission = (typeof PERMISSIONS)[number]

/** Event scopes an editor can be limited to. "general" = all events. */
export const GUEST_EVENT_SCOPES = ["general", "nikah", "sanding", "tandang"] as const

export type GuestEventScope = (typeof GUEST_EVENT_SCOPES)[number]

/** A raw account record as stored in Mongo (account_permissions). */
export type AccountRecord = {
  email: string
  role: "account" | "superadmin"
  permissions: Permission[]
  /**
   * When empty/missing, an editor has full access (all events). Applies to
   * every edit permission (schedule, checklist, guests, budget).
   */
  eventScope?: GuestEventScope[]
}

export type ViewerPermissions = {
  signedIn: boolean
  email: string | null
  isSuperadmin: boolean
  permissions: Permission[]
  /**
   * Events this viewer may edit content for. Null when the viewer cannot
   * edit anything, or when an editor has full (unscoped) access.
   */
  eventScope: GuestEventScope[] | null
}

/** Normalize/validate a raw guestEventScope array from Mongo or a request. */
export const validGuestEventScope = (value: unknown): GuestEventScope[] =>
  Array.isArray(value)
    ? value.filter((scope): scope is GuestEventScope =>
        GUEST_EVENT_SCOPES.includes(scope as GuestEventScope),
      )
    : []

export const DEFAULT_SUPERADMIN_EMAILS = [
  "es.swimmer15@gmail.com",
  "eimansalleh.5@gmail.com",
  "eimansalleh.15@gmail.com",
  "nadiaazamiera99@gmail.com",
] as const
