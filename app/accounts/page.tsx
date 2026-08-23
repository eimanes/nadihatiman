"use client"

import { useCallback, useEffect, useState } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import {
  DEFAULT_SUPERADMIN_EMAILS,
  GUEST_EVENT_SCOPES,
  PERMISSIONS,
  type AccountRecord,
  type GuestEventScope,
  type Permission,
} from "@/lib/permission-types"

const LABELS: Record<Permission, string> = {
  edit_schedule: "Edit schedule",
  edit_checklist: "Edit checklist",
  edit_guests: "Edit guests & add guests",
  view_budget: "View budget",
  edit_budget: "Edit budget",
}

const SCOPE_LABELS: Record<GuestEventScope, string> = {
  general: "General (all events)",
  nikah: "💍 Nikah",
  sanding: "🌸 Sanding",
  tandang: "🏡 Tandang",
}

type Account = AccountRecord & { _id: string }

export default function AccountsPage() {
  const { isSuperadmin, loaded } = usePermissions()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [email, setEmail] = useState("")
  const [selected, setSelected] = useState<Permission[]>([])
  const [role, setRole] = useState<"account" | "superadmin">("account")
  const [eventScope, setEventScope] = useState<GuestEventScope[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const response = await fetch("/api/accounts", { cache: "no-store" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? "Could not load accounts.")
    setAccounts(data.accounts)
  }, [])

  useEffect(() => {
    if (!isSuperadmin) return
    load().catch((e) => setError(e instanceof Error ? e.message : "Could not load accounts."))
  }, [isSuperadmin, load])

  const toggle = (permission: Permission) =>
    setSelected((current) =>
      current.includes(permission)
        ? current.filter((value) => value !== permission)
        : [...current, permission],
    )

  const toggleScope = (scope: GuestEventScope) =>
    setEventScope((current) =>
      current.includes(scope)
        ? current.filter((value) => value !== scope)
        : [...current, scope],
    )

  const hasEditPermission = (permissions: Permission[]) =>
    permissions.some((p) => p.startsWith("edit_"))

  // Send the scope only when it applies; the API keeps full access when
  // an editor has no scopes checked.
  const scopeFor = (permissions: Permission[], scopes: GuestEventScope[] | null | undefined) =>
    hasEditPermission(permissions) && scopes && scopes.length > 0 ? scopes : null

  const addAccount = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim() || saving) return
    setSaving(true)
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, permissions: selected, role, eventScope: scopeFor(selected, eventScope) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Could not save account.")
      setEmail("")
      setSelected([])
      setRole("account")
      setEventScope([])
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save account.")
    } finally {
      setSaving(false)
    }
  }

  const updateAccount = async (account: Account, patch: Partial<Account>) => {
    setAccounts((current) => current.map((item) => item._id === account._id ? { ...item, ...patch } : item))
    const response = await fetch(`/api/accounts/${account._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permissions: patch.permissions ?? account.permissions,
        role: patch.role ?? account.role ?? "account",
        eventScope: patch.eventScope !== undefined
          ? scopeFor(patch.permissions ?? account.permissions, patch.eventScope)
          : scopeFor(account.permissions, account.eventScope),
      }),
    })
    if (!response.ok) {
      const data = await response.json()
      setError(data.error ?? "Could not update permissions.")
      await load()
    }
  }

  const removeAccount = async (account: Account) => {
    setAccounts((current) => current.filter((item) => item._id !== account._id))
    const response = await fetch(`/api/accounts/${account._id}`, { method: "DELETE" })
    if (!response.ok) {
      const data = await response.json()
      setError(data.error ?? "Could not remove account.")
      await load()
    }
  }

  if (!loaded) return <p className="py-24 text-center text-muted">Loading…</p>
  if (!isSuperadmin) return null

  return (
    <div className="mx-auto max-w-[900px] px-5 pb-20 pt-24">
      <header className="py-10 text-center">
        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">Accounts</p>
        <h1 className="font-serif text-4xl text-ink">Other accounts</h1>
        <p className="mx-auto mt-3 max-w-[580px] text-[14px] leading-relaxed text-muted">
          Add Google accounts and decide exactly what they can do. The four
          superadmin accounts always retain full access.
        </p>
      </header>

      {error && <p className="mb-5 rounded-xl bg-[#FBEFEE] px-4 py-3 text-[13px] text-[#A0524B]">{error}</p>}

      <section className="mb-8 rounded-2xl border border-gold/50 bg-[#FBF6EC] p-5">
        <h2 className="font-serif text-lg text-ink">Superadmins</h2>
        <p className="mt-1 text-[12px] text-muted">
          These accounts have permanent full access and cannot be changed here.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {DEFAULT_SUPERADMIN_EMAILS.map((email) => <li key={email} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[13px] text-ink"><span>{email}</span><span className="text-[10px] uppercase tracking-[0.12em] text-gold">Owner · full access</span></li>)}
          {accounts.filter((account) => account.role === "superadmin").map((account) => (
            <li key={account._id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[13px] text-ink">
              <span>{account.email}</span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-gold">Full access</span>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={addAccount} className="mb-8 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Google account email"
            className="min-w-[220px] flex-1 rounded-lg border border-line bg-cream px-3 py-2 text-[13px] text-ink outline-none focus:border-sage"
          />
          <button type="submit" disabled={saving} className="rounded-full bg-sage px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-white disabled:opacity-50">
            {saving ? "Saving…" : "+ Add account"}
          </button>
        </div>
        <label className="mt-4 flex items-center gap-2 text-[13px] text-ink"><input type="checkbox" checked={role === "superadmin"} onChange={(e) => setRole(e.target.checked ? "superadmin" : "account")} className="h-4 w-4 accent-sage" /> Make this account a superadmin with full access</label>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {PERMISSIONS.map((permission) => (
            <label key={permission} className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2 text-[13px] text-ink">
              <input type="checkbox" checked={selected.includes(permission)} onChange={() => toggle(permission)} className="h-4 w-4 accent-sage" />
              {LABELS[permission]}
            </label>
          ))}
        </div>
        {hasEditPermission(selected) && role === "account" && (
          <div className="mt-4 rounded-xl border border-gold/40 bg-[#FBF6EC] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Editing scope — by event</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Limit which events this account can edit — this applies to the schedule, checklist,
              guest list and budget. Leave all unchecked for full access to every event.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {GUEST_EVENT_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[13px] text-ink">
                  <input type="checkbox" checked={eventScope.includes(scope)} onChange={() => toggleScope(scope)} className="h-4 w-4 accent-sage" />
                  {SCOPE_LABELS[scope]}
                </label>
              ))}
            </div>
          </div>
        )}
      </form>

      <div className="space-y-3">
        {accounts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center text-muted">No additional accounts yet.</p>
        ) : accounts.filter((account) => account.role !== "superadmin").map((account) => (
          <section key={account._id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-lg text-ink">{account.email}</h2>
              <button onClick={() => removeAccount(account)} className="text-[12px] text-muted hover:text-red-600">Remove</button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((permission) => (
                <label key={permission} className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={account.permissions.includes(permission)}
                    onChange={() => updateAccount(account, { permissions: account.permissions.includes(permission)
                      ? account.permissions.filter((value) => value !== permission)
                      : [...account.permissions, permission] })}
                    className="h-4 w-4 accent-sage"
                  />
                  {LABELS[permission]}
                </label>
              ))}
            </div>
            {hasEditPermission(account.permissions) && account.role !== "superadmin" && (
              <div className="mt-4 rounded-xl border border-gold/40 bg-[#FBF6EC] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">Editing scope — by event</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  Applies to schedule, checklist, guest list and budget. Leave all unchecked for
                  full access to every event.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {GUEST_EVENT_SCOPES.map((scope) => (
                    <label key={scope} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[13px] text-ink">
                      <input
                        type="checkbox"
                        checked={(account.eventScope ?? []).includes(scope)}
                        onChange={() => {
                          const current = account.eventScope ?? []
                          updateAccount(account, { eventScope: current.includes(scope)
                            ? current.filter((value) => value !== scope)
                            : [...current, scope] })
                        }}
                        className="h-4 w-4 accent-sage"
                      />
                      {SCOPE_LABELS[scope]}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <label className="mt-4 flex items-center gap-2 text-[13px] text-ink"><input type="checkbox" checked={false} onChange={(e) => e.target.checked && updateAccount(account, { role: "superadmin" })} className="h-4 w-4 accent-sage" /> Promote to superadmin</label>
          </section>
        ))}
      </div>
    </div>
  )
}
