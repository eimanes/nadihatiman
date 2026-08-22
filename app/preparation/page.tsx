"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Reveal from "@/components/Reveal"
import { usePermissions } from "@/hooks/usePermissions"

type Organizer = {
  role: string
  name: string
}

type OrganizationDraft = Organizer & {
  customRole?: string
}

type PrepSection = {
  _id: string
  title: string
  event: string
  items: string[]
  organization: Organizer[]
  order: number
  createdAt: string
}

const EVENT_OPTIONS = [
  { id: "sanding", label: "Sanding" },
  { id: "nikah", label: "Nikah" },
  { id: "tandang", label: "Tandang" },
  { id: "umum", label: "General" },
]

const ROLE_OPTIONS = ["Floor manager", "Bride assistant", "Groom assistant"]
const OTHER_ROLE = "Other"

const DEFAULT_ORGANIZATION: Organizer[] = [
  { role: "Floor manager", name: "—" },
  { role: "Bride assistant", name: "—" },
  { role: "Groom assistant", name: "—" },
]

const DEFAULT_SECTIONS = [
  {
    title: "Dulang P (bride's side)",
    event: "sanding",
    items: ["Cincin", "Perfume", "—", "—", "—", "—", "—"],
    organization: DEFAULT_ORGANIZATION,
  },
  {
    title: "Dulang L (groom's side)",
    event: "sanding",
    items: ["Cincin & gelang", "Frame mas kahwin", "Perfume", "—", "—"],
    organization: DEFAULT_ORGANIZATION,
  },
  {
    title: "Dulang boys",
    event: "sanding",
    items: ["Akmal", "Erfan / Ezad", "Jojo / Afiq / Zarif", "Idris"],
    organization: DEFAULT_ORGANIZATION,
  },
  {
    title: "Dulang girls (7 girls)",
    event: "sanding",
    items: ["—", "—", "—", "—", "—", "—", "—"],
    organization: DEFAULT_ORGANIZATION,
  },
  {
    title: "Flower boy & girl",
    event: "sanding",
    items: ["Flower boy: —", "Flower girl: —"],
    organization: DEFAULT_ORGANIZATION,
  },
]

const EVENT_BADGE = (id: string) =>
  EVENT_OPTIONS.find((o) => o.id === id)?.label ?? id

export default function PreparationPage() {
  const { isSuperadmin } = usePermissions()
  const [sections, setSections] = useState<PrepSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState("semua")
  const [editMode, setEditMode] = useState(false)
  const canEdit = isSuperadmin

  const [title, setTitle] = useState("")
  const [event, setEvent] = useState("sanding")
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [orgDrafts, setOrgDrafts] = useState<Record<string, OrganizationDraft>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/preparation", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error loading preparation.")
        setSections([])
      } else {
        setError(null)
        setSections(
          (data.sections ?? []).map((section: PrepSection) => ({
            ...section,
            organization: Array.isArray(section.organization)
              ? section.organization
              : [],
          })),
        )
      }
    } catch {
      setError("Could not reach the server.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/preparation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          event,
          items: [],
          organization: DEFAULT_ORGANIZATION,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to add section.")
      setSections((s) => [...s, data.section])
      setTitle("")
      setError(null)
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Failed to add section.")
    } finally {
      setBusy(false)
    }
  }

  const seedDefaults = async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/preparation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: DEFAULT_SECTIONS }),
      })
      if (res.ok) await load()
    } finally {
      setBusy(false)
    }
  }

  const patchSection = async (id: string, updates: Partial<PrepSection>) => {
    setSections((s) =>
      s.map((x) => (x._id === id ? { ...x, ...updates } : x)),
    )
    try {
      const res = await fetch(`/api/preparation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Error updating.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error updating.")
      load()
    }
  }

  const removeSection = async (id: string) => {
    setSections((s) => s.filter((x) => x._id !== id))
    try {
      const res = await fetch(`/api/preparation/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Error deleting.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error deleting.")
      load()
    }
  }

  const addItem = (section: PrepSection) => {
    const draft = (drafts[section._id] ?? "").trim()
    if (!draft) return
    patchSection(section._id, { items: [...section.items, draft] })
    setDrafts((d) => ({ ...d, [section._id]: "" }))
  }

  const updateItem = (section: PrepSection, idx: number, value: string) => {
    const items = section.items.map((it, i) => (i === idx ? value : it))
    setSections((s) =>
      s.map((x) => (x._id === section._id ? { ...x, items } : x)),
    )
  }

  const commitItem = (section: PrepSection) =>
    patchSection(section._id, { items: section.items })

  const removeItem = (section: PrepSection, idx: number) =>
    patchSection(section._id, {
      items: section.items.filter((_, i) => i !== idx),
    })

  const addOrganization = (section: PrepSection) => {
    const draft = orgDrafts[section._id]
    const role = draft?.role === OTHER_ROLE ? draft.customRole : draft?.role
    if (!role?.trim() || !draft?.name.trim()) return
    const next = [...(section.organization ?? []), { role: role.trim(), name: draft.name.trim() }]
    patchSection(section._id, { organization: next })
    setOrgDrafts((d) => ({
      ...d,
      [section._id]: { role: "Floor manager", name: "", customRole: "" },
    }))
  }

  const updateOrganization = (
    section: PrepSection,
    idx: number,
    field: "role" | "name",
    value: string,
  ) => {
    const organization = section.organization.map((entry, i) =>
      i === idx ? { ...entry, [field]: value } : entry,
    )
    setSections((s) =>
      s.map((x) => (x._id === section._id ? { ...x, organization } : x)),
    )
  }

  const commitOrganization = (section: PrepSection) =>
    patchSection(section._id, { organization: section.organization })

  const removeOrganization = (section: PrepSection, idx: number) =>
    patchSection(section._id, {
      organization: section.organization.filter((_, i) => i !== idx),
    })

  const isStandardRole = (role: string) => ROLE_OPTIONS.includes(role)

  const filtered = useMemo(
    () =>
      filter === "semua"
        ? sections
        : sections.filter((s) => s.event === filter),
    [sections, filter],
  )

  return (
    <div className="mx-auto max-w-[900px] px-5 pb-20 pt-24">
      <header className="py-10 text-center">
        <Reveal>
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">
            Preparation
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="font-serif text-4xl text-ink">Preparation</h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-3 max-w-[620px] text-[14px] leading-relaxed text-muted">
            Roles and dulang details for each event — floor manager, bride
            assistant, groom assistant, and the items for each prep station.
            Tap Edit to add, change or remove — changes are saved automatically.
          </p>
        </Reveal>
        {canEdit && (
          <Reveal delay={0.24}>
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={`mt-5 inline-block rounded-full px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-px ${
                editMode ? "bg-ink" : "bg-sage"
              }`}
            >
              {editMode ? "✓ Done editing" : "✏️ Edit"}
            </button>
          </Reveal>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-gold/50 bg-[#FBF6EC] px-5 py-4 text-[13px] text-ink">
          ⚠️ {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[{ id: "semua", label: "All" }, ...EVENT_OPTIONS].map((o) => (
            <button
              key={o.id}
              onClick={() => setFilter(o.id)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] transition-colors ${
                filter === o.id
                  ? "bg-sage text-white"
                  : "border border-line bg-white text-muted hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {editMode && (
        <form
          onSubmit={addSection}
          className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-4"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New section (e.g. Dulang boys)…"
            className="min-w-[200px] flex-1 rounded-full border border-line bg-cream px-4 py-2 text-[14px] outline-none focus:border-sage"
          />
          <select
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className="rounded-full border border-line bg-white px-3 py-2 text-[13px]"
          >
            {EVENT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-sage px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-px disabled:opacity-50"
          >
            + Add section
          </button>
        </form>
      )}

      {loading ? (
        <p className="py-10 text-center text-muted">Loading…</p>
      ) : filtered.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center">
          <p className="mb-4 text-muted">No preparation sections yet.</p>
          {editMode ? (
            <button
              onClick={seedDefaults}
              disabled={busy}
              className="rounded-full bg-sage px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              Load the default sanding preparation
            </button>
          ) : (
            <p className="text-[13px] text-muted">
              Tap ✏️ Edit above to add sections.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((section) => (
            <section
              key={section._id}
              className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex-1">
                  {editMode ? (
                    <input
                      value={section.title}
                      onChange={(e) =>
                        setSections((s) =>
                          s.map((x) =>
                            x._id === section._id
                              ? { ...x, title: e.target.value }
                              : x,
                          ),
                        )
                      }
                      onBlur={() => patchSection(section._id, { title: section.title })}
                      className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 font-serif text-lg text-ink hover:border-line focus:border-sage focus:outline-none"
                    />
                  ) : (
                    <h2 className="px-1 py-0.5 font-serif text-lg text-ink">
                      {section.title}
                    </h2>
                  )}
                  {editMode ? (
                    <select
                      value={section.event}
                      onChange={(e) =>
                        patchSection(section._id, { event: e.target.value })
                      }
                      className="mt-1 rounded-full bg-sage-soft px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-sage"
                    >
                      {EVENT_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {EVENT_BADGE(o.id)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="mt-1 inline-block rounded-full bg-sage-soft px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-sage">
                      {EVENT_BADGE(section.event)}
                    </span>
                  )}
                </div>
                {editMode && (
                  <button
                    onClick={() => removeSection(section._id)}
                    aria-label={`Delete ${section.title}`}
                    className="rounded-full px-2 py-1 text-[12px] text-muted transition-colors hover:bg-[#FBEFEE] hover:text-[#A0524B]"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="mb-4 rounded-xl bg-cream p-3">
                <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-muted">
                  Organization
                </div>
                <div className="space-y-2">
                  {(section.organization ?? []).length === 0 ? (
                    <div className="rounded-lg bg-white px-2 py-1.5 text-[12px] text-muted">
                      No assigned roles yet.
                    </div>
                  ) : (
                    (section.organization ?? []).map((organizer, idx) => (
                      <div
                        key={`${section._id}-org-${idx}`}
                        className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5"
                      >
                        {editMode ? (
                          <>
                            <select
                              value={isStandardRole(organizer.role) ? organizer.role : OTHER_ROLE}
                              onChange={(e) =>
                                updateOrganization(
                                  section,
                                  idx,
                                  "role",
                                  e.target.value === OTHER_ROLE ? "" : e.target.value,
                                )
                              }
                              onBlur={() => commitOrganization(section)}
                              className="w-[140px] rounded-full border border-line bg-white px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-muted"
                            >
                              {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                              <option value={OTHER_ROLE}>{OTHER_ROLE}</option>
                            </select>
                            {!isStandardRole(organizer.role) && (
                              <input
                                value={organizer.role}
                                onChange={(e) =>
                                  updateOrganization(section, idx, "role", e.target.value)
                                }
                                onBlur={() => commitOrganization(section)}
                                placeholder="Role"
                                className="w-[140px] rounded-full border border-line bg-cream px-2.5 py-1.5 text-[12px] outline-none focus:border-sage"
                              />
                            )}
                            <input
                              value={organizer.name}
                              onChange={(e) =>
                                updateOrganization(
                                  section,
                                  idx,
                                  "name",
                                  e.target.value,
                                )
                              }
                              onBlur={() => commitOrganization(section)}
                              placeholder="Name"
                              className="flex-1 rounded-full border border-line bg-cream px-2.5 py-1.5 text-[12px] outline-none focus:border-sage"
                            />
                            <button
                              type="button"
                              onClick={() => removeOrganization(section, idx)}
                              aria-label={`Remove ${organizer.role}`}
                              className="text-[12px] text-muted transition-colors hover:text-red-600"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="w-[145px] text-[10px] uppercase tracking-[0.1em] text-muted">
                              {organizer.role}
                            </span>
                            <span className="flex-1 text-[13px] text-ink">
                              {organizer.name || "—"}
                            </span>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {editMode && (
                  <div className="mt-3 flex gap-2">
                    <select
                      value={orgDrafts[section._id]?.role ?? "Floor manager"}
                      onChange={(e) =>
                        setOrgDrafts((d) => ({
                          ...d,
                          [section._id]: {
                            role: e.target.value,
                            name: d[section._id]?.name ?? "",
                            customRole: d[section._id]?.customRole ?? "",
                          },
                        }))
                      }
                      className="w-[140px] rounded-full border border-line bg-white px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-muted"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                      <option value={OTHER_ROLE}>{OTHER_ROLE}</option>
                    </select>
                    {orgDrafts[section._id]?.role === OTHER_ROLE && (
                      <input
                        value={orgDrafts[section._id]?.customRole ?? ""}
                        onChange={(e) =>
                          setOrgDrafts((d) => ({
                            ...d,
                            [section._id]: {
                              role: OTHER_ROLE,
                              name: d[section._id]?.name ?? "",
                              customRole: e.target.value,
                            },
                          }))
                        }
                        placeholder="Custom role"
                        className="w-[140px] rounded-full border border-line bg-white px-3 py-1.5 text-[12px] outline-none focus:border-sage"
                      />
                    )}
                    <input
                      value={orgDrafts[section._id]?.name ?? ""}
                      onChange={(e) =>
                        setOrgDrafts((d) => ({
                          ...d,
                          [section._id]: {
                            role: d[section._id]?.role ?? "Floor manager",
                            name: e.target.value,
                            customRole: d[section._id]?.customRole ?? "",
                          },
                        }))
                      }
                      placeholder="Name"
                      className="flex-1 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] outline-none focus:border-sage"
                    />
                    <button
                      type="button"
                      onClick={() => addOrganization(section)}
                      className="rounded-full bg-sage px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              <ol className="mb-3 space-y-1.5">
                {section.items.map((item, i) => (
                  <li key={`${section._id}-item-${i}`} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-right text-[11px] text-muted">
                      {i + 1}.
                    </span>
                    {editMode ? (
                      <>
                        <input
                          value={item}
                          onChange={(e) => updateItem(section, i, e.target.value)}
                          onBlur={() => commitItem(section)}
                          className="flex-1 rounded-lg border border-transparent bg-cream px-3 py-1.5 text-[13px] text-ink hover:border-line focus:border-sage focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(section, i)}
                          aria-label="Remove item"
                          className="text-muted transition-colors hover:text-red-600"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <span className="flex-1 px-3 py-1.5 text-[13px] text-ink">
                        {item}
                      </span>
                    )}
                  </li>
                ))}
                {section.items.length === 0 && (
                  <li className="pl-7 text-[12px] text-muted">No items yet.</li>
                )}
              </ol>

              {editMode && (
                <div className="mt-auto flex items-center gap-2">
                  <input
                    value={drafts[section._id] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [section._id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addItem(section)
                      }
                    }}
                    placeholder="Add item…"
                    className="flex-1 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] outline-none focus:border-sage"
                  />
                  <button
                    type="button"
                    onClick={() => addItem(section)}
                    className="rounded-full bg-sage px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-px"
                  >
                    + Add
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
