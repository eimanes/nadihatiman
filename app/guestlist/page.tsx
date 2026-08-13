"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import CanvaEmbed from "@/components/CanvaEmbed"
import { site, type Guestlist } from "@/content/site"

type Guest = {
	_id: string
	name: string
	event: "nikah" | "sanding" | "tandang"
	side: "bride" | "groom"
	pax: number
	phone: string
	note: string
	status: "dijemput" | "disahkan" | "tidak_hadir"
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
		}))
		.filter((g) => g.name)
}

export default function GuestlistPage() {
	const [guests, setGuests] = useState<Guest[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [importing, setImporting] = useState(false)
	const [importInfo, setImportInfo] = useState<string | null>(null)

	// Filters
	const [filterEvent, setFilterEvent] = useState<"semua" | Guest["event"]>("semua")
	const [filterSide, setFilterSide] = useState<"semua" | Guest["side"]>("semua")

	// Add form
	const [name, setName] = useState("")
	const [event, setEvent] = useState<Guest["event"]>("sanding")
	const [side, setSide] = useState<Guest["side"]>("groom")
	const [pax, setPax] = useState(1)
	const [phone, setPhone] = useState("")

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

	useEffect(() => {
		load()
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
				body: JSON.stringify({ name, event, side, pax, phone }),
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
					(filterSide === "semua" || g.side === filterSide),
			),
		[guests, filterEvent, filterSide],
	)

	const totalPax = filtered.reduce((sum, g) => sum + (g.pax || 0), 0)
	const confirmedPax = filtered
		.filter((g) => g.status === "disahkan")
		.reduce((sum, g) => sum + (g.pax || 0), 0)

	return (
		<div className="mx-auto max-w-[1100px] px-5 pb-20 pt-24">
			<header className="py-10 text-center">
				<p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">
					Guest List
				</p>
				<h1 className="font-serif text-4xl text-ink">Our guests</h1>
				<p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-relaxed text-muted">
					The guest list is saved — add, update attendance status,
					and delete directly from the table below.
				</p>
			</header>

			{error && (
				<div className="mb-6 rounded-xl border border-[#E4C5C2] bg-[#FBEFEE] px-4 py-3 text-[13px] text-[#A0524B]">
					{error}
				</div>
			)}

			{/* Add guest */}
			<form
				onSubmit={addGuest}
				className="mb-8 grid gap-3 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] md:grid-cols-[1fr_150px_150px_90px_160px_auto]"
			>
				<input
					className={inputCls}
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
					placeholder="Phone number (optional)"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
				/>
				<button
					type="submit"
					disabled={saving}
					className="rounded-lg bg-sage px-5 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-50"
				>
					{saving ? "Saving…" : "+ Add"}
				</button>
			</form>

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

			{/* Guest table */}
			<div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
				<table className="w-full min-w-[760px] border-collapse text-left">
					<thead>
						<tr className="border-b border-line bg-cream">
							{["#", "Name", "Event", "Side", "Pax", "Phone", "Status", ""].map(
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
								<td colSpan={8} className="px-4 py-10 text-center text-[13px] text-muted">
									Loading guest list…
								</td>
							</tr>
						) : filtered.length === 0 ? (
							<tr>
								<td colSpan={8} className="px-4 py-10 text-center text-[13px] text-muted">
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
										<select
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
										</select>
									</td>
									<td className="px-4 py-3">
										<select
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
										</select>
									</td>
									<td className="px-4 py-3">
										<input
											type="number"
											min={1}
											className="w-16 rounded-lg border border-transparent bg-transparent px-1 py-1 text-[13px] text-ink hover:border-line focus:border-sage"
											value={g.pax}
											onChange={(e) =>
												patchGuest(g._id, { pax: Number(e.target.value) || 1 })
											}
										/>
									</td>
									<td className="px-4 py-3 text-[13px] text-muted">{g.phone || "—"}</td>
									<td className="px-4 py-3">
										<select
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
										</select>
									</td>
									<td className="px-4 py-3 text-right">
										<button
											type="button"
											onClick={() => removeGuest(g._id)}
											className="rounded-full px-2 py-1 text-[12px] text-muted transition-colors hover:bg-[#FBEFEE] hover:text-[#A0524B]"
											aria-label={`Delete ${g.name}`}
										>
											✕
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Canva is the source of truth. Import its exported guest data (CSV)
			    into the project so it renders in the table above and is saved. */}
			<section className="mt-10 rounded-2xl border border-line bg-white p-5">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h2 className="font-serif text-lg text-ink">
							📥 Import guests from Canva
						</h2>
						<p className="mt-1 max-w-[560px] text-[12px] leading-relaxed text-muted">
							Canva stays the source of the guest list. In Canva, export
							your guest list as a CSV, then upload it here — the rows are
							saved and shown in the table above. Supported columns: Name ·
							Event · Side · Pax · Phone · Status · Note.
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
			</section>

			{/* Canva reference (read-only, auto-refresh — never edits the design).
			    Expanded by default; the user can collapse it. Stacked one per row
			    (Sanding first, then Tandang). */}
			<details open className="mt-6 rounded-2xl border border-line bg-white p-5">
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
