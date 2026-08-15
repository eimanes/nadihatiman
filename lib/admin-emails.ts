export const ADMIN_EMAILS = [
  "es.swimmer15@gmail.com",
  "eimansalleh.5@gmail.com",
  "eimansalleh.15@gmail.com",
  "nadiaazamiera99@gmail.com",
] as const

export const isEditorEmail = (email?: string | null) =>
  Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase() as (typeof ADMIN_EMAILS)[number]))
