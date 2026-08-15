import { currentUser } from "@clerk/nextjs/server"
import { isEditorEmail } from "@/lib/admin-emails"

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress

  if (!isEditorEmail(email)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-24">
        <section className="max-w-md rounded-2xl border border-gold/50 bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
            Access restricted
          </p>
          <h1 className="mt-3 font-serif text-3xl text-ink">
            This account cannot edit the planner
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            Sign in with one of the approved Google accounts to edit the
            schedule, invitations, guestlist settings, and budget source.
          </p>
        </section>
      </main>
    )
  }

  return children
}
