"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Reveal from "@/components/Reveal"
import ExportButtons from "@/components/ExportButtons"
import { usePermissions } from "@/hooks/usePermissions"
import type { GuestEventScope } from "@/lib/permission-types"

type ChecklistItem = {
  _id: string
  task: string
  event: string
  category: string
  /** Who owns this task: bride | groom | family | event. */
  owner: string
  done: boolean
  createdAt: string
}

const EVENT_OPTIONS = [
  { id: "umum", label: "General" },
  { id: "nikah", label: "Nikah" },
  { id: "sanding", label: "Sanding" },
  { id: "tandang", label: "Tandang" },
]

const OWNER_OPTIONS = [
  { id: "bride", label: "👰 Bride" },
  { id: "groom", label: "🤵 Groom" },
  { id: "family", label: "👨‍👩‍👧 Family" },
  { id: "event", label: "📅 Event" },
]

const CATEGORY_OPTIONS = [
  "Preparation",
  "Vendor",
  "Attire",
  "Documents",
  "Logistics",
  "Other",
]

// Seeded from the wedding budget — each expense becomes a task, assigned to
// an owner (bride/groom/family/event) based on the budget category & payer.
const SEED_ITEMS = [
  // Event — shared/logistics
  { task: "Book the Wedding Hall (Le Rozza)", event: "sanding", owner: "event" },
  { task: "Arrange Dulang Hantaran (Dulang Mimpi)", event: "sanding", owner: "event" },
  { task: "Frame the Mas Kawin", event: "nikah", owner: "event" },
  { task: "Book the Emcee (Emcee Redha)", event: "sanding", owner: "event" },
  { task: "Order the Goodies", event: "sanding", owner: "event" },
  { task: "Set up the Candy Wall", event: "sanding", owner: "event" },
  { task: "Book Photo + Video (Heyypaan)", event: "sanding", owner: "event" },
  { task: "Hang the Kain Rentang (Cahaya Cermin)", event: "sanding", owner: "event" },
  { task: "Confirm Tok Kadi + Saksi", event: "nikah", owner: "event" },
  { task: "Arrange Ice Cream, Cendol, Apam Balik & Mee stalls", event: "sanding", owner: "event" },
  // Bride
  { task: "Baju Nikah (Teruntum Putih)", event: "nikah", owner: "bride" },
  { task: "Wedding Dress (Farrarahim Atelier)", event: "sanding", owner: "bride" },
  { task: "Wedding Heels (My Ballerine)", event: "sanding", owner: "bride" },
  { task: "Keepsake (Suhada Mohd)", event: "umum", owner: "bride" },
  { task: "Digital & Physical Wedding Cards", event: "umum", owner: "bride" },
  { task: "Book MUA + Hijabstylist (Nabilah)", event: "sanding", owner: "bride" },
  { task: "Book the Hairstylist", event: "sanding", owner: "bride" },
  { task: "Book the Henna Artist", event: "sanding", owner: "bride" },
  { task: "Hand bouquet (Rimbun)", event: "sanding", owner: "bride" },
  { task: "Manicure + Spa (mandi bunga)", event: "sanding", owner: "bride" },
  { task: "2 Dinar Emas & Wedding Bracelet", event: "umum", owner: "bride" },
  { task: "Wedding Ring (P)", event: "umum", owner: "bride" },
  // Groom
  { task: "Wedding Suit (ThePresidentKL)", event: "sanding", owner: "groom" },
  { task: "Wedding Shoes (zeve)", event: "sanding", owner: "groom" },
  { task: "Groom stylist - Nikah", event: "nikah", owner: "groom" },
  { task: "Wedding Ring (L)", event: "umum", owner: "groom" },
  { task: "Hotel - Lelaki (before nikah)", event: "nikah", owner: "groom" },
  // Family
  { task: "Hotel - Pengantin (before & after sanding)", event: "sanding", owner: "family" },
  { task: "Coordinate family contributions & gifts", event: "umum", owner: "family" },
]

export default function ChecklistPage() {
  const { can, eventScope } = usePermissions()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("semua")
  const [task, setTask] = useState("")
  const [event, setEvent] = useState("umum")
  const [category, setCategory] = useState("Preparation")
  const [owner, setOwner] = useState("event")
  const [busy, setBusy] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const canEdit = can("edit_checklist")
  // Scoped editors may only edit tasks of their own events. "umum"
  // (general) tasks require the "general" scope.
  const hasScope = Boolean(eventScope && !eventScope.includes("general"))
  const canEditEvent = (ev: string) =>
    !hasScope || !eventScope ? true : ev === "umum" ? eventScope.includes("general") : eventScope.includes(ev as GuestEventScope)
  const canEditItem = (item: ChecklistItem) => canEdit && canEditEvent(item.event)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/checklist", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error loading checklist.")
        setItems([])
      } else {
        setError(null)
        setItems(data.items)
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

  // Keep the add-form event inside the editor's scope.
  useEffect(() => {
    if (!hasScope || canEditEvent(event)) return
    const first = ["umum", ...EVENT_OPTIONS.map((o) => o.id)].find(canEditEvent)
    if (first) setEvent(first)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventScope, canEdit])

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit || !task.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, event, category, owner }),
      })
      if (res.ok) {
        setTask("")
        await load()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to add task.")
      }
    } finally {
      setBusy(false)
    }
  }

  const seedDefaults = async () => {
    if (!canEdit || busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: SEED_ITEMS }),
      })
      if (res.ok) await load()
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (item: ChecklistItem) => {
    if (!canEditItem(item)) return
    setItems((prev) =>
      prev.map((i) => (i._id === item._id ? { ...i, done: !i.done } : i)),
    )
    await fetch(`/api/checklist/${item._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !item.done }),
    })
  }

  const remove = async (item: ChecklistItem) => {
    if (!canEditItem(item)) return
    setItems((prev) => prev.filter((i) => i._id !== item._id))
    await fetch(`/api/checklist/${item._id}`, { method: "DELETE" })
  }

  const filtered = useMemo(
    () => (filter === "semua" ? items : items.filter((i) => i.event === filter)),
    [items, filter],
  )
  const doneCount = filtered.filter((i) => i.done).length
  const progress = filtered.length
    ? Math.round((doneCount / filtered.length) * 100)
    : 0

  // Group items by owner (bride / groom / family / event) for structure.
  const grouped = useMemo(() => {
    const order = ["bride", "groom", "family", "event"]
    const map = new Map<string, ChecklistItem[]>()
    for (const o of order) map.set(o, [])
    for (const it of filtered) {
      const key = map.has(it.owner) ? it.owner : "event"
      map.get(key)!.push(it)
    }
    return order
      .map((o) => ({ owner: o, items: map.get(o) ?? [] }))
      .filter((g) => g.items.length > 0)
  }, [filtered])

  const ownerMeta = (o: string) =>
    OWNER_OPTIONS.find((x) => x.id === o) ?? { id: o, label: o }

  return (
    <div className="mx-auto max-w-[860px] px-5 pb-20 pt-24">
      <header className="py-10 text-center">
        <Reveal>
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">
            Checklist
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="font-serif text-4xl text-ink">Wedding checklist</h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-relaxed text-muted">
            Preparation checklist for all three events. Tap Edit to add, tick
            off, or remove tasks — changes are saved automatically.
          </p>
        </Reveal>
        {canEdit && (
          <Reveal delay={0.24}>
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={`mt-5 inline-block rounded-full px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] transition-transform hover:-translate-y-px ${
                editMode
                  ? "bg-ink text-white"
                  : "bg-sage text-white"
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

      {/* Add form — only in edit mode */}
      {editMode && (
      <form
        onSubmit={addItem}
        className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-4"
      >
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Add a new task…"
          className="min-w-[200px] flex-1 rounded-full border border-line bg-cream px-4 py-2 text-[14px] outline-none focus:border-sage"
        />
        <select
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          className="rounded-full border border-line bg-white px-3 py-2 text-[13px]"
        >
          {EVENT_OPTIONS.filter((o) => canEditEvent(o.id)).map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="rounded-full border border-line bg-white px-3 py-2 text-[13px]"
        >
          {OWNER_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-line bg-white px-3 py-2 text-[13px]"
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-sage px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-px disabled:opacity-50"
        >
          + Add
        </button>
      </form>
      )}

      {/* Filter + progress */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
        <ExportButtons
          rows={filtered.map(({ _id, createdAt, ...item }) => ({
            ...item,
            done: item.done ? "Done" : "Not done",
          }))}
          filename={`checklist-${filter}`}
        />
        <span className="text-[12px] text-muted">
          {doneCount}/{filtered.length} done · {progress}%
        </span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-sage transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Items */}
      {loading ? (
        <p className="py-10 text-center text-muted">Loading…</p>
      ) : filtered.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center">
          <p className="mb-4 text-muted">No tasks yet.</p>
          {editMode ? (
            <button
              onClick={seedDefaults}
              disabled={busy}
              className="rounded-full bg-sage px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              Load the default wedding checklist
            </button>
          ) : (
            <p className="text-[13px] text-muted">
              Tap ✏️ Edit above to add tasks.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const gDone = group.items.filter((i) => i.done).length
            return (
              <section key={group.owner}>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-serif text-lg text-ink">
                    {ownerMeta(group.owner).label}
                  </h2>
                  <span className="text-[11px] text-muted">
                    {gDone}/{group.items.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item._id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3"
                    >
                      {editMode ? (
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggle(item)}
                          disabled={!canEditItem(item)}
                          className="h-4 w-4 accent-sage disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggle(item)}
                          disabled={!canEditItem(item)}
                          aria-label={item.done ? "Mark task as not done" : "Mark task as done"}
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] transition-opacity ${
                            item.done
                              ? "bg-sage text-white"
                              : "border border-line text-transparent"
                          } ${!canEditItem(item) ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                        >
                          ✓
                        </button>
                      )}
                      <span
                        className={`flex-1 text-[14px] ${
                          item.done ? "text-muted line-through" : "text-ink"
                        }`}
                      >
                        {item.task}
                      </span>
                      <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-sage">
                        {EVENT_OPTIONS.find((o) => o.id === item.event)?.label ?? item.event}
                      </span>
                      <span className="hidden rounded-full bg-cream px-2.5 py-0.5 text-[10px] text-muted sm:inline">
                        {item.category}
                      </span>
                      {editMode && (
                        <button
                          onClick={() => remove(item)}
                          aria-label="Delete"
                          className="text-muted transition-colors hover:text-red-600"
                          disabled={!canEditItem(item)}
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
