"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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

export default function GuestlistPage() {
	const { can } = usePermissions()
	const [guests, setGuests] = useState<Guest[]>([])
	const [inviters, setInviters] = useState<GuestOption[]>([])
	const [categories, setCategories] = useState<GuestOption[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [importing, setImporting] = useState(false)
	const [importInfo, setImportInfo] = useState<string | null>(null)
	const canEdit = can("edit_guests")

	// Filters
	const [filterEvent, setFilterEvent] = useState<"semua" | Guest["event"]>("semua")
	const [filterSide, setFilterSide] = useState<"semua" | Guest["side"]>("semua")
	const [filterInvitedBy, setFilterInvitedBy] = useState<string>("semua")
	const [filterCategory, setFilterCategory] = useState<string>("semua")

	// Add form
	const [name, setName] = useState("")
	const [event, setEvent] = useState<Guest["event"]>("sanding")
	const [side, setSide] = useState<Guest["side"]>("groom")
	const [pax, setPax] = useState(1)
	const [phone, setPhone] = useState("")
	const [invitedBy, setInvitedBy] = useState("")
	const [category, setCategory] = useState("")

	// Inviter manager
	const [newInviter, setNewInviter] = useState("")
	const [editingInviterId, setEditingInviterId] = useState<string | null>(null)
	const [editingInviterName, setEditingInviterName] = useState("")

	// Category manager
	const [newCategory, setNewCategory] = useState("")
	const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
	const [editingCategoryName, setEditingCategoryName] = useState("")

	// Canva reference embeds (live settings, falls back to defaults)
	const [canva, setCanva] = useState<Guestlist[]>(site.guestlists)

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
			// Register any brand-new option names used in the form.
			if (invitedBy && !inviters.some((i) => i.name === invitedBy)) {
				await addInviter(invitedBy)
			}
			if (category && !categories.some((c) => c.name === category)) {
				await addCategory(category)
			}
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
	const addInviter = async (rawName: string) => {
		const trimmed = rawName.trim()
		if (!trimmed) return
		try {
			const res = await fetch("/api/guest-inviters", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: trimmed }),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error adding inviter.")
			setInviters((list) => [...list, data.inviter])
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error adding inviter.")
		}
	}

	/** Add a guest category (e.g. "Family", "Friends", "VIP"). */
	const addCategory = async (rawName: string) => {
		const trimmed = rawName.trim()
		if (!trimmed) return
		try {
			const res = await fetch("/api/guest-categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: trimmed }),
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
				body: JSON.stringify({ name: trimmed }),
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

	/** Delete an inviter — guests referencing it are unassigned. */
	const removeInviter = async (id: string) => {
		const prev = inviters.find((i) => i._id === id)
		setInviters((list) => list.filter((i) => i._id !== id))
		try {
			const res = await fetch(`/api/guest-inviters/${id}`, { method: "DELETE" })
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error ?? "Error deleting inviter.")
			}
			if (prev) {
				setGuests((gs) =>
					gs.map((g) =>
						g.invitedBy === prev.name ? { ...g, invitedBy: "" } : g,
					),
				)
			}
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error deleting inviter.")
			loadInviters()
			load()
		}
	}

	/** Rename a category — cascades to all guests using the old name. */
	const renameCategory = async (id: string, rawName: string) => {
		const trimmed = rawName.trim()
		if (!trimmed) return
		setCategories((list) =>
			list.map((c) => (c._id === id ? { ...c, name: trimmed } : c)),
		)
		try {
			const res = await fetch(`/api/guest-categories/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: trimmed }),
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
			const res = await fetch(`/api/guest-categories/${id}`, { method: "DELETE" })
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

	// Import guest data exported from Canva as a CSV file. The Canva design
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
			// Register any new "invited by" / category values from the CSV as options.
			const knownInviters = new Set(inviters.map((i) => i.name.toLowerCase()))
			const freshInviters = Array.from(
				new Set(
					parsed.map((g) => g.invitedBy).filter((n) => n && !knownInviters.has(n.toLowerCase())),
				),
			)
			for (const n of freshInviters) await addInviter(n)
			const knownCategories = new Set(categories.map((c) => c.name.toLowerCase()))
			const freshCategories = Array.from(
				new Set(
					parsed.map((g) => g.category).filter((n) => n && !knownCategories.has(n.toLowerCase())),
				),
			)
			for (const n of freshCategories) await addCategory(n)
			setImportInfo(`Imported ${data.inserted} guests from Canva CSV.`)
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error importing guests.")
		} finally {
			setImporting(false)
		}
	}

	const filtered = useMemo(
		() =>
			guests.filter(
				(g) =>
					(filterEvent === "semua" || g.event === filterEvent) &&
					(filterSide === "semua" || g.side === filterSide) &&
					(filterInvitedBy === "semua" || g.invitedBy === filterInvitedBy) &&
					(filterCategory === "semua" || g.category === filterCategory),
			),
		[guests, filterEvent, filterSide, filterInvitedBy, filterCategory],
	)

	const totalPax = filtered.reduce((sum, g) => sum + (g.pax || 0), 0)
	const confirmedPax = filtered
		.filter((g) => g.status === "disahkan")
		.reduce((sum, g) => sum + (g.pax || 0), 0)

	// "Invited by" options = managed inviters + any value already on a guest
	// (so legacy guests never lose their label in the dropdown).
	const invitedByOptions = useMemo(() => {
		const names = new Set(inviters.map((i) => i.name))
		for (const g of guests) if (g.invitedBy) names.add(g.invitedBy)
		return Array.from(names).sort((a, b) => a.localeCompare(b))
	}, [inviters, guests])

	// Category options work the same way.
	const categoryOptions = useMemo(() => {
		const names = new Set(categories.map((c) => c.name))
		for (const g of guests) if (g.category) names.add(g.category)
		return Array.from(names).sort((a, b) => a.localeCompare(b))
	}, [categories, guests])

	return (
		<div className="mx-auto max-w-[1100px] px-5 pb-20 pt-24">
			<header className="py-10 text-center">
				<p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">
					Guest List
				</p>
				<h1 className="font-serif text-4xl text-ink">Our guests</h1>
				<p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-relaxed text-muted">
					{canEdit
						? "The guest list is saved — add, update attendance status, and delete directly from the table below. Track who invited each guest (e.g. Abah's invitation) and their category (e.g. Family, Friends) — both are customizable below."
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
					<option value="nikah">💍 Nikah</option>
					<option value="sanding">🌸 Sanding</option>
					<option value="tandang">🏡 Tandang</option>
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
					onChange={(e) => setInvitedBy(e.target.value)}
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
				>
					<option value="">Category…</option>
					{categoryOptions.map((n) => (
						<option key={n} value={n}>
							{n}
						</option>
					))}
				</select>
				<input
					className={inputCls}
					type="number"
					min={1}
					value={pax}
					onChange={(e) => setPax(Number(e.target.value) || 1)}
					aria-label="Pax"
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
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap gap-2">
					<select
						className={inputCls}
						value={filterEvent}
						onChange={(e) => setFilterEvent(e.target.value as typeof filterEvent)}
					>
						<option value="semua">All events</option>
						<option value="nikah">💍 Nikah</option>
						<option value="sanding">🌸 Sanding</option>
						<option value="tandang">🏡 Tandang</option>
					</select>
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
						{invitedByOptions.map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
					</select>
					<select
						className={inputCls}
						value={filterCategory}
						onChange={(e) => setFilterCategory(e.target.value)}
					>
						<option value="semua">All categories</option>
						{categoryOptions.map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
					</select>
				</div>
				<div className="flex flex-wrap gap-2 text-[12px]">
					<span className="rounded-full border border-line bg-white px-3 py-1.5 text-muted">
						{filtered.length} guest groups
					</span>
					<span className="rounded-full border border-line bg-white px-3 py-1.5 text-muted">
						Total pax: <b className="text-ink">{totalPax}</b>
					</span>
					<span className="rounded-full border border-sage/30 bg-sage-soft px-3 py-1.5 text-sage">
						Confirmed: <b>{confirmedPax} pax</b>
					</span>
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
					) : filtered.length === 0 ? (
						<li className="px-4 py-10 text-center text-[13px] text-muted">
							No guests yet — add your first guest above. 🌸
						</li>
					) : (
						filtered.map((g, i) => (
							<li key={g._id} className="p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="font-serif text-[15px] leading-snug text-ink">
											<span className="mr-1.5 text-[11px] text-muted">{i + 1}.</span>
											{g.name}
										</p>
										{g.note && (
											<p className="mt-0.5 text-[11px] text-muted">{g.note}</p>
										)}
									</div>
									{canEdit && <button
										type="button"
										onClick={() => removeGuest(g._id)}
										className="shrink-0 rounded-full px-2 py-1 text-[12px] text-muted transition-colors hover:bg-[#FBEFEE] hover:text-[#A0524B]"
										aria-label={`Delete ${g.name}`}
									>
										✕
									</button>}
								</div>
								<div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
									<label className="block">
										<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Event</span>
										{canEdit ? <select
											className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
											value={g.event}
											onChange={(e) =>
												patchGuest(g._id, { event: e.target.value as Guest["event"] })
											}
										>
											{Object.entries(EVENT_LABEL).map(([v, l]) => (
												<option key={v} value={v}>{l}</option>
											))}
										</select> : <span className="text-[13px] text-muted">{EVENT_LABEL[g.event]}</span>}
									</label>
									<label className="block">
										<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Side</span>
										{canEdit ? <select
											className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
											value={g.side}
											onChange={(e) =>
												patchGuest(g._id, { side: e.target.value as Guest["side"] })
											}
										>
											{Object.entries(SIDE_LABEL).map(([v, l]) => (
												<option key={v} value={v}>{l}</option>
											))}
										</select> : <span className="text-[13px] text-muted">{SIDE_LABEL[g.side]}</span>}
									</label>
									<label className="block">
										<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Invited by</span>
										{canEdit ? <select
											className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
											value={g.invitedBy ?? ""}
											onChange={(e) => patchGuest(g._id, { invitedBy: e.target.value })}
										>
											<option value="">—</option>
											{invitedByOptions.map((n) => (
												<option key={n} value={n}>{n}</option>
											))}
										</select> : <span className="text-[13px] text-muted">{g.invitedBy || "—"}</span>}
									</label>
									<label className="block">
										<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Category</span>
										{canEdit ? <select
											className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
											value={g.category ?? ""}
											onChange={(e) => patchGuest(g._id, { category: e.target.value })}
										>
											<option value="">—</option>
											{categoryOptions.map((n) => (
												<option key={n} value={n}>{n}</option>
											))}
										</select> : <span className="text-[13px] text-muted">{g.category || "—"}</span>}
									</label>
									<label className="block">
										<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Pax</span>
										{canEdit ? <input
											type="number"
											min={1}
											className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none focus:border-sage"
											value={g.pax}
											onChange={(e) => patchGuest(g._id, { pax: Number(e.target.value) || 1 })}
										/> : <span className="text-[13px] text-muted">{g.pax}</span>}
									</label>
									<label className="block">
										<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Phone</span>
										<span className="text-[13px] text-muted">{g.phone || "—"}</span>
									</label>
									<label className="col-span-2 block">
										<span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
										{canEdit ? <select
											className={`w-full rounded-lg border px-2 py-1.5 text-[12px] ${STATUS_META[g.status].cls}`}
											value={g.status}
											onChange={(e) =>
												patchGuest(g._id, { status: e.target.value as Guest["status"] })
											}
										>
											{Object.entries(STATUS_META).map(([v, m]) => (
												<option key={v} value={v}>{m.label}</option>
											))}
										</select> : <span className={`rounded-full border px-2.5 py-1 text-[11px] ${STATUS_META[g.status].cls}`}>{STATUS_META[g.status].label}</span>}
									</label>
								</div>
							</li>
						))
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
							) : filtered.length === 0 ? (
								<tr>
									<td colSpan={10} className="px-4 py-10 text-center text-[13px] text-muted">
										No guests yet — add your first guest above. 🌸
									</td>
								</tr>
							) : (
								filtered.map((g, i) => (
									<tr
										key={g._id}
										className="border-b border-line/60 transition-colors last:border-0 hover:bg-cream/60"
									>
										<td className="px-4 py-3 text-[12px] text-muted">{i + 1}</td>
										<td className="px-4 py-3">
											<span className="font-serif text-[15px] text-ink">{g.name}</span>
											{g.note && (
												<span className="block text-[11px] text-muted">{g.note}</span>
											)}
										</td>
										<td className="px-4 py-3">
											{canEdit ? <select
												className="rounded-lg border border-transparent bg-transparent px-1 py-1 text-[13px] text-ink hover:border-line focus:border-sage"
												value={g.event}
												onChange={(e) =>
													patchGuest(g._id, { event: e.target.value as Guest["event"] })
												}
											>
												{Object.entries(EVENT_LABEL).map(([v, l]) => (
													<option key={v} value={v}>
														{l}
													</option>
												))}
											</select> : <span className="text-[13px] text-muted">{EVENT_LABEL[g.event]}</span>}
										</td>
										<td className="px-4 py-3">
											{canEdit ? <select
												className="rounded-lg border border-transparent bg-transparent px-1 py-1 text-[13px] text-ink hover:border-line focus:border-sage"
												value={g.side}
												onChange={(e) =>
													patchGuest(g._id, { side: e.target.value as Guest["side"] })
												}
											>
												{Object.entries(SIDE_LABEL).map(([v, l]) => (
													<option key={v} value={v}>
														{l}
													</option>
												))}
											</select> : <span className="text-[13px] text-muted">{SIDE_LABEL[g.side]}</span>}
										</td>
										<td className="px-4 py-3">
											{canEdit ? <select
												className="max-w-[150px] rounded-lg border border-transparent bg-transparent px-1 py-1 text-[13px] text-ink hover:border-line focus:border-sage"
												value={g.invitedBy ?? ""}
												onChange={(e) =>
													patchGuest(g._id, { invitedBy: e.target.value })
												}
											>
												<option value="">—</option>
												{invitedByOptions.map((n) => (
													<option key={n} value={n}>
														{n}
													</option>
												))}
											</select> : <span className="text-[13px] text-muted">{g.invitedBy || "—"}</span>}
										</td>
										<td className="px-4 py-3">
											{canEdit ? <select
												className="max-w-[130px] rounded-lg border border-transparent bg-transparent px-1 py-1 text-[13px] text-ink hover:border-line focus:border-sage"
												value={g.category ?? ""}
												onChange={(e) =>
													patchGuest(g._id, { category: e.target.value })
												}
											>
												<option value="">—</option>
												{categoryOptions.map((n) => (
													<option key={n} value={n}>
														{n}
													</option>
												))}
											</select> : <span className="text-[13px] text-muted">{g.category || "—"}</span>}
										</td>
										<td className="px-4 py-3">
											{canEdit ? <input
												type="number"
												min={1}
												className="w-16 rounded-lg border border-transparent bg-transparent px-1 py-1 text-[13px] text-ink hover:border-line focus:border-sage"
												value={g.pax}
												onChange={(e) =>
													patchGuest(g._id, { pax: Number(e.target.value) || 1 })
												}
											/> : <span className="text-[13px] text-muted">{g.pax}</span>}
										</td>
										<td className="px-4 py-3 text-[13px] text-muted">{g.phone || "—"}</td>
										<td className="px-4 py-3">
											{canEdit ? <select
												className={`rounded-full border px-2.5 py-1 text-[11px] ${STATUS_META[g.status].cls}`}
												value={g.status}
												onChange={(e) =>
													patchGuest(g._id, {
														status: e.target.value as Guest["status"],
													})
												}
											>
												{Object.entries(STATUS_META).map(([v, m]) => (
													<option key={v} value={v}>
														{m.label}
													</option>
												))}
											</select> : <span className={`rounded-full border px-2.5 py-1 text-[11px] ${STATUS_META[g.status].cls}`}>{STATUS_META[g.status].label}</span>}
										</td>
										<td className="px-4 py-3 text-right">
											{canEdit && <button
												type="button"
												onClick={() => removeGuest(g._id)}
												className="rounded-full px-2 py-1 text-[12px] text-muted transition-colors hover:bg-[#FBEFEE] hover:text-[#A0524B]"
												aria-label={`Delete ${g.name}`}
											>
												✕
											</button>}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Invited-by & category managers — add, rename, or remove the
			    customizable options. */}
			{canEdit && <section className="mt-10 grid gap-6 rounded-2xl border border-line bg-white p-5 md:grid-cols-2">
				{/* Invited-by manager */}
				<div>
					<h2 className="font-serif text-lg text-ink">
						💌 Invited by — manage invitations
					</h2>
					<p className="mt-1 text-[12px] leading-relaxed text-muted">
						The invitations a guest can belong to — not just Eiman's or
						Nadia's side, but anyone's like "Abah's invitation".
						Renaming updates every guest that uses it; deleting
						unassigns those guests (they are not deleted).
					</p>

					<form
						className="mt-4 flex gap-2"
						onSubmit={(e) => {
							e.preventDefault()
							addInviter(newInviter)
							setNewInviter("")
						}}
					>
						<input
							className={`${inputCls} min-w-0 flex-1`}
							placeholder="e.g. Abah's invitation…"
							value={newInviter}
							onChange={(e) => setNewInviter(e.target.value)}
						/>
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
							No invitations yet — add one above.
						</p>
					) : (
						<ul className="mt-4 flex flex-wrap gap-2">
							{inviters.map((inv) => {
								const count = guests.filter((g) => g.invitedBy === inv.name).length
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
												<span className="truncate">
													{inv.name}
													{count > 0 && (
														<span className="ml-1.5 text-muted">({count})</span>
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

				{/* Category manager */}
				<div>
					<h2 className="font-serif text-lg text-ink">
						🏷️ Categories — manage guest categories
					</h2>
					<p className="mt-1 text-[12px] leading-relaxed text-muted">
						Group guests however you like — e.g. Family, Friends,
						Colleagues, VIP. Renaming a category updates every guest
						that uses it; deleting one unassigns those guests
						(they are not deleted).
					</p>

					<form
						className="mt-4 flex gap-2"
						onSubmit={(e) => {
							e.preventDefault()
							addCategory(newCategory)
							setNewCategory("")
						}}
					>
						<input
							className={`${inputCls} min-w-0 flex-1`}
							placeholder="e.g. Family, Friends, VIP…"
							value={newCategory}
							onChange={(e) => setNewCategory(e.target.value)}
						/>
						<button
							type="submit"
							disabled={!newCategory.trim()}
							className="shrink-0 rounded-lg bg-sage px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-50"
						>
							+ Add
						</button>
					</form>

					{categories.length === 0 ? (
						<p className="mt-4 text-[12px] text-muted">
							No categories yet — add one above.
						</p>
					) : (
						<ul className="mt-4 flex flex-wrap gap-2">
							{categories.map((cat) => {
								const count = guests.filter((g) => g.category === cat.name).length
								const isEditing = editingCategoryId === cat._id
								return (
									<li
										key={cat._id}
										className="flex max-w-full items-center gap-2 rounded-full border border-line bg-cream px-3 py-1.5 text-[12px] text-ink"
									>
										{isEditing ? (
											<>
												<input
													autoFocus
													className="w-36 min-w-0 rounded-md border border-line bg-white px-2 py-1 text-[12px] text-ink outline-none focus:border-sage"
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
			</section>}

			{/* Canva is the source of truth. Import its exported guest data (CSV)
			    into the project so it renders in the table above and is saved. */}
			{canEdit && <section className="mt-10 rounded-2xl border border-line bg-white p-5">
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
		</div>
	)
}
