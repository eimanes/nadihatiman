"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Reveal from "@/components/Reveal"
import { usePermissions } from "@/hooks/usePermissions"

type ChecklistItem = {
  _id: string
  task: string
  event: string
  category: string
  done: boolean
  createdAt: string
}

const EVENT_OPTIONS = [
  { id: "umum", label: "General" },
  { id: "nikah", label: "Nikah" },
  { id: "sanding", label: "Sanding" },
  { id: "tandang", label: "Tandang" },
]

const CATEGORY_OPTIONS = [
  "Preparation",
  "Vendor",
  "Attire",
  "Documents",
  "Logistics",
  "Other",
]

const DEFAULT_ITEMS = [
  { task: "Confirm date & hotel booking in Seremban (Eiman + groom assistant)", event: "nikah", category: "Logistics" },
  { task: "Complete nikah documents & marriage course", event: "nikah", category: "Documents" },
  { task: "Confirm the tok kadi & witnesses", event: "nikah", category: "Preparation" },
  { task: "Fitting of white baju Melayu & white baju kurung", event: "nikah", category: "Attire" },
  { task: "Confirm the catering for the reception after nikah", event: "nikah", category: "Vendor" },
  { task: "Confirm the dais & decorations", event: "sanding", category: "Vendor" },
  { task: "Fitting white dress & brown suit", event: "sanding", category: "Attire" },
  { task: "Confirm the photographer & videographer", event: "sanding", category: "Vendor" },
  { task: "Distribute the digital sanding invitation cards", event: "sanding", category: "Preparation" },
  { task: "Confirm the tandang date", event: "tandang", category: "Preparation" },
  { task: "Distribute the digital tandang invitation cards", event: "tandang", category: "Preparation" },
  { task: "Confirm the tandang dress code", event: "tandang", category: "Attire" },
  { task: "Update the guestlist in Canva", event: "umum", category: "Preparation" },
  { task: "Prepare the doorgifts", event: "umum", category: "Preparation" },
]

export default function ChecklistPage() {
  const { can } = usePermissions()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("semua")
  const [task, setTask] = useState("")
  const [event, setEvent] = useState("umum")
  const [category, setCategory] = useState("Preparation")
  const [busy, setBusy] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const canEdit = can("edit_checklist")

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

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, event, category }),
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
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: DEFAULT_ITEMS }),
      })
      if (res.ok) await load()
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (item: ChecklistItem) => {
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
          {EVENT_OPTIONS.map((o) => (
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
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li
              key={item._id}
              className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3"
            >
              {editMode ? (
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggle(item)}
                  className="h-4 w-4 accent-sage"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    item.done
                      ? "bg-sage text-white"
                      : "border border-line text-transparent"
                  }`}
                >
                  ✓
                </span>
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
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
