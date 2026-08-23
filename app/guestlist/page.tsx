"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import CanvaEmbed from "@/components/CanvaEmbed"
import { site, type Guestlist } from "@/content/site"
import { usePermissions } from "@/hooks/usePermissions"

type Guest = {
	_id: string
	name: string
	event: "nikah" | "sanding" | "tandang"
	side: "bride" | "groom"
	pax: number
	phone: string
	note: string
	status: "dijemput" | "disahkan" | "tidak_hadir"
	/** Which invitation this guest belongs to, e.g. "Abah's invitation" */
	invitedBy: string
	/** Customizable category, e.g. "Family", "Friends", "VIP" */
	category: string
	createdAt: string
}

type GuestOption = {
	_id: string
	name: string
	/** Categories only: the invitation (inviter) that owns this category. */
	owner?: string
	/** Inviters only: which side this invitation belongs to. */
	side?: "bride" | "groom"
	createdAt: string
}

const EVENT_LABEL: Record<Guest["event"], string> = {
	nikah: "💍 Nikah",
	sanding: "🌸 Sanding",
	tandang: "🏡 Tandang",
}

const SIDE_LABEL: Record<Guest["side"], string> = {
	bride: "Nadia's side",
	groom: "Eiman's side",
}

const STATUS_META: Record<Guest["status"], { label: string; cls: string }> = {
	dijemput: { label: "Invited", cls: "bg-cream text-muted border-line" },
	disahkan: { label: "Confirmed ✓", cls: "bg-sage-soft text-sage border-sage/30" },
	tidak_hadir: {
		label: "Not attending",
		cls: "bg-[#FBEFEE] text-[#A0524B] border-[#E4C5C2]",
	},
}

const inputCls =
	"rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-sage"

type ImportedGuest = {
	name: string
	event: Guest["event"]
	side: Guest["side"]
	pax: number
	phone: string
	note: string
	status: Guest["status"]
	invitedBy: string
	category: string
}

/** Minimal quote-aware CSV parser (handles quoted fields and CRLF). */
function parseCsv(text: string): string[][] {
	const rows: string[][] = []
	let row: string[] = []
	let field = ""
	let inQuotes = false
	for (let i = 0; i < text.length; i++) {
		const ch = text[i]
		if (inQuotes) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					field += '"'
					i++
				} else {
					inQuotes = false
				}
			} else {
				field += ch
			}
		} else if (ch === '"') {
			inQuotes = true
		} else if (ch === ",") {
			row.push(field)
			field = ""
		} else if (ch === "\n" || ch === "\r") {
			if (ch === "\r" && text[i + 1] === "\n") i++
			row.push(field)
			field = ""
			rows.push(row)
			row = []
		} else {
			field += ch
		}
	}
	if (field !== "" || row.length > 0) {
		row.push(field)
		rows.push(row)
	}
	return rows
}

function matchEvent(v: string): Guest["event"] {
	const s = v.toLowerCase()
	if (s.includes("nikah")) return "nikah"
	if (s.includes("tandang")) return "tandang"
	return "sanding"
}

function matchSide(v: string): Guest["side"] {
	const s = v.toLowerCase()
	if (/(bride|nadia|perempuan|wanita)/.test(s)) return "bride"
	return "groom"
}

function matchStatus(v: string): Guest["status"] {
	const s = v.toLowerCase()
	// Check negatives first so "not attending" isn't caught by "attend".
	if (/(not|tidak|decline|no\b|absent|can'?t|cannot)/.test(s))
		return "tidak_hadir"
	if (/(confirm|disah|hadir\b|yes|attend|coming|rsvp|going)/.test(s))
		return "disahkan"
	return "dijemput"
}

/**
 * Map parsed CSV rows (exported from the Canva guest list) to guest records.
 * The header row is matched flexibly against common EN/MY column names.
 */
function rowsToGuests(rows: string[][]): ImportedGuest[] {
	if (rows.length < 2) return []
	const header = rows[0].map((h) => h.trim().toLowerCase())
	const col = (...names: string[]) =>
		header.findIndex((h) => names.some((n) => h.includes(n)))
	const iName = col("name", "nama", "guest", "tetamu", "family", "keluarga")
	const iEvent = col("event", "majlis")
	const iSide = col("side", "pihak")
	const iPax = col("pax", "seat", "kerusi", "bilangan", "qty", "quantity")
	const iPhone = col("phone", "tel", "telefon", "contact", "hp", "no.")
	const iStatus = col("status", "rsvp", "kehadiran", "attend")
	const iNote = col("note", "nota", "remark", "catatan", "wish", "ucapan", "message")
	const iInvitedBy = col("invited by", "invitedby", "invitation", "jemputan", "di jemput", "dijemput oleh")
	const iCategory = col("category", "kategori", "group", "kategori tetamu")
	const nameIdx = iName >= 0 ? iName : 0
	return rows
		.slice(1)
		.map((r) => ({
			name: (r[nameIdx] ?? "").trim(),
			event: iEvent >= 0 ? matchEvent(r[iEvent] ?? "") : "sanding",
			side: iSide >= 0 ? matchSide(r[iSide] ?? "") : "groom",
			pax: iPax >= 0 ? Math.max(1, Math.round(Number((r[iPax] ?? "").replace(/[^0-9.]/g, "")) || 1)) : 1,
			phone: iPhone >= 0 ? (r[iPhone] ?? "").trim() : "",
			note: iNote >= 0 ? (r[iNote] ?? "").trim() : "",
			status: iStatus >= 0 ? matchStatus(r[iStatus] ?? "") : "dijemput",
			invitedBy: iInvitedBy >= 0 ? (r[iInvitedBy] ?? "").trim() : "",
			category: iCategory >= 0 ? (r[iCategory] ?? "").trim() : "",
		}))
		.filter((g) => g.name)
}

/**
 * Editable pax counter with natural typing behaviour:
 * - clearing the field falls back to 0 (visible in the field)
 * - typing digits updates the value live
 * - never commits 0/negative while editing inline (blurs back to 1);
 *   with `allowZero` (add form) a 0 is kept so submit can reject it.
 */
function PaxInput({
	value,
	onCommit,
	className,
	ariaLabel,
	allowZero = false,
}: {
	value: number
	onCommit: (pax: number) => void
	className?: string
	ariaLabel?: string
	allowZero?: boolean
}) {
	// Draft holds the raw field text while it is invalid/being edited;
	// null means "just show the committed value".
	const [draft, setDraft] = useState<string | null>(null)
	return (
		<input
			type="number"
			min={1}
			className={className}
			aria-label={ariaLabel}
			value={draft ?? String(value)}
			onChange={(e) => {
				const raw = e.target.value
				const n = Math.round(Number(raw))
				if (raw === "" || !Number.isFinite(n) || n < 1) {
					// Cleared or zero/negative — show 0, only the add form keeps it.
					if (allowZero) onCommit(0)
					setDraft("0")
					return
				}
				setDraft(null)
				onCommit(n)
			}}
			onBlur={() => {
				// Inline edits have no submit button to validate — an empty/
				// zero draft snaps back to the safe default of 1.
				if (!allowZero && draft !== null) {
					setDraft(null)
					onCommit(1)
				}
			}}
		/>
	)
}

export default function GuestlistPage() {
	const { can, eventScope } = usePermissions()
	const [guests, setGuests] = useState<Guest[]>([])
	const [inviters, setInviters] = useState<GuestOption[]>([])
	const [categories, setCategories] = useState<GuestOption[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [importing, setImporting] = useState(false)
	const [importInfo, setImportInfo] = useState<string | null>(null)
	const canEdit = can("edit_guests")
	// Event-scoped editors may only touch guests of their own events;
	// "general" — or no scope at all — means full access.
	const canEditEvent = (ev: Guest["event"]) =>
		!eventScope || eventScope.includes("general") || eventScope.includes(ev)
	const canEditGuest = (g: Guest) => canEdit && canEditEvent(g.event)

	// Row editing — guests are edited through a form with an explicit Save.
	const [editingId, setEditingId] = useState<string | null>(null)
	const [draft, setDraft] = useState<Partial<Guest>>({})

	// Filters
	const [filterEvent, setFilterEvent] = useState<Guest["event"]>("nikah")
	const [filterSide, setFilterSide] = useState<"semua" | Guest["side"]>("semua")
	const [filterInvitedBy, setFilterInvitedBy] = useState<string>("semua")
	const [filterCategory, setFilterCategory] = useState<string>("semua")

	// Search / sort / pagination
	const [search, setSearch] = useState("")
	const [sortBy, setSortBy] = useState<"default" | "name" | "invitedBy" | "category">("default")
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
	const [pageSize, setPageSize] = useState<10 | 20 | 50 | 100 | "all">(20)
	const [page, setPage] = useState(1)

	// Add form
	const [name, setName] = useState("")
	const [event, setEvent] = useState<Guest["event"]>("sanding")
	const [side, setSide] = useState<Guest["side"]>("groom")
	const [pax, setPax] = useState(1)
	const [phone, setPhone] = useState("")
	const [invitedBy, setInvitedBy] = useState("")
	const [category, setCategory] = useState("")
	// List changes are authorized against the active guest event.
	const canManageLists = canEdit && canEditEvent(event)

	// Inviter manager
	const [newInviter, setNewInviter] = useState("")
	const [newInviterSide, setNewInviterSide] = useState<"bride" | "groom">("groom")
	const [editingInviterId, setEditingInviterId] = useState<string | null>(null)
	const [editingInviterName, setEditingInviterName] = useState("")

	// Category manager
	const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
	const [editingCategoryName, setEditingCategoryName] = useState("")

	// Canva reference embeds (live settings, falls back to defaults)
	const [canva, setCanva] = useState<Guestlist[]>(site.guestlists)

	// Keep the add-form event inside the editor's scope.
	useEffect(() => {
		if (canEdit && !canEditEvent(event)) {
			const first = (Object.keys(EVENT_LABEL) as Guest["event"][]).find(canEditEvent)
			if (first) setEvent(first)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [eventScope, canEdit])

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch("/api/guests", { cache: "no-store" })
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error loading guests.")
			setGuests(data.guests)
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error loading guests.")
		} finally {
			setLoading(false)
		}
	}, [])

	const loadInviters = useCallback(async () => {
		try {
			const res = await fetch("/api/guest-inviters", { cache: "no-store" })
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error loading inviters.")
			setInviters(data.inviters)
		} catch {
			// Non-fatal: the "invited by" options just stay empty.
		}
	}, [])

	const loadCategories = useCallback(async () => {
		try {
			const res = await fetch("/api/guest-categories", { cache: "no-store" })
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error loading categories.")
			setCategories(data.categories)
		} catch {
			// Non-fatal: the category options just stay empty.
		}
	}, [])

	useEffect(() => {
		load()
		loadInviters()
		loadCategories()
		fetch("/api/settings", { cache: "no-store" })
			.then((r) => r.json())
			.then((d) => {
				if (Array.isArray(d?.settings?.guestlists)) setCanva(d.settings.guestlists)
			})
			.catch(() => {})
	}, [load])

	const addGuest = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim() || saving) return
		if (pax < 1) {
			setError("Pax must be at least 1 — how many seats does this guest need?")
			return
		}
		// A category only makes sense together with the invitation that owns it.
		if (category && !invitedBy) {
			setError("Choose an invitation first — categories belong to an invitation.")
			return
		}
		if (category && !categories.some((c) => c.name === category && c.owner === invitedBy)) {
			setError(`"${category}" is not a category of the "${invitedBy}" invitation.`)
			return
		}
		setSaving(true)
		try {
			const res = await fetch("/api/guests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, event, side, pax, phone, invitedBy, category }),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error saving guest.")
			setGuests((g) => [...g, data.guest])
			setName("")
			setPhone("")
			setPax(1)
			setError(null)
		} catch (e2) {
			setError(e2 instanceof Error ? e2.message : "Error saving guest.")
		} finally {
			setSaving(false)
		}
	}

	/** Add an "invited by" option (e.g. "Abah's invitation"). */
	const addInviter = async (rawName: string, side: "bride" | "groom" = "groom") => {
		const trimmed = rawName.trim()
		if (!trimmed) return
		try {
			const res = await fetch("/api/guest-inviters", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: trimmed, event, side }),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error adding inviter.")
			setInviters((list) => [...list, data.inviter])
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error adding inviter.")
		}
	}

	/** Add a guest category (e.g. Eiman → BSN, Abah → Family). */
	const addCategory = async (rawName: string, owner: string) => {
		const trimmed = rawName.trim()
		if (!trimmed || !owner) return
		try {
			const res = await fetch("/api/guest-categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: trimmed, owner, event }),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error adding category.")
			setCategories((list) => [...list, data.category])
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error adding category.")
		}
	}

	/** Rename an inviter — cascades to all guests referencing the old name. */
	const renameInviter = async (id: string, rawName: string) => {
		const trimmed = rawName.trim()
		if (!trimmed) return
		setInviters((list) =>
			list.map((i) => (i._id === id ? { ...i, name: trimmed } : i)),
		)
		try {
			const res = await fetch(`/api/guest-inviters/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: trimmed, event }),
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error ?? "Error renaming inviter.")
			}
			const prev = inviters.find((i) => i._id === id)
			if (prev) {
				// Optimistically rename guests locally too (the API cascades in DB).
				setGuests((gs) =>
					gs.map((g) =>
						g.invitedBy === prev.name ? { ...g, invitedBy: trimmed } : g,
					),
				)
			}
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error renaming inviter.")
			loadInviters()
			load()
		}
	}

	/** Delete an inviter — guests referencing it are unassigned, and its
	    owned categories are removed. */
	const removeInviter = async (id: string) => {
		const prev = inviters.find((i) => i._id === id)
		setInviters((list) => list.filter((i) => i._id !== id))
		try {
			const res = await fetch(`/api/guest-inviters/${id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ event }),
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error ?? "Error deleting inviter.")
			}
			if (prev) {
				setGuests((gs) =>
					gs.map((g) =>
						g.invitedBy === prev.name ? { ...g, invitedBy: "", category: "" } : g,
					),
				)
				// The API deletes categories owned by this inviter — mirror locally.
				setCategories((list) => list.filter((c) => c.owner !== prev.name))
			}
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error deleting inviter.")
			loadInviters()
			loadCategories()
			load()
		}
	}

	/** Rename a category — cascades to all guests using the old name. */
	const renameCategory = async (id: string, rawName: string, owner?: string) => {
		const trimmed = rawName.trim()
		if (!trimmed) return
		setCategories((list) =>
			list.map((c) => (c._id === id ? { ...c, name: trimmed, owner: owner ?? c.owner } : c)),
		)
		try {
			const res = await fetch(`/api/guest-categories/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(owner !== undefined ? { name: trimmed, owner, event } : { name: trimmed, event }),
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error ?? "Error renaming category.")
			}
			const prev = categories.find((c) => c._id === id)
			if (prev) {
				// Optimistically rename guests locally too (the API cascades in DB).
				setGuests((gs) =>
					gs.map((g) =>
						g.category === prev.name ? { ...g, category: trimmed } : g,
					),
				)
			}
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error renaming category.")
			loadCategories()
			load()
		}
	}

	/** Delete a category — guests using it are unassigned. */
	const removeCategory = async (id: string) => {
		const prev = categories.find((c) => c._id === id)
		setCategories((list) => list.filter((c) => c._id !== id))
		try {
			const res = await fetch(`/api/guest-categories/${id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ event }),
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error ?? "Error deleting category.")
			}
			if (prev) {
				setGuests((gs) =>
					gs.map((g) =>
						g.category === prev.name ? { ...g, category: "" } : g,
					),
				)
			}
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error deleting category.")
			loadCategories()
			load()
		}
	}

	const patchGuest = async (id: string, updates: Partial<Guest>) => {
		// Keep category ↔ invitation consistent: if either changes, validate
		// that the resulting category belongs to the resulting invitation.
		const current = guests.find((g) => g._id === id)
		if (current) {
			const nextInvitedBy = updates.invitedBy ?? current.invitedBy
			const nextCategory = updates.category !== undefined ? updates.category : current.category
			if (nextCategory && nextCategory !== current.category) {
				if (!nextInvitedBy) {
					setError("Choose an invitation first — categories belong to an invitation.")
					return
				}
				const valid = categories.some(
					(c) => c.name === nextCategory && c.owner === nextInvitedBy,
				)
				if (!valid) {
					setError(`"${nextCategory}" is not a category of the "${nextInvitedBy}" invitation.`)
					return
				}
			}
			// Changing the invitation invalidates a category from another owner.
			if (
				updates.invitedBy !== undefined &&
				updates.invitedBy !== current.invitedBy &&
				nextCategory &&
				!categories.some((c) => c.name === nextCategory && c.owner === nextInvitedBy)
			) {
				// Clear the stale category along with the invitation change.
				updates = { ...updates, category: "" }
			}
		}
		setGuests((g) => g.map((x) => (x._id === id ? { ...x, ...updates } : x)))
		try {
			const res = await fetch(`/api/guests/${id}`, {
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

	const removeGuest = async (id: string) => {
		setGuests((g) => g.filter((x) => x._id !== id))
		try {
			const res = await fetch(`/api/guests/${id}`, { method: "DELETE" })
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error ?? "Error deleting.")
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error deleting.")
			load()
		}
	}

	/** Open the edit form for a guest (nothing is sent until Save). */
	const beginEdit = (g: Guest) => {
		setEditingId(g._id)
		setDraft({
			name: g.name,
			event: g.event,
			side: g.side,
			pax: g.pax,
			phone: g.phone,
			invitedBy: g.invitedBy,
			category: g.category,
			status: g.status,
			note: g.note,
		})
	}

	const cancelEdit = () => {
		setEditingId(null)
		setDraft({})
	}

	/** Save the edit form — validate, then send a single PATCH. */
	const saveEdit = async () => {
		if (!editingId) return
		if (!draft.name?.trim()) {
			setError("Guest name is required.")
			return
		}
		if ((draft.pax ?? 1) < 1) {
			setError("Pax must be at least 1 — how many seats does this guest need?")
			return
		}
		if (draft.event && !canEditEvent(draft.event)) {
			setError("You can only edit guests for your own events.")
			return
		}
		await patchGuest(editingId, draft)
		setEditingId(null)
		setDraft({})
	}

	// Delete confirmation popup
	const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null)

	const confirmDeleteGuest = async () => {
		if (!deletingGuest) return
		removeGuest(deletingGuest._id)
		setDeletingGuest(null)
	}
	// stays the source of truth (shown below); this brings the same rows into
	// the project so they render in the app's own table and are saved.
	const importCsv = async (file: File) => {
		if (importing) return
		setImporting(true)
		setImportInfo(null)
		try {
			const rows = parseCsv(await file.text())
			const parsed = rowsToGuests(rows)
			if (parsed.length === 0) {
				throw new Error(
					"No guests found in the CSV. Make sure it has a header row with at least a Name column.",
				)
			}
			const res = await fetch("/api/guests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ guests: parsed }),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error importing guests.")
			setGuests((g) => [...g, ...data.guests])
			// Register any new "invited by" values from the CSV as options.
			const knownInviters = new Set(inviters.map((i) => i.name.toLowerCase()))
			const freshInviters = Array.from(
				new Set(
					parsed.map((g) => g.invitedBy).filter((n) => n && !knownInviters.has(n.toLowerCase())),
				),
			)
			for (const n of freshInviters) await addInviter(n)
			// Register new category values per their invitation (owner).
			const knownCats = new Set(categories.map((c) => `${c.owner}\u0000${c.name}`.toLowerCase()))
			const freshCats = Array.from(
				new Set(
					parsed
						.filter((g) => g.category && g.invitedBy)
						.map((g) => `${g.invitedBy}\u0000${g.category}`),
				),
			).filter((key) => !knownCats.has(key.toLowerCase()))
			for (const key of freshCats) {
				const [owner, catName] = key.split("\u0000")
				await addCategory(catName, owner)
			}
			setImportInfo(`Imported ${data.inserted} guests from Canva CSV.`)
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error importing guests.")
		} finally {
			setImporting(false)
		}
	}

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase()
		return guests.filter(
			(g) =>
				g.event === filterEvent &&
				(filterSide === "semua" || g.side === filterSide) &&
				(filterInvitedBy === "semua" || g.invitedBy === filterInvitedBy) &&
				(filterCategory === "semua" || g.category === filterCategory) &&
				(!q ||
					g.name.toLowerCase().includes(q) ||
					(g.phone ?? "").toLowerCase().includes(q) ||
					(g.note ?? "").toLowerCase().includes(q) ||
					(g.invitedBy ?? "").toLowerCase().includes(q) ||
					(g.category ?? "").toLowerCase().includes(q)),
		)
	}, [guests, filterEvent, filterSide, filterInvitedBy, filterCategory, search])

	// Sorted view — "default" keeps the insertion (createdAt) order.
	const sorted = useMemo(() => {
		if (sortBy === "default") return filtered
		const dir = sortDir === "asc" ? 1 : -1
		return [...filtered].sort((a, b) => {
			const av = String(a[sortBy] ?? "").toLowerCase()
			const bv = String(b[sortBy] ?? "").toLowerCase()
			// Alphabetical on the chosen column; ties always fall back to name.
			if (av === bv) return a.name.localeCompare(b.name)
			return av.localeCompare(bv) * dir
		})
	}, [filtered, sortBy, sortDir])

	// Pagination — clamp the current page into the valid range.
	const totalCount = sorted.length
	const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(totalCount / pageSize))
	const safePage = Math.min(page, totalPages)
	const paged = useMemo(
		() =>
			pageSize === "all"
				? sorted
				: sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
		[sorted, pageSize, safePage],
	)
	const rowNumber = useCallback(
		(i: number) => (pageSize === "all" ? i + 1 : (safePage - 1) * pageSize + i + 1),
		[pageSize, safePage],
	)

	// Any filter/search/sort/page-size change sends the user back to page 1.
	useEffect(() => {
		setPage(1)
	}, [search, filterEvent, filterSide, filterInvitedBy, filterCategory, pageSize, sortBy, sortDir])

	// Compact page list with ellipsis, e.g. 1 … 4 5 6 … 12
	const pageItems = useMemo(() => {
		const items: Array<number | "…"> = []
		for (let n = 1; n <= totalPages; n++) {
			if (n === 1 || n === totalPages || Math.abs(n - safePage) <= 1) {
				items.push(n)
		} else if (items[items.length - 1] !== "…") {
				items.push("…")
		}
		}
		return items
	}, [totalPages, safePage])

	// Attending pax excludes guests marked "not attending" — their seats are
	// released. totalPax = everyone still coming; declinedPax = seats freed up.
	const declinedPax = filtered
		.filter((g) => g.status === "tidak_hadir")
		.reduce((sum, g) => sum + (g.pax || 0), 0)
	const totalPax = filtered
		.filter((g) => g.status !== "tidak_hadir")
		.reduce((sum, g) => sum + (g.pax || 0), 0)
	const confirmedPax = filtered
		.filter((g) => g.status === "disahkan")
		.reduce((sum, g) => sum + (g.pax || 0), 0)

	// "Invited by" options = managed inviters + any value already on a guest
	// (so legacy guests never lose their label in the dropdown). When a side
	// filter is active, only invitations belonging to that side are listed.
	const invitedByOptions = useMemo(() => {
		const names = new Set(inviters.map((i) => i.name))
		for (const g of guests) if (g.invitedBy) names.add(g.invitedBy)
		return Array.from(names).sort((a, b) => a.localeCompare(b))
	}, [inviters, guests])

	// Derive each invitation's side: the stored side on the inviter, else the
	// side of its guests (an invitation like Abah's only ever hosts one side).
	const inviterSide = useMemo(() => {
		const map = new Map<string, "bride" | "groom">()
		for (const i of inviters) if (i.side) map.set(i.name, i.side)
		for (const g of guests) {
			if (g.invitedBy && !map.has(g.invitedBy)) map.set(g.invitedBy, g.side)
		}
		return map
	}, [inviters, guests])

	// "Invited by" filter options scoped to the selected side.
	const invitedByFilterOptions = useMemo(() => {
		if (filterSide === "semua") return invitedByOptions
		return invitedByOptions.filter((n) => inviterSide.get(n) === filterSide)
	}, [filterSide, invitedByOptions, inviterSide])

	// If the chosen invitation isn't on the selected side, reset it.
	useEffect(() => {
		if (filterInvitedBy === "semua") return
		if (!invitedByFilterOptions.includes(filterInvitedBy)) setFilterInvitedBy("semua")
	}, [filterSide, invitedByFilterOptions, filterInvitedBy])

	// Category options work the same way, but are OWNED BY an invitation —
	// "Eiman → BSN" only appears when the Eiman invitation is selected.
	const categoriesFor = useCallback(
		(owner: string | undefined) =>
			owner
				? categories
						.filter((c) => c.owner === owner)
						.map((c) => c.name)
						.sort((a, b) => a.localeCompare(b))
				: [],
		[categories],
	)

	// All categories (used by the "All categories" filter dropdown).
	const categoryOptions = useMemo(() => {
		const names = new Set(categories.map((c) => c.name))
		for (const g of guests) if (g.category) names.add(g.category)
		return Array.from(names).sort((a, b) => a.localeCompare(b))
	}, [categories, guests])

	// Category filter options depend on the selected invitation: when an
	// invitation is chosen, only its owned categories are listed; otherwise
	// every category is available.
	const categoryFilterOptions = useMemo(
		() => (filterInvitedBy === "semua" ? categoryOptions : categoriesFor(filterInvitedBy)),
		[filterInvitedBy, categoryOptions, categoriesFor],
	)

	// If the chosen category isn't owned by the selected invitation, reset it.
	useEffect(() => {
		if (filterCategory === "semua") return
		if (!categoryFilterOptions.includes(filterCategory)) setFilterCategory("semua")
	}, [filterInvitedBy, categoryFilterOptions, filterCategory])

	/** Shared edit form rendered under a guest row while it is edited. */
	const guestEditForm = () => (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				saveEdit()
			}}
			className="grid grid-cols-2 gap-2 rounded-xl border border-sage/40 bg-cream/50 p-3 md:grid-cols-3 xl:grid-cols-4"
		>
			<label className="block">
				<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Name</span>
				<input
					className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
					value={draft.name ?? ""}
					onChange={(e) => setDraft({ ...draft, name: e.target.value })}
					required
				/>
			</label>
			<label className="block">
				<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Event</span>
				<select
					className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
					value={draft.event ?? "sanding"}
					onChange={(e) => setDraft({ ...draft, event: e.target.value as Guest["event"] })}
				>
					{Object.entries(EVENT_LABEL)
						.filter(([v]) => canEditEvent(v as Guest["event"]))
						.map(([v, l]) => (
							<option key={v} value={v}>{l}</option>
						))}
				</select>
			</label>
			<label className="block">
				<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Side</span>
				<select
					className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
					value={draft.side ?? "groom"}
					onChange={(e) => setDraft({ ...draft, side: e.target.value as Guest["side"] })}
				>
					{Object.entries(SIDE_LABEL).map(([v, l]) => (
						<option key={v} value={v}>{l}</option>
					))}
				</select>
			</label>
			<label className="block">
				<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Invited by</span>
				<select
					className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
					value={draft.invitedBy ?? ""}
					onChange={(e) => setDraft({ ...draft, invitedBy: e.target.value, category: "" })}
				>
					<option value="">—</option>
					{invitedByOptions.map((n) => (
						<option key={n} value={n}>{n}</option>
					))}
				</select>
			</label>
			<label className="block">
				<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Category</span>
				<select
					className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage disabled:opacity-50"
					value={draft.category ?? ""}
					onChange={(e) => setDraft({ ...draft, category: e.target.value })}
					disabled={!draft.invitedBy}
				>
					<option value="">{draft.invitedBy ? "—" : "Pick invitation"}</option>
					{categoriesFor(draft.invitedBy).map((n) => (
						<option key={n} value={n}>{n}</option>
					))}
				</select>
			</label>
			<label className="block">
				<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Pax</span>
				<PaxInput
					className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
					value={draft.pax ?? 1}
					onCommit={(n) => setDraft({ ...draft, pax: n })}
					allowZero
				/>
			</label>
			<label className="block">
				<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Phone</span>
				<input
					className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
					value={draft.phone ?? ""}
					onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
					placeholder="Optional"
				/>
			</label>
			<label className="block">
				<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
				<select
					className={`w-full rounded-lg border px-2 py-1.5 text-[12px] ${STATUS_META[draft.status ?? "dijemput"].cls}`}
					value={draft.status ?? "dijemput"}
					onChange={(e) => setDraft({ ...draft, status: e.target.value as Guest["status"] })}
				>
					{Object.entries(STATUS_META).map(([v, m]) => (
						<option key={v} value={v}>{m.label}</option>
					))}
				</select>
			</label>
			<label className="col-span-2 block md:col-span-1">
				<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Note</span>
				<input
					className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
					value={draft.note ?? ""}
					onChange={(e) => setDraft({ ...draft, note: e.target.value })}
					placeholder="Optional"
				/>
			</label>
			<div className="col-span-2 flex flex-wrap gap-2 md:col-span-3 xl:col-span-4">
				<button
					type="submit"
					className="rounded-lg bg-sage px-5 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
				>
					Save
				</button>
				<button
					type="button"
					onClick={cancelEdit}
					className="rounded-lg border border-line bg-white px-5 py-2 text-[12px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
				>
					Cancel
				</button>
			</div>
		</form>
	)

	return (
		<div className="mx-auto max-w-[1100px] px-5 pb-20 pt-24">
			<header className="py-10 text-center">
				<p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">
					Guest List
				</p>
				<h1 className="font-serif text-4xl text-ink">Our guests</h1>
				<p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-relaxed text-muted">
					{canEdit
						? "The guest list is saved — use the edit ✎ and delete 🗑 buttons on each guest. Changes are only applied when you press Save. Guests belong to an invitation (e.g. Eiman, Abah) and each invitation owns its own categories (e.g. Eiman → BSN)."
						: "The guest list for all our celebrations."}
				</p>
			</header>

			{error && (
				<div className="mb-6 rounded-xl border border-[#E4C5C2] bg-[#FBEFEE] px-4 py-3 text-[13px] text-[#A0524B]">
					{error}
				</div>
			)}

			{/* Add guest */}
			{canEdit && <form
				onSubmit={addGuest}
				className="mb-8 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] md:grid-cols-3 xl:grid-cols-[minmax(180px,1.8fr)_minmax(96px,1fr)_minmax(96px,1fr)_minmax(120px,1.2fr)_minmax(96px,1fr)_minmax(64px,0.6fr)_minmax(110px,1fr)_auto]"
			>
				<input
					className={`${inputCls} col-span-2 md:col-span-3 xl:col-span-1`}
					placeholder="Guest / family name…"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<select
					className={inputCls}
					value={event}
					onChange={(e) => setEvent(e.target.value as Guest["event"])}
				>
					{Object.entries(EVENT_LABEL)
						.filter(([v]) => canEditEvent(v as Guest["event"]))
						.map(([v, l]) => (
							<option key={v} value={v}>{l}</option>
						))}
				</select>
				<select
					className={inputCls}
					value={side}
					onChange={(e) => setSide(e.target.value as Guest["side"])}
				>
					<option value="groom">Eiman's side</option>
					<option value="bride">Nadia's side</option>
				</select>
				<select
					className={inputCls}
					value={invitedBy}
					onChange={(e) => {
						setInvitedBy(e.target.value)
						// Categories belong to an invitation — reset when it changes.
						setCategory("")
					}}
				>
					<option value="">Invited by…</option>
					{invitedByOptions.map((n) => (
						<option key={n} value={n}>
							{n}
						</option>
					))}
				</select>
				<select
					className={inputCls}
					value={category}
					onChange={(e) => setCategory(e.target.value)}
					disabled={!invitedBy}
					title={!invitedBy ? "Choose an invitation first" : undefined}
				>
					<option value="">
						{invitedBy ? "Category…" : "Pick invitation first"}
					</option>
					{categoriesFor(invitedBy).map((n) => (
						<option key={n} value={n}>
							{n}
						</option>
					))}
				</select>
				<PaxInput
					className={inputCls}
					value={pax}
					onCommit={setPax}
					allowZero
					ariaLabel="Pax"
				/>
				<input
					className={inputCls}
					placeholder="Phone (optional)"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
				/>
				<button
					type="submit"
					disabled={saving}
					className="col-span-2 rounded-lg bg-sage px-5 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-50 md:col-span-1 md:col-start-2 xl:col-span-1 xl:col-start-auto"
				>
					{saving ? "Saving…" : "+ Add"}
				</button>
			</form>}

			{/* Filters + stats */}
			<div className="mb-4 space-y-3">
				{/* Event buttons */}
				<div className="flex flex-wrap gap-2">
					{(Object.entries(EVENT_LABEL) as [Guest["event"], string][]).map(([ev, label]) => (
						<button
							key={ev}
							type="button"
							onClick={() => setFilterEvent(ev)}
							className={`rounded-lg border px-5 py-2 text-[12px] uppercase tracking-[0.14em] transition-all ${
								filterEvent === ev
									? "border-sage bg-sage text-white shadow-sm"
									: "border-line bg-white text-muted hover:border-sage/40 hover:text-ink"
							}`}
						>
							{label}
						</button>
					))}
				</div>

				{/* Other filters + stats */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap gap-2">
						{/* Search — matches name, phone, note, invitation, category */}
						<input
							className={`${inputCls} min-w-[180px] flex-1 md:flex-none md:w-56`}
							type="search"
							placeholder="🔍 Search guests…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							aria-label="Search guests"
						/>
						<select
							className={inputCls}
							value={filterSide}
							onChange={(e) => setFilterSide(e.target.value as typeof filterSide)}
						>
							<option value="semua">Both sides</option>
							<option value="groom">Eiman's side</option>
							<option value="bride">Nadia's side</option>
						</select>
						<select
							className={inputCls}
							value={filterInvitedBy}
							onChange={(e) => setFilterInvitedBy(e.target.value)}
						>
							<option value="semua">All invitations</option>
							{invitedByFilterOptions.map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
						<select
							className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-50`}
							value={filterCategory}
							onChange={(e) => setFilterCategory(e.target.value)}
							disabled={filterInvitedBy === "semua"}
							title={filterInvitedBy === "semua" ? "Choose an invitation first" : undefined}
						>
							<option value="semua">
								{filterInvitedBy === "semua" ? "Pick invitation first" : "All categories"}
							</option>
							{categoryFilterOptions.map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>
					<div className="flex flex-wrap items-center gap-2 text-[12px]">
						<span className="rounded-full border border-line bg-white px-3 py-1.5 text-muted">
							{totalCount} guest group{totalCount === 1 ? "" : "s"}
							{search && <span className="text-muted/70"> found</span>}
						</span>
						<span className="rounded-full border border-line bg-white px-3 py-1.5 text-muted">
							Total pax: <b className="text-ink">{totalPax}</b>
						</span>
						<span className="rounded-full border border-sage/30 bg-sage-soft px-3 py-1.5 text-sage">
							Confirmed: <b>{confirmedPax} pax</b>
						</span>
						{declinedPax > 0 && (
							<span className="rounded-full border border-[#E4C5C2] bg-[#FBEFEE] px-3 py-1.5 text-[#A0524B]">
								Not attending: <b>{declinedPax} pax</b>
							</span>
						)}
						{/* Sort by name / invited by / category */}
						<select
							className={`${inputCls} py-1.5`}
							value={sortBy}
							onChange={(e) => {
								const v = e.target.value as typeof sortBy
								// Re-selecting the active column flips the direction.
								if (v === sortBy && v !== "default") {
									setSortDir((d) => (d === "asc" ? "desc" : "asc"))
								} else {
									setSortBy(v)
									setSortDir("asc")
								}
							}}
							aria-label="Sort by"
						>
							<option value="default">Sort: default</option>
							<option value="name">Sort: name</option>
							<option value="invitedBy">Sort: invited by</option>
							<option value="category">Sort: category</option>
						</select>
						{sortBy !== "default" && (
							<button
								type="button"
								className="rounded-full border border-line bg-white px-2.5 py-1.5 text-[11px] text-muted transition-colors hover:text-ink"
								onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
								aria-label={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
								title={sortDir === "asc" ? "Ascending ↑ — click for descending" : "Descending ↓ — click for ascending"}
							>
								{sortDir === "asc" ? "↑ A–Z" : "↓ Z–A"}
							</button>
						)}
						{/* Rows per page */}
						<select
							className={`${inputCls} py-1.5`}
							value={String(pageSize)}
							onChange={(e) =>
								setPageSize(e.target.value === "all" ? "all" : (Number(e.target.value) as 10 | 20 | 50 | 100))
							}
							aria-label="Rows per page"
						>
							<option value="10">10 / page</option>
							<option value="20">20 / page</option>
							<option value="50">50 / page</option>
							<option value="100">100 / page</option>
							<option value="all">Show all</option>
						</select>
					</div>
				</div>
			</div>

			{/* Guest table — cards on small screens, table from md up */}
			<div className="rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
				{/* Mobile: one card per guest */}
				<ul className="divide-y divide-line/60 md:hidden">
					{loading ? (
						<li className="px-4 py-10 text-center text-[13px] text-muted">
							Loading guest list…
						</li>
					) : sorted.length === 0 ? (
						<li className="px-4 py-10 text-center text-[13px] text-muted">
							{search ? `No guests match “${search}”.` : "No guests yet — add your first guest above. 🌸"}
						</li>
					) : (
													paged.map((g, i) => {
								const editable = canEditGuest(g)
								const editing = editingId === g._id
								return (
									<li key={g._id} className="p-4">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="font-serif text-[15px] leading-snug text-ink">
													<span className="mr-1.5 text-[11px] text-muted">{rowNumber(i)}.</span>
													{g.name}
												</p>
												{g.note && (
													<p className="mt-0.5 text-[11px] text-muted">{g.note}</p>
												)}
											</div>
											{editable && !editing && (
												<div className="flex shrink-0 gap-1">
													<button
														type="button"
														onClick={() => beginEdit(g)}
														className="rounded-full p-1.5 text-[13px] text-muted transition-colors hover:bg-sage-soft hover:text-sage"
														aria-label={`Edit ${g.name}`}
														title="Edit guest"
													>
														✎
													</button>
													<button
														type="button"
														onClick={() => setDeletingGuest(g)}
														className="rounded-full p-1.5 text-[13px] text-muted transition-colors hover:bg-[#FBEFEE] hover:text-[#A0524B]"
														aria-label={`Delete ${g.name}`}
														title="Delete guest"
													>
														🗑
													</button>
												</div>
											)}
										</div>
										<div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
											<label className="block">
												<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Event</span>
												<span className="text-[13px] text-muted">{EVENT_LABEL[g.event]}</span>
											</label>
											<label className="block">
												<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Side</span>
												<span className="text-[13px] text-muted">{SIDE_LABEL[g.side]}</span>
											</label>
											<label className="block">
												<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Invited by</span>
												<span className="text-[13px] text-muted">{g.invitedBy || "—"}</span>
											</label>
											<label className="block">
												<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Category</span>
												<span className="text-[13px] text-muted">{g.category || "—"}</span>
											</label>
											<label className="block">
												<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Pax</span>
												<span className="text-[13px] text-muted">{g.pax}</span>
											</label>
											<label className="block">
												<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Phone</span>
												<span className="text-[13px] text-muted">{g.phone || "—"}</span>
											</label>
											<label className="col-span-2 block">
												<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
												<span className={`rounded-full border px-2.5 py-1 text-[11px] ${STATUS_META[g.status].cls}`}>{STATUS_META[g.status].label}</span>
											</label>
										</div>
										{editing && (
											<div className="mt-3">
												{guestEditForm()}
											</div>
										)}
									</li>
								)
							})
					)}
				</ul>

				{/* Desktop: table */}
				<div className="hidden overflow-x-auto md:block">
					<table className="w-full min-w-[860px] border-collapse text-left">
						<thead>
							<tr className="border-b border-line bg-cream">
								{["#", "Name", "Event", "Side", "Invited by", "Category", "Pax", "Phone", "Status", ""].map(
									(h, i) => (
										<th
											key={i}
											className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted"
										>
											{h}
										</th>
									),
								)}
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={10} className="px-4 py-10 text-center text-[13px] text-muted">
										Loading guest list…
									</td>
								</tr>
							) : sorted.length === 0 ? (
								<tr>
									<td colSpan={10} className="px-4 py-10 text-center text-[13px] text-muted">
										{search ? `No guests match “${search}”.` : "No guests yet — add your first guest above. 🌸"}
									</td>
								</tr>
							) : (
																paged.map((g, i) => {
									const editable = canEditGuest(g)
									const editing = editingId === g._id
									return (
										<Fragment key={g._id}>
											<tr
												className="border-b border-line/60 transition-colors last:border-0 hover:bg-cream/60"
											>
												<td className="px-4 py-3 text-[12px] text-muted">{rowNumber(i)}</td>
												<td className="px-4 py-3">
													<span className="font-serif text-[15px] text-ink">{g.name}</span>
													{g.note && (
														<span className="block text-[11px] text-muted">{g.note}</span>
													)}
												</td>
												<td className="px-4 py-3 text-[13px] text-muted">{EVENT_LABEL[g.event]}</td>
												<td className="px-4 py-3 text-[13px] text-muted">{SIDE_LABEL[g.side]}</td>
												<td className="px-4 py-3 text-[13px] text-muted">{g.invitedBy || "—"}</td>
												<td className="px-4 py-3 text-[13px] text-muted">{g.category || "—"}</td>
												<td className="px-4 py-3 text-[13px] text-muted">{g.pax}</td>
												<td className="px-4 py-3 text-[13px] text-muted">{g.phone || "—"}</td>
												<td className="px-4 py-3">
													<span className={`rounded-full border px-2.5 py-1 text-[11px] ${STATUS_META[g.status].cls}`}>{STATUS_META[g.status].label}</span>
												</td>
												<td className="px-4 py-3 text-right">
													{editable && !editing && (
														<div className="flex justify-end gap-1">
															<button
																type="button"
																onClick={() => beginEdit(g)}
																className="rounded-full p-1.5 text-[13px] text-muted transition-colors hover:bg-sage-soft hover:text-sage"
																aria-label={`Edit ${g.name}`}
																title="Edit guest"
															>
																✎
															</button>
															<button
																type="button"
																onClick={() => setDeletingGuest(g)}
																className="rounded-full p-1.5 text-[13px] text-muted transition-colors hover:bg-[#FBEFEE] hover:text-[#A0524B]"
																aria-label={`Delete ${g.name}`}
																title="Delete guest"
															>
																🗑
															</button>
														</div>
													)}
												</td>
											</tr>
											{editing && (
												<tr>
													<td colSpan={10} className="px-4 pb-4">
														{guestEditForm()}
													</td>
												</tr>
											)}
										</Fragment>
									)
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			{pageSize !== "all" && totalPages > 1 && (
				<nav
					className="mt-4 flex flex-wrap items-center justify-center gap-1.5"
					aria-label="Guest list pages"
				>
					<button
						type="button"
						className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] text-muted transition-colors hover:text-ink disabled:opacity-40"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={safePage <= 1}
					>
						← Prev
					</button>
					{pageItems.map((item, idx) =>
						item === "…" ? (
							<span key={`e${idx}`} className="px-1 text-[12px] text-muted">
								…
							</span>
						) : (
							<button
								key={item}
								type="button"
								className={`min-w-[34px] rounded-full border px-2.5 py-1.5 text-[12px] transition-colors ${
									item === safePage
										? "border-sage bg-sage text-white"
										: "border-line bg-white text-muted hover:text-ink"
								}`}
								onClick={() => setPage(item)}
								aria-current={item === safePage ? "page" : undefined}
							>
								{item}
							</button>
						),
					)}
					<button
						type="button"
						className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] text-muted transition-colors hover:text-ink disabled:opacity-40"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={safePage >= totalPages}
					>
						Next →
					</button>
					<span className="ml-1 hidden text-[11px] text-muted sm:inline">
						Page {safePage} of {totalPages}
					</span>
				</nav>
			)}

			{/* Invited-by & category managers. Categories belong to an
			    invitation (e.g. Eiman → BSN), so they are managed per
			    invitation. Scoped editors don't manage these — they affect
			    every event. */}
			{canManageLists && <section className="mt-10 grid gap-6 rounded-2xl border border-line bg-white p-5 md:grid-cols-2">
				{/* Invited-by manager */}
				<div>
					<h2 className="font-serif text-lg text-ink">
						💌 Invited by — manage invitations
					</h2>
					<p className="mt-1 text-[12px] leading-relaxed text-muted">
						The invitations a guest can belong to — not just Eiman's or
						Nadia's side, but anyone's like "Abah's invitation".
						Renaming updates every guest and its categories; deleting
						removes its categories too (guests are not deleted).
					</p>

					<form
						className="mt-4 flex gap-2"
						onSubmit={(e) => {
							e.preventDefault()
							addInviter(newInviter, newInviterSide)
							setNewInviter("")
						}}
					>
						<input
							className={`${inputCls} min-w-0 flex-1`}
							placeholder="e.g. Abah's invitation…"
							value={newInviter}
							onChange={(e) => setNewInviter(e.target.value)}
						/>
						<select
							className={inputCls}
							value={newInviterSide}
							onChange={(e) => setNewInviterSide(e.target.value as "bride" | "groom")}
							title="Which side this invitation belongs to"
						>
							<option value="groom">Eiman's side</option>
							<option value="bride">Nadia's side</option>
						</select>
						<button
							type="submit"
							disabled={!newInviter.trim()}
							className="shrink-0 rounded-lg bg-sage px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-50"
						>
							+ Add
						</button>
					</form>

					{inviters.length === 0 ? (
						<p className="mt-4 text-[12px] text-muted">
							No invitations yet — add one above, then manage its categories on the right.
						</p>
					) : (
						<ul className="mt-4 flex flex-wrap gap-2">
							{inviters.map((inv) => {
								const count = guests.filter((g) => g.invitedBy === inv.name).length
								const catCount = categories.filter((c) => c.owner === inv.name).length
								const isEditing = editingInviterId === inv._id
								return (
									<li
										key={inv._id}
										className="flex max-w-full items-center gap-2 rounded-full border border-line bg-cream px-3 py-1.5 text-[12px] text-ink"
									>
										{isEditing ? (
											<>
												<input
													autoFocus
													className="w-36 min-w-0 rounded-md border border-line bg-white px-2 py-1 text-[12px] text-ink outline-none focus:border-sage"
													value={editingInviterName}
													onChange={(e) => setEditingInviterName(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.preventDefault()
															renameInviter(inv._id, editingInviterName)
															setEditingInviterId(null)
														}
														if (e.key === "Escape") setEditingInviterId(null)
													}}
												/>
												<button
													type="button"
													className="rounded-full px-1.5 text-sage"
													aria-label="Save invitation name"
													onClick={() => {
														renameInviter(inv._id, editingInviterName)
														setEditingInviterId(null)
													}}
												>
													✓
												</button>
												<button
													type="button"
													className="rounded-full px-1.5 text-muted"
													aria-label="Cancel editing"
													onClick={() => setEditingInviterId(null)}
												>
													✕
												</button>
											</>
										) : (
											<>
												<span
													className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
														(inv.side ?? inviterSide.get(inv.name)) === "bride"
															? "border-gold/40 bg-gold/10 text-gold"
															: "border-sage/40 bg-sage-soft text-sage"
													}`}
													title="Which side this invitation belongs to"
												>
													{(inv.side ?? inviterSide.get(inv.name)) === "bride" ? "N" : "E"}
												</span>
												<span className="truncate">
													{inv.name}
													{count > 0 && (
														<span className="ml-1.5 text-muted">({count}</span>
													)}
													{catCount > 0 && (
														<span className="text-muted"> · {catCount} cat)</span>
													)}
													{count > 0 && catCount === 0 && (
														<span className="text-muted">)</span>
													)}
												</span>
												<button
													type="button"
													className="shrink-0 rounded-full px-1.5 text-muted transition-colors hover:text-sage"
													aria-label={`Rename ${inv.name}`}
													onClick={() => {
														setEditingInviterId(inv._id)
														setEditingInviterName(inv.name)
													}}
												>
													✎
												</button>
												<button
													type="button"
													className="shrink-0 rounded-full px-1.5 text-muted transition-colors hover:text-[#A0524B]"
													aria-label={`Delete ${inv.name}`}
													onClick={() => removeInviter(inv._id)}
												>
													✕
												</button>
											</>
										)}
									</li>
								)
							})}
						</ul>
					)}
				</div>

				{/* Category manager — grouped per invitation */}
				<div>
					<h2 className="font-serif text-lg text-ink">
						🏷️ Categories — owned by invitations
					</h2>
					<p className="mt-1 text-[12px] leading-relaxed text-muted">
						Categories belong to an invitation. Add them under the
						right invitation (e.g. <b>Eiman → BSN</b>) — the guest form
						then only offers that invitation's categories.
					</p>

					{inviters.length === 0 ? (
						<p className="mt-4 text-[12px] text-muted">
							Add an invitation first (left) — then its categories appear here.
						</p>
					) : (
						<div className="mt-4 space-y-2">
							{inviters.map((inv) => {
								const owned = categories.filter((c) => c.owner === inv.name)
								return (
									<details key={inv._id} className="group rounded-xl border border-line bg-cream/40">
										<summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 [&::-webkit-details-marker]:hidden">
											<span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
												<span className="text-[10px] transition-transform group-open:rotate-90">▸</span>
												{inv.name}
											</span>
											<span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] text-muted">
												{owned.length} {owned.length === 1 ? "cat" : "cats"}
											</span>
										</summary>
										<div className="border-t border-line/60 p-3">
										<form
											className="flex gap-2"
											onSubmit={(e) => {
												e.preventDefault()
												const input = e.currentTarget.elements.namedItem("cat") as HTMLInputElement
												addCategory(input.value, inv.name)
												input.value = ""
											}}
										>
											<input
												name="cat"
												className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] text-ink outline-none focus:border-sage"
												placeholder="New category, e.g. BSN…"
											/>
											<button
												type="submit"
												className="shrink-0 rounded-lg bg-sage px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
											>
												+ Add
											</button>
										</form>
										{owned.length === 0 ? (
											<p className="mt-2 text-[11px] text-muted">No categories yet.</p>
										) : (
											<ul className="mt-2 flex flex-wrap gap-2">
												{owned.map((cat) => {
													const count = guests.filter(
														(g) => g.category === cat.name && g.invitedBy === inv.name,
													).length
													const isEditing = editingCategoryId === cat._id
													return (
														<li
															key={cat._id}
															className="flex max-w-full items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] text-ink"
														>
															{isEditing ? (
																<>
																	<input
																		autoFocus
																		className="w-28 min-w-0 rounded-md border border-line bg-white px-2 py-1 text-[12px] text-ink outline-none focus:border-sage"
																		value={editingCategoryName}
																		onChange={(e) => setEditingCategoryName(e.target.value)}
																		onKeyDown={(e) => {
																			if (e.key === "Enter") {
																				e.preventDefault()
																				renameCategory(cat._id, editingCategoryName)
																				setEditingCategoryId(null)
																			}
																			if (e.key === "Escape") setEditingCategoryId(null)
																		}}
																	/>
																	<button
																		type="button"
																		className="rounded-full px-1.5 text-sage"
																		aria-label="Save category name"
																		onClick={() => {
																			renameCategory(cat._id, editingCategoryName)
																			setEditingCategoryId(null)
																		}}
																	>
																		✓
																	</button>
																	<button
																		type="button"
																		className="rounded-full px-1.5 text-muted"
																		aria-label="Cancel editing"
																		onClick={() => setEditingCategoryId(null)}
																	>
																		✕
																	</button>
																</>
															) : (
																<>
																	<span className="truncate">
																		{cat.name}
																		{count > 0 && (
																			<span className="ml-1.5 text-muted">({count})</span>
																		)}
																	</span>
																	<button
																		type="button"
																		className="shrink-0 rounded-full px-1.5 text-muted transition-colors hover:text-sage"
																		aria-label={`Rename ${cat.name}`}
																		onClick={() => {
																			setEditingCategoryId(cat._id)
																			setEditingCategoryName(cat.name)
																		}}
																	>
																		✎
																	</button>
																	<button
																		type="button"
																		className="shrink-0 rounded-full px-1.5 text-muted transition-colors hover:text-[#A0524B]"
																		aria-label={`Delete ${cat.name}`}
																		onClick={() => removeCategory(cat._id)}
																	>
																		✕
																	</button>
																</>
															)}
														</li>
													)
												})}
											</ul>
										)}
										</div>
									</details>
								)
							})}
						</div>
					)}
				</div>
			</section>}

			{/* Canva is the source of truth. Import its exported guest data (CSV)
			    into the project so it renders in the table above and is saved.
			    Scoped editors can't import — rows may belong to any event. */}
			{canManageLists && <section className="mt-10 rounded-2xl border border-line bg-white p-5">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h2 className="font-serif text-lg text-ink">
							📥 Import guests from Canva
						</h2>
						<p className="mt-1 max-w-[560px] text-[12px] leading-relaxed text-muted">
							Canva stays the source of the guest list. In Canva, export
							your guest list as a CSV, then upload it here — the rows are
							saved and shown in the table above. Supported columns: Name ·
							Event · Side · Invited by · Category · Pax · Phone · Status · Note.
						</p>
					</div>
					<label
						className={`shrink-0 cursor-pointer rounded-full bg-sage px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-px ${
							importing ? "pointer-events-none opacity-50" : ""
						}`}
					>
						{importing ? "Importing…" : "Upload Canva CSV"}
						<input
							type="file"
							accept=".csv,text/csv"
							className="hidden"
							disabled={importing}
							onChange={(e) => {
								const file = e.target.files?.[0]
								if (file) importCsv(file)
								e.target.value = ""
							}}
						/>
					</label>
				</div>
				{importInfo && (
					<p className="mt-3 rounded-lg border border-sage/30 bg-sage-soft px-3 py-2 text-[12px] text-sage">
						{importInfo}
					</p>
				)}
			</section>}

			{/* Canva reference (read-only, auto-refresh — never edits the design).
			    Expanded by default; the user can collapse it. Stacked one per row
			    (Sanding first, then Tandang). */}
			<details open className={`${canEdit ? "mt-6" : "mt-10"} rounded-2xl border border-line bg-white p-5`}>
				<summary className="cursor-pointer font-serif text-lg text-ink">
					📎 Original Canva reference (read-only, auto-refresh)
				</summary>
				<div className="mt-5 grid grid-cols-1 gap-6">
					{canva.map((g) => (
						<CanvaEmbed
							key={g.id}
							title={g.title}
							subtitle={g.subtitle}
							embedUrl={g.embedUrl}
							openUrl={g.openUrl}
						/>
					))}
				</div>
			</details>

			{/* Delete guest confirmation popup */}
			{deletingGuest && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
					<div className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl">
						<h3 className="mb-2 font-serif text-lg text-ink">Delete guest?</h3>
						<p className="mb-4 text-[13px] leading-relaxed text-muted">
							{deletingGuest.name} ({EVENT_LABEL[deletingGuest.event]} · {deletingGuest.pax} pax) will be permanently removed.
						</p>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={confirmDeleteGuest}
								className="flex-1 rounded-lg bg-[#A0524B] px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
							>
								Delete
							</button>
							<button
								type="button"
								onClick={() => setDeletingGuest(null)}
								className="flex-1 rounded-lg border border-line bg-white px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
