import { auth, currentUser } from "@clerk/nextjs/server"

export const ADMIN_EMAILS = new Set([
  "es.swimmer15@gmail.com",
  "eimansalleh.5@gmail.com",
  "eimansalleh.15@gmail.com",
  "nadiaazamiera99@gmail.com",
])

export type AuthorizationResult =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Require a signed-in Clerk user whose verified email is on the editor allowlist.
 * Used by route handlers so protected writes cannot be bypassed from the browser.
 */
export async function requireEditor(): Promise<AuthorizationResult> {
  const { userId } = await auth()
  if (!userId) {
    return { ok: false, status: 401, error: "Sign in is required to make changes." }
  }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
  if (!email || !ADMIN_EMAILS.has(email)) {
    return {
      ok: false,
      status: 403,
      error: "This Google account is not allowed to edit this planner.",
    }
  }

  return { ok: true, email }
}
