"use client"

import { useCallback, useEffect, useState } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import type {
  FlowStep,
  Guestlist,
  Invitation,
  LaneId,
  WeddingEvent,
} from "@/content/site"
import { site } from "@/content/site"

type Settings = {
  events: WeddingEvent[]
  invitations: Invitation[]
  guestlists: Guestlist[]
  budgetSheetUrl: string
}

const LANES: { id: LaneId; label: string }[] = [
  { id: "groom", label: "Eiman" },
  { id: "bride", label: "Nadia" },
  { id: "family", label: "Family & Guests" },
]

const input =
  "rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-sage"
const label =
  "flex flex-col gap-1 text-[10px] uppercase tracking-[0.14em] text-muted"
const chipBtn =
  "rounded-full border border-line bg-white px-3 py-1 text-[11px] text-muted transition-colors hover:text-ink"

function emptyStep(): FlowStep {
  return {
    time: "",
    startAt: "",
    endAt: "",
    title: "",
    detail: "",
    location: "",
    locationUrl: "",
    lanes: ["groom", "bride", "family"],
  }
}

const displayDate = (date: string) =>
  new Intl.DateTimeFormat("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`))

const isoDate = (value: string | null) => value?.slice(0, 10) ?? ""
const isoTime = (value: string | null) => value?.slice(11, 16) ?? ""

const updateEventDateTime = (
  event: WeddingEvent,
  date: string,
  time: string,
): Partial<WeddingEvent> => ({
  dateDisplay: date ? displayDate(date) : event.dateDisplay,
  dateIso: date && time ? `${date}T${time}:00+08:00` : null,
})

const inputDateTime = (value?: string) =>
  value ? value.slice(0, 16) : ""

const stepTimeDisplay = (startAt?: string, endAt?: string) => {
  if (!startAt) return ""
  const start = new Date(startAt)
  const end = endAt ? new Date(endAt) : null
  const date = new Intl.DateTimeFormat("en-MY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(start)
  const time = new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const startTime = time.format(start)
  if (!end) return `${date} · ${startTime}`
  const sameDay = start.toDateString() === end.toDateString()
  return sameDay
    ? `${date} · ${startTime} – ${time.format(end)}`
    : `${date} · ${startTime} – ${new Intl.DateTimeFormat("en-MY", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(end)}`
}

export default function AdminPage() {
  const { isSuperadmin, can, eventScope, loaded: permissionsLoaded } = usePermissions()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [configured, setConfigured] = useState(true)
  const [persisted, setPersisted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [tab, setTab] = useState<
    "events" | "invitations" | "guestlists" | "budget"
  >("events")
  const [eventIdx, setEventIdx] = useState(0)
  const canEditSchedule = isSuperadmin || can("edit_schedule")
  const canEditBudget = isSuperadmin || can("edit_budget")
  // Scoped editors can only edit the events in their scope; invitations &
  // guestlists affect all events, so they stay full-access only.
  const hasEventScope = Boolean(eventScope && !eventScope.includes("general"))
  const canEditEventId = (id: string) =>
    !hasEventScope || !eventScope ? true : eventScope.includes(id as never)
  const isFullScheduleEditor = canEditSchedule && !hasEventScope
  const availableTabs: { id: "events" | "invitations" | "guestlists" | "budget"; label: string }[] = [
    ...(canEditSchedule
      ? [{ id: "events" as const, label: "Events & Schedule" }]
      : []),
    ...(isFullScheduleEditor
      ? [
          { id: "invitations" as const, label: "Invitations" },
          { id: "guestlists" as const, label: "Guestlist" },
        ]
      : []),
    ...(canEditBudget ? [{ id: "budget" as const, label: "Budget" }] : []),
  ]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/settings", { cache: "no-store" })
      const data = await res.json()
      setSettings(data.settings)
      setConfigured(Boolean(data.configured))
      setPersisted(Boolean(data.persisted))
    } catch {
      setMessage({ kind: "err", text: "Could not load settings." })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!permissionsLoaded) return
    if (!availableTabs.some((item) => item.id === tab)) {
      setTab(availableTabs[0]?.id ?? "events")
    }
  }, [permissionsLoaded, tab, availableTabs])

  // Keep the selected event inside the editor's scope.
  useEffect(() => {
    if (!settings) return
    const current = settings.events[eventIdx]
    if (current && !canEditEventId(current.id)) {
      const first = settings.events.findIndex((e) => canEditEventId(e.id))
      if (first >= 0) setEventIdx(first)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, eventScope, permissionsLoaded])

  /* ── immutable update helpers ── */

  const updateEvent = (idx: number, patch: Partial<WeddingEvent>) =>
    setSettings((s) =>
      s
        ? { ...s, events: s.events.map((e, i) => (i === idx ? { ...e, ...patch } : e)) }
        : s,
    )

  const ev = settings?.events[eventIdx]

  const updateStep = (
    kind: "flow" | "preSteps",
    sIdx: number,
    patch: Partial<FlowStep>,
  ) => {
    if (!ev) return
    updateEvent(eventIdx, {
      [kind]: ev[kind].map((st, i) => (i === sIdx ? { ...st, ...patch } : st)),
    } as Partial<WeddingEvent>)
  }

  const addStep = (kind: "flow" | "preSteps") => {
    if (!ev) return
    updateEvent(eventIdx, { [kind]: [...ev[kind], emptyStep()] } as Partial<WeddingEvent>)
  }

  const removeStep = (kind: "flow" | "preSteps", sIdx: number) => {
    if (!ev) return
    updateEvent(eventIdx, {
      [kind]: ev[kind].filter((_, i) => i !== sIdx),
    } as Partial<WeddingEvent>)
  }

  const moveStep = (kind: "flow" | "preSteps", sIdx: number, dir: -1 | 1) => {
    if (!ev) return
    const arr = [...ev[kind]]
    const target = sIdx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[sIdx], arr[target]] = [arr[target], arr[sIdx]]
    updateEvent(eventIdx, { [kind]: arr } as Partial<WeddingEvent>)
  }

  const toggleLane = (kind: "flow" | "preSteps", sIdx: number, lane: LaneId) => {
    if (!ev) return
    const step = ev[kind][sIdx]
    const has = step.lanes.includes(lane)
    const lanes = has
      ? step.lanes.filter((l) => l !== lane)
      : [...step.lanes, lane]
    if (lanes.length === 0) return // at least one lane required
    updateStep(kind, sIdx, { lanes })
  }

  /* ── save ── */

  const save = async () => {
    if (!settings || saving || (!canEditSchedule && !canEditBudget)) return
    setSaving(true)
    setMessage(null)
    try {
      const payload: Settings = {
        ...settings,
        events: settings.events.map((e) => ({
          ...e,
          dateIso: e.dateIso && e.dateIso.trim() ? e.dateIso.trim() : null,
          notes: e.notes.map((n) => n.trim()).filter(Boolean),
          dressCode: e.dressCode.map((dc) => ({
            ...dc,
            swatches: dc.swatches.map((s) => s.trim()).filter(Boolean),
          })),
        })),
      }
      const invalidStep = payload.events
        .flatMap((event) => [...event.preSteps, ...event.flow])
        .find(
          (step) =>
            step.startAt && step.endAt &&
            new Date(step.endAt).getTime() <= new Date(step.startAt).getTime(),
        )
      if (invalidStep) {
        setMessage({
          kind: "err",
          text: `End time must be after start time for “${invalidStep.title || "untitled step"}”.`,
        })
        return
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setPersisted(true)
        setMessage({ kind: "ok", text: "Settings saved ✓" })
      } else {
        setMessage({ kind: "err", text: data.error || "Failed to save." })
      }
    } catch {
      setMessage({ kind: "err", text: "Could not reach the server." })
    } finally {
      setSaving(false)
    }
  }

  /* ── render ── */

  if (loading) {
    return <p className="py-24 text-center text-muted">Loading…</p>
  }
  if (!settings) {
    return (
      <p className="py-24 text-center text-muted">
        Could not load settings. Try reloading the page.
      </p>
    )
  }

  const stepEditor = (kind: "flow" | "preSteps", steps: FlowStep[], title: string) => (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.24em] text-muted">{title}</h3>
        <button onClick={() => addStep(kind)} className={chipBtn}>
          + Add step
        </button>
      </div>
      {steps.length === 0 && (
        <p className="text-[13px] text-muted">No steps yet.</p>
      )}
      <div className="space-y-4">
        {steps.map((st, si) => (
          <div key={si} className="rounded-xl bg-cream p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-sage">
                Step {si + 1}
              </span>
              <span className="flex gap-1.5">
                <button onClick={() => moveStep(kind, si, -1)} className={chipBtn} aria-label="Up">↑</button>
                <button onClick={() => moveStep(kind, si, 1)} className={chipBtn} aria-label="Down">↓</button>
                <button
                  onClick={() => removeStep(kind, si)}
                  className="rounded-full border border-line bg-white px-3 py-1 text-[11px] text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>
                Start date & time
                <input
                  type="datetime-local"
                  className={input}
                  value={inputDateTime(st.startAt)}
                  onChange={(e) => {
                    const startAt = e.target.value
                    updateStep(kind, si, {
                      startAt,
                      time: stepTimeDisplay(startAt, st.endAt),
                    })
                  }}
                />
              </label>
              <label className={label}>
                End date & time
                <input
                  type="datetime-local"
                  min={inputDateTime(st.startAt) || undefined}
                  className={input}
                  value={inputDateTime(st.endAt)}
                  onChange={(e) => {
                    const endAt = e.target.value
                    if (
                      st.startAt && endAt &&
                      new Date(endAt).getTime() <= new Date(st.startAt).getTime()
                    ) {
                      setMessage({ kind: "err", text: "End time must be after start time." })
                      return
                    }
                    updateStep(kind, si, {
                      endAt,
                      time: stepTimeDisplay(st.startAt, endAt),
                    })
                  }}
                />
              </label>
              <label className={label}>
                Activity
                <input
                  className={input}
                  value={st.title}
                  onChange={(e) => updateStep(kind, si, { title: e.target.value })}
                  placeholder="e.g. Gather at the masjid"
                />
              </label>
              {!st.startAt && (
                <label className={label}>
                  Legacy time display
                  <input
                    className={input}
                    value={st.time}
                    onChange={(e) => updateStep(kind, si, { time: e.target.value })}
                    placeholder="e.g. 8:00 AM"
                  />
                </label>
              )}
              <label className={`${label} sm:col-span-2`}>
                Details (optional)
                <input
                  className={input}
                  value={st.detail ?? ""}
                  onChange={(e) => updateStep(kind, si, { detail: e.target.value })}
                />
              </label>
              <label className={label}>
                Location name (optional)
                <input
                  className={input}
                  value={st.location ?? ""}
                  onChange={(e) => updateStep(kind, si, { location: e.target.value })}
                />
              </label>
              <label className={label}>
                Location / Google Maps link (optional)
                <input
                  className={input}
                  value={st.locationUrl ?? ""}
                  onChange={(e) => updateStep(kind, si, { locationUrl: e.target.value })}
                  placeholder="https://maps.app.goo.gl/…"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Lane (swim lane):
              </span>
              {LANES.map((ln) => (
                <label key={ln.id} className="flex items-center gap-1.5 text-[12px] text-ink">
                  <input
                    type="checkbox"
                    checked={st.lanes.includes(ln.id)}
                    onChange={() => toggleLane(kind, si, ln.id)}
                    className="h-3.5 w-3.5 accent-sage"
                  />
                  {ln.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-[900px] px-5 pb-24">
      <header className="py-10 text-center">
        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">
          {site.brand.name}
        </p>
        <h1 className="font-serif text-[clamp(32px,6vw,56px)] text-ink">
          Edit Event Details
        </h1>
        <p className="mx-auto mt-3 max-w-[600px] text-muted">
          All values here are saved and shown directly on the Home,
          Schedule, Invitations and Guests pages.
        </p>
      </header>

      {!configured && (
        <div className="mb-6 rounded-2xl border border-gold/50 bg-[#FBF6EC] px-5 py-4 text-[13px] text-ink">
          ⚠️ Storage is not configured yet — add <code>MONGODB_URI</code> in{" "}
          <code>.env.local</code> to enable saving. For now the default values
          are shown and the save button will not succeed.
        </div>
      )}
      {configured && !persisted && (
        <div className="mb-6 rounded-2xl border border-line bg-sage-soft px-5 py-4 text-[13px] text-ink">
          ℹ️ Default data is currently shown. Press <b>Save</b> to store it
          for the first time — after that all pages read directly from
          the saved data.
        </div>
      )}

      {/* Tabs + save */}
      <div className="sticky top-20 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-full border border-line bg-white/90 px-3 py-2 backdrop-blur">
        <div className="flex gap-1.5">
          {availableTabs.map(({ id, label: lbl }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-1.5 text-[12px] transition-colors ${
                tab === id ? "bg-sage text-white" : "text-muted hover:text-ink"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <span
              className={`text-[12px] ${
                message.kind === "ok" ? "text-sage" : "text-red-700"
              }`}
            >
              {message.text}
            </span>
          )}
          {(canEditSchedule || canEditBudget) && <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-sage px-6 py-2 text-[11px] uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-px disabled:opacity-50"
            >
              {saving ? "Saving…" : "💾 Save"}
            </button>}
        </div>
      </div>

      {/* ── EVENTS TAB ── */}
      {tab === "events" && ev && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-1.5">
            {settings.events.map((e, i) => {
              const selectable = canEditEventId(e.id)
              return (
                <button
                  key={e.id}
                  onClick={() => selectable && setEventIdx(i)}
                  disabled={!selectable}
                  title={selectable ? undefined : "Outside your editing scope"}
                  className={`rounded-full px-4 py-1.5 text-[12px] transition-colors ${
                    eventIdx === i
                      ? "bg-ink text-white"
                      : "border border-line bg-white text-muted hover:text-ink"
                  } ${!selectable ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {e.emoji} {e.name}
                </button>
              )
            })}
          </div>

          {/* Basic details */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="mb-3 text-[11px] uppercase tracking-[0.24em] text-muted">
              Basic information
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>
                Event name
                <input
                  className={input}
                  value={ev.name}
                  onChange={(e) => updateEvent(eventIdx, { name: e.target.value })}
                />
              </label>
              <label className={label}>
                Emoji
                <input
                  className={input}
                  value={ev.emoji}
                  onChange={(e) => updateEvent(eventIdx, { emoji: e.target.value })}
                />
              </label>
              <label className={`${label} sm:col-span-2`}>
                Tagline
                <input
                  className={input}
                  value={ev.tagline}
                  onChange={(e) => updateEvent(eventIdx, { tagline: e.target.value })}
                />
              </label>
              <label className={label}>
                Date
                <input
                  type="date"
                  className={input}
                  value={isoDate(ev.dateIso)}
                  onChange={(e) =>
                    updateEvent(
                      eventIdx,
                      updateEventDateTime(ev, e.target.value, isoTime(ev.dateIso)),
                    )
                  }
                />
              </label>
              <label className={label}>
                Start time
                <input
                  type="time"
                  className={input}
                  value={isoTime(ev.dateIso)}
                  onChange={(e) =>
                    updateEvent(
                      eventIdx,
                      updateEventDateTime(ev, isoDate(ev.dateIso), e.target.value),
                    )
                  }
                />
              </label>
              <label className={`${label} sm:col-span-2`}>
                Event time (public display)
                <input
                  className={input}
                  value={ev.timeDisplay}
                  onChange={(e) => updateEvent(eventIdx, { timeDisplay: e.target.value })}
                  placeholder="e.g. 11:00 AM – 4:00 PM"
                />
              </label>
            </div>
          </div>

          {/* Locations */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[11px] uppercase tracking-[0.24em] text-muted">Location</h3>
              <button
                onClick={() =>
                  updateEvent(eventIdx, {
                    locations: [...ev.locations, { label: "Location", name: "", url: "" }],
                  })
                }
                className={chipBtn}
              >
                + Add location
              </button>
            </div>
            <div className="space-y-3">
              {ev.locations.map((loc, li) => (
                <div key={li} className="grid gap-3 rounded-xl bg-cream p-4 sm:grid-cols-[1fr_1fr_2fr_auto]">
                  <label className={label}>
                    Label
                    <input
                      className={input}
                      value={loc.label}
                      onChange={(e) =>
                        updateEvent(eventIdx, {
                          locations: ev.locations.map((l, i) =>
                            i === li ? { ...l, label: e.target.value } : l,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className={label}>
                    Venue name
                    <input
                      className={input}
                      value={loc.name}
                      onChange={(e) =>
                        updateEvent(eventIdx, {
                          locations: ev.locations.map((l, i) =>
                            i === li ? { ...l, name: e.target.value } : l,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className={label}>
                    Google Maps link
                    <input
                      className={input}
                      value={loc.url}
                      onChange={(e) =>
                        updateEvent(eventIdx, {
                          locations: ev.locations.map((l, i) =>
                            i === li ? { ...l, url: e.target.value } : l,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    onClick={() =>
                      updateEvent(eventIdx, {
                        locations: ev.locations.filter((_, i) => i !== li),
                      })
                    }
                    className="self-end rounded-full border border-line bg-white px-3 py-2 text-[11px] text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-steps & flow */}
          {stepEditor("preSteps", ev.preSteps, "Before the event (optional)")}
          {stepEditor("flow", ev.flow, "Event schedule (swim lane)")}

          {/* Dress code */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[11px] uppercase tracking-[0.24em] text-muted">
                Dress code / theme colors
              </h3>
              <button
                onClick={() =>
                  updateEvent(eventIdx, {
                    dressCode: [
                      ...ev.dressCode,
                      { group: "", theme: "", swatches: ["#FFFFFF"] },
                    ],
                  })
                }
                className={chipBtn}
              >
                + Add group
              </button>
            </div>
            <div className="space-y-3">
              {ev.dressCode.map((dc, di) => (
                <div key={di} className="grid gap-3 rounded-xl bg-cream p-4 sm:grid-cols-[1fr_2fr_1fr_auto]">
                  <label className={label}>
                    Group
                    <input
                      className={input}
                      value={dc.group}
                      onChange={(e) =>
                        updateEvent(eventIdx, {
                          dressCode: ev.dressCode.map((d, i) =>
                            i === di ? { ...d, group: e.target.value } : d,
                          ),
                        })
                      }
                      placeholder="e.g. Female family"
                    />
                  </label>
                  <label className={label}>
                    Theme
                    <input
                      className={input}
                      value={dc.theme}
                      onChange={(e) =>
                        updateEvent(eventIdx, {
                          dressCode: ev.dressCode.map((d, i) =>
                            i === di ? { ...d, theme: e.target.value } : d,
                          ),
                        })
                      }
                      placeholder="cth. Teal blue & white"
                    />
                  </label>
                  <label className={label}>
                    Hex colors (separate with commas)
                    <span className="flex items-center gap-2">
                      <input
                        className={`${input} w-full`}
                        value={dc.swatches.join(",")}
                        onChange={(e) =>
                          updateEvent(eventIdx, {
                            dressCode: ev.dressCode.map((d, i) =>
                              i === di
                                ? { ...d, swatches: e.target.value.split(",") }
                                : d,
                            ),
                          })
                        }
                        placeholder="#2C8C99,#FFFFFF"
                      />
                      <span className="flex shrink-0 gap-1">
                        {dc.swatches.map((hex, hi) => (
                          <span
                            key={hi}
                            className="h-4 w-4 rounded-full border border-line"
                            style={{ backgroundColor: hex.trim() }}
                          />
                        ))}
                      </span>
                    </span>
                  </label>
                  <button
                    onClick={() =>
                      updateEvent(eventIdx, {
                        dressCode: ev.dressCode.filter((_, i) => i !== di),
                      })
                    }
                    className="self-end rounded-full border border-line bg-white px-3 py-2 text-[11px] text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="mb-3 text-[11px] uppercase tracking-[0.24em] text-muted">
              Notes (one note per line)
            </h3>
            <textarea
              className={`${input} min-h-[90px] w-full`}
              value={ev.notes.join("\n")}
              onChange={(e) =>
                updateEvent(eventIdx, { notes: e.target.value.split("\n") })
              }
              placeholder="e.g. Eiman stays overnight at a hotel in Seremban before the event day."
            />
          </div>
        </div>
      )}

      {/* ── INVITATIONS TAB ── */}
      {tab === "invitations" && (
        <div className="space-y-4">
          {settings.invitations.map((inv, ii) => (
            <div key={inv.id} className="rounded-2xl border border-line bg-white p-5">
              <h3 className="mb-3 text-[11px] uppercase tracking-[0.24em] text-muted">
                Invitation {ii + 1}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={label}>
                  Title
                  <input
                    className={input}
                    value={inv.title}
                    onChange={(e) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              invitations: s.invitations.map((v, i) =>
                                i === ii ? { ...v, title: e.target.value } : v,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </label>
                <label className={label}>
                  Subtitle
                  <input
                    className={input}
                    value={inv.subtitle}
                    onChange={(e) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              invitations: s.invitations.map((v, i) =>
                                i === ii ? { ...v, subtitle: e.target.value } : v,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </label>
                <label className={`${label} sm:col-span-2`}>
                  Invitation URL (iframe)
                  <input
                    className={input}
                    value={inv.url}
                    onChange={(e) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              invitations: s.invitations.map((v, i) =>
                                i === ii ? { ...v, url: e.target.value } : v,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── GUESTLISTS TAB ── */}
      {tab === "guestlists" && (
        <div className="space-y-4">
          {settings.guestlists.map((gl, gi) => (
            <div key={gl.id} className="rounded-2xl border border-line bg-white p-5">
              <h3 className="mb-3 text-[11px] uppercase tracking-[0.24em] text-muted">
                Guestlist {gi + 1}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={label}>
                  Title
                  <input
                    className={input}
                    value={gl.title}
                    onChange={(e) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              guestlists: s.guestlists.map((v, i) =>
                                i === gi ? { ...v, title: e.target.value } : v,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </label>
                <label className={label}>
                  Subtitle
                  <input
                    className={input}
                    value={gl.subtitle}
                    onChange={(e) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              guestlists: s.guestlists.map((v, i) =>
                                i === gi ? { ...v, subtitle: e.target.value } : v,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </label>
                <label className={label}>
                  Canva embed URL (view?embed)
                  <input
                    className={input}
                    value={gl.embedUrl}
                    onChange={(e) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              guestlists: s.guestlists.map((v, i) =>
                                i === gi ? { ...v, embedUrl: e.target.value } : v,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </label>
                <label className={label}>
                  Open in Canva URL
                  <input
                    className={input}
                    value={gl.openUrl}
                    onChange={(e) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              guestlists: s.guestlists.map((v, i) =>
                                i === gi ? { ...v, openUrl: e.target.value } : v,
                              ),
                            }
                          : s,
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BUDGET (GOOGLE SHEET) TAB ── */}
      {tab === "budget" && (
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-4 text-[11px] uppercase tracking-[0.24em] text-muted">
            Budget source — Google Spreadsheet
          </h3>
          <label className={label}>
            Google Spreadsheet URL
            <input
              className={input}
              value={settings.budgetSheetUrl}
              placeholder="Paste your sheet URL here…"
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, budgetSheetUrl: e.target.value } : s,
                )
              }
            />
          </label>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-[12px] text-muted">
            <li>
              Share the sheet as <b>“Anyone with the link can view”</b> —
              the Budget page only reads, it never changes your sheet.
            </li>
            <li>
              The first row of the sheet must be the column headers. Supported
              columns: Item · Event · Category · Estimated · Actual · Paid
              (yes/no).
            </li>
            <li>
              For a specific tab in the sheet, copy the URL containing that
              tab's <code>gid=</code>.
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
