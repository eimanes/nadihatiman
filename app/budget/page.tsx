"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePermissions } from "@/hooks/usePermissions"

type BudgetRow = {
	_id: string
	item: string
	event: string
	category: string
	vendor: string
	estimated: number
	paid: number
	balance: number
	date: string
	paidBy: string
	notes: string
}

type HomeItem = {
	_id: string
	itemId: string
	name: string
	category: string
	price: number
	qty: number
	totalPrice: number
	paid: number
	balance: number
	paidBy: string
	txnStatus: string
	productStatus: string
	notes: string
	dimension: string
}

const fmtRM = (n: number) =>
	new Intl.NumberFormat("ms-MY", {
		style: "currency",
		currency: "MYR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(n)

const inputCls =
	"rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-sage"

const CATEGORIES = [
	"Hall & Event",
	"Attire",
	"Prep",
	"Photo & Vid",
	"For Nanad",
	"For Eiman",
	"Other",
]

const EVENTS = ["sanding", "tandang"]

const HOME_CATEGORIES = [
	"Cabinet",
	"C&W",
	"Kitchen",
	"Room",
	"Hall",
	"Lights",
	"Toilets",
	"Other",
]

/** Budget page — Mongo-backed, seeded from the couple's Excel.
 * Two tables: wedding budget (sanding/tandang) and Home Meridin.
 * Editors (edit_budget) can add, edit, and delete items inline. */
export default function BudgetPage() {
	const { can } = usePermissions()
	const canEdit = can("edit_budget")
	const [activeTable, setActiveTable] = useState<"wedding" | "home">("wedding")
	const [items, setItems] = useState<BudgetRow[]>([])
	const [homeItems, setHomeItems] = useState<HomeItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [activeEvent, setActiveEvent] = useState("sanding")
	const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

	// Add form
	const [newItem, setNewItem] = useState("")
	const [newEvent, setNewEvent] = useState("sanding")
	const [newCategory, setNewCategory] = useState("Hall & Event")
	const [newVendor, setNewVendor] = useState("")
	const [newEstimated, setNewEstimated] = useState(0)
	const [newPaid, setNewPaid] = useState(0)
	const [newPaidBy, setNewPaidBy] = useState("")
	const [saving, setSaving] = useState(false)

	// Sorting — sortKey is the column to sort on; sortDir toggles asc/desc.
	// null sortKey = default insertion order.
	const [sortKey, setSortKey] = useState<string | null>(null)
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

	// Delete confirmation popup
	const [deletingItem, setDeletingItem] = useState<BudgetRow | null>(null)
	const [deletingHomeItem, setDeletingHomeItem] = useState<HomeItem | null>(null)

	// Home Meridin sort
	const [homeSortKey, setHomeSortKey] = useState<string | null>(null)
	const [homeSortDir, setHomeSortDir] = useState<"asc" | "desc">("asc")

	// Home Meridin add form
	const [showHomeAdd, setShowHomeAdd] = useState(false)
	const [newHomeName, setNewHomeName] = useState("")
	const [newHomeCategory, setNewHomeCategory] = useState("Other")
	const [newHomePrice, setNewHomePrice] = useState(0)
	const [newHomeQty, setNewHomeQty] = useState(1)
	const [newHomePaid, setNewHomePaid] = useState(0)
	const [newHomePaidBy, setNewHomePaidBy] = useState("")
	const [newHomeNotes, setNewHomeNotes] = useState("")

	// Inline edit — wedding budget
	const [editingId, setEditingId] = useState<string | null>(null)
	const [draft, setDraft] = useState<Partial<BudgetRow>>({})

	// Inline edit — home items
	const [editingHomeId, setEditingHomeId] = useState<string | null>(null)
	const [homeDraft, setHomeDraft] = useState<Partial<HomeItem>>({})

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const [budgetRes, homeRes] = await Promise.all([
				fetch("/api/budget", { cache: "no-store" }),
				fetch("/api/home-items", { cache: "no-store" }),
			])
			const budgetData = await budgetRes.json()
			if (!budgetRes.ok) throw new Error(budgetData.error ?? "Error loading budget.")
			setItems(budgetData.items)
			const homeData = await homeRes.json()
			if (homeRes.ok) setHomeItems(homeData.items)
			setUpdatedAt(new Date())
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error loading budget.")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		load()
	}, [load])

	const eventOptions = useMemo(() => {
		const set = new Set<string>()
		for (const it of items) if (it.event.trim()) set.add(it.event.trim())
		return [...set]
	}, [items])

	// Always show both events as tabs, even if one has no items yet.
	const allEvents = useMemo(() => {
		const set = new Set(eventOptions)
		for (const ev of EVENTS) set.add(ev)
		return [...set]
	}, [eventOptions])

	const filtered = useMemo(
		() => items.filter((it) => it.event.trim().toLowerCase() === activeEvent.toLowerCase()),
		[items, activeEvent],
	)

	const sorted = useMemo(() => {
		if (!sortKey) return filtered
		const dir = sortDir === "asc" ? 1 : -1
		return [...filtered].sort((a, b) => {
			const av = a[sortKey as keyof BudgetRow]
			const bv = b[sortKey as keyof BudgetRow]
			if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir
			return String(av ?? "").localeCompare(String(bv ?? "")) * dir
		})
	}, [filtered, sortKey, sortDir])

	/** Toggle sort on a column: click once = asc, again = desc, third = off. */
	const toggleSort = (key: string) => {
		if (sortKey !== key) {
			setSortKey(key)
			setSortDir("asc")
		} else if (sortDir === "asc") {
			setSortDir("desc")
		} else {
			setSortKey(null)
			setSortDir("asc")
		}
	}

	const totalEstimated = sorted.reduce((s, it) => s + it.estimated, 0)
	const totalPaid = sorted.reduce((s, it) => s + it.paid, 0)
	const totalBalance = sorted.reduce((s, it) => s + it.balance, 0)
	// Fully paid = nothing left to pay. A zero/empty balance counts even when
	// the item costs RM0 (e.g. sponsored or DIY items are "settled" by default).
	const paidCount = sorted.filter((it) => it.balance <= 0).length

	// Home Meridin sorting & totals
	const homeSorted = useMemo(() => {
		if (!homeSortKey) return homeItems
		const dir = homeSortDir === "asc" ? 1 : -1
		return [...homeItems].sort((a, b) => {
			const av = a[homeSortKey as keyof HomeItem]
			const bv = b[homeSortKey as keyof HomeItem]
			if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir
			return String(av ?? "").localeCompare(String(bv ?? "")) * dir
		})
	}, [homeItems, homeSortKey, homeSortDir])

	const homeTotalPrice = homeSorted.reduce((s, it) => s + it.totalPrice, 0)
	const homeTotalPaid = homeSorted.reduce((s, it) => s + it.paid, 0)
	const homeTotalBalance = homeSorted.reduce((s, it) => s + it.balance, 0)
	// Same rule as the wedding budget: balance of 0 = fully paid, RM0 or not.
	const homePaidCount = homeSorted.filter((it) => it.balance <= 0).length

	const toggleHomeSort = (key: string) => {
		if (homeSortKey !== key) {
			setHomeSortKey(key)
			setHomeSortDir("asc")
		} else if (homeSortDir === "asc") {
			setHomeSortDir("desc")
		} else {
			setHomeSortKey(null)
			setHomeSortDir("asc")
		}
	}

	const addHomeItem = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newHomeName.trim() || saving) return
		setSaving(true)
		try {
			const res = await fetch("/api/home-items", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: newHomeName,
					category: newHomeCategory,
					price: newHomePrice,
					qty: newHomeQty,
					paid: newHomePaid,
					paidBy: newHomePaidBy,
					notes: newHomeNotes,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error adding item.")
			setHomeItems((list) => [...list, data.item])
			setNewHomeName("")
			setNewHomePrice(0)
			setNewHomeQty(1)
			setNewHomePaid(0)
			setNewHomePaidBy("")
			setNewHomeNotes("")
			setShowHomeAdd(false)
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error adding item.")
		} finally {
			setSaving(false)
		}
	}

	const removeHomeItem = async (id: string) => {
		try {
			const res = await fetch(`/api/home-items/${id}`, { method: "DELETE" })
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error ?? "Error deleting.")
			}
			setHomeItems((list) => list.filter((x) => x._id !== id))
			setDeletingHomeItem(null)
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error deleting.")
			setDeletingHomeItem(null)
			load()
		}
	}

	const beginHomeEdit = (it: HomeItem) => {
		setEditingHomeId(it._id)
		setHomeDraft({ ...it })
	}

	const cancelHomeEdit = () => {
		setEditingHomeId(null)
		setHomeDraft({})
	}

	const saveHomeEdit = async () => {
		if (!editingHomeId) return
		if (!homeDraft.name?.trim()) {
			setError("Item name is required.")
			return
		}
		const updates = { ...homeDraft }
		const price = updates.price ?? 0
		const qty = updates.qty ?? 1
		const paidAmt = updates.paid ?? 0
		updates.totalPrice = price * qty
		updates.balance = Math.max(0, updates.totalPrice - paidAmt)
		setHomeItems((list) =>
			list.map((x) => (x._id === editingHomeId ? { ...x, ...updates } : x)),
		)
		try {
			const res = await fetch(`/api/home-items/${editingHomeId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error ?? "Error updating.")
			}
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error updating.")
			load()
		} finally {
			setEditingHomeId(null)
			setHomeDraft({})
		}
	}

	const addBudget = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newItem.trim() || saving) return
		setSaving(true)
		try {
			const res = await fetch("/api/budget", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					item: newItem,
					event: newEvent,
					category: newCategory,
					vendor: newVendor,
					estimated: newEstimated,
					paid: newPaid,
					balance: Math.max(0, newEstimated - newPaid),
					paidBy: newPaidBy,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error adding item.")
			setItems((list) => [...list, data.item])
			setNewItem("")
			setNewVendor("")
			setNewEstimated(0)
			setNewPaid(0)
			setNewPaidBy("")
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error adding item.")
		} finally {
			setSaving(false)
		}
	}

	const beginEdit = (it: BudgetRow) => {
		setEditingId(it._id)
		setDraft({ ...it })
	}

	const cancelEdit = () => {
		setEditingId(null)
		setDraft({})
	}

	const saveEdit = async () => {
		if (!editingId) return
		if (!draft.item?.trim()) {
			setError("Item name is required.")
			return
		}
		const updates = { ...draft }
		// Auto-calc balance if not explicitly set.
		if (updates.estimated !== undefined && updates.paid !== undefined) {
			updates.balance = Math.max(0, (updates.estimated ?? 0) - (updates.paid ?? 0))
		}
		setItems((list) =>
			list.map((x) => (x._id === editingId ? { ...x, ...updates } : x)),
		)
		try {
			const res = await fetch(`/api/budget/${editingId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error ?? "Error updating.")
			}
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error updating.")
			load()
		} finally {
			setEditingId(null)
			setDraft({})
		}
	}

	const removeItem = async (id: string) => {
		try {
			const res = await fetch(`/api/budget/${id}`, { method: "DELETE" })
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error ?? "Error deleting.")
			}
			// Only update local state after the API confirms the delete.
			setItems((list) => list.filter((x) => x._id !== id))
			setDeletingItem(null)
			setError(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error deleting.")
			setDeletingItem(null)
			load()
		}
	}

	return (
		<div className="mx-auto max-w-[1200px] px-5 pb-20 pt-24">
			<header className="py-10 text-center">
				<p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">Budget</p>
				<h1 className="font-serif text-4xl text-ink">Budget list</h1>
				<p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-relaxed text-muted">
					{canEdit
						? "Tap any field to edit it inline. Changes save when you press Save. Balance auto-calculates from estimated minus paid."
						: "All our wedding expenses, tracked to the last sen."}
				</p>
			</header>

			{/* Table toggle: Wedding Budget vs Home Meridin */}
			<div className="mb-6 flex justify-center gap-2">
				<button
					type="button"
					onClick={() => setActiveTable("wedding")}
					className={`rounded-full px-5 py-2 text-[12px] uppercase tracking-[0.14em] transition-colors ${
						activeTable === "wedding"
							? "bg-sage text-white"
							: "border border-line bg-white text-muted hover:border-sage hover:text-ink"
					}`}
				>
					💍 Wedding Budget
				</button>
				<button
					type="button"
					onClick={() => setActiveTable("home")}
					className={`rounded-full px-5 py-2 text-[12px] uppercase tracking-[0.14em] transition-colors ${
						activeTable === "home"
							? "bg-sage text-white"
							: "border border-line bg-white text-muted hover:border-sage hover:text-ink"
					}`}
				>
					🏠 Home - Meridin
				</button>
			</div>

			{error && (
				<div className="mb-4 rounded-xl border border-[#E4C5C2] bg-[#FBEFEE] px-4 py-3 text-[13px] text-[#A0524B]">
					{error}
				</div>
			)}

			{activeTable === "wedding" && (
				<>
			{/* Add budget item */}
			{canEdit && (
				<form
					onSubmit={addBudget}
					className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] md:grid-cols-3 xl:grid-cols-7"
				>
					<input
						className={`${inputCls} col-span-2 md:col-span-3 xl:col-span-2`}
						placeholder="Item / expense…"
						value={newItem}
						onChange={(e) => setNewItem(e.target.value)}
						required
					/>
					<select
						className={inputCls}
						value={newEvent}
						onChange={(e) => setNewEvent(e.target.value)}
					>
						{EVENTS.map((ev) => (
							<option key={ev} value={ev}>
								{ev.charAt(0).toUpperCase() + ev.slice(1)}
							</option>
						))}
					</select>
					<select
						className={inputCls}
						value={newCategory}
						onChange={(e) => setNewCategory(e.target.value)}
					>
						{CATEGORIES.map((c) => (
							<option key={c} value={c}>{c}</option>
						))}
					</select>
					<input
						className={inputCls}
						placeholder="Vendor (optional)"
						value={newVendor}
						onChange={(e) => setNewVendor(e.target.value)}
					/>
					<input
						className={inputCls}
						type="number"
						min={0}
						placeholder="Estimated RM"
						value={newEstimated || ""}
						onChange={(e) => setNewEstimated(Math.max(0, Number(e.target.value) || 0))}
					/>
					<input
						className={inputCls}
						type="number"
						min={0}
						placeholder="Paid RM"
						value={newPaid || ""}
						onChange={(e) => setNewPaid(Math.max(0, Number(e.target.value) || 0))}
					/>
					<input
						className={`${inputCls} col-span-2 xl:col-span-1`}
						placeholder="Paid by"
						value={newPaidBy}
						onChange={(e) => setNewPaidBy(e.target.value)}
					/>
					<button
						type="submit"
						disabled={saving}
						className="col-span-2 rounded-lg bg-sage px-5 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-50 md:col-span-1 md:col-start-2 xl:col-span-1 xl:col-start-auto"
					>
						{saving ? "Saving…" : "+ Add"}
					</button>
				</form>
			)}

			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2">
					{/* Event tabs */}
					{allEvents.map((ev) => (
						<button
							key={ev}
							type="button"
							onClick={() => setActiveEvent(ev)}
							className={`rounded-full px-4 py-2 text-[12px] uppercase tracking-[0.14em] transition-colors ${
								activeEvent === ev
									? "bg-sage text-white"
									: "border border-line bg-white text-muted hover:border-sage hover:text-ink"
							}`}
						>
							{ev.charAt(0).toUpperCase() + ev.slice(1)}
						</button>
					))}
					<button
						type="button"
						onClick={load}
						disabled={loading}
						className="rounded-lg bg-sage px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-50"
					>
						{loading ? "Loading…" : "↻ Reload"}
					</button>
				</div>
				{updatedAt && !loading && (
					<span className="text-[11px] text-muted">
						Updated {updatedAt.toLocaleTimeString("en-MY")}
					</span>
				)}
			</div>

			{/* Totals */}
			<div className="mb-4 grid gap-3 sm:grid-cols-4">
				<div className="rounded-2xl border border-line bg-white p-4 text-center">
					<p className="text-[10px] uppercase tracking-[0.2em] text-muted">Estimated</p>
					<p className="mt-1 font-serif text-2xl text-ink">{fmtRM(totalEstimated)}</p>
				</div>
				<div className="rounded-2xl border border-line bg-white p-4 text-center">
					<p className="text-[10px] uppercase tracking-[0.2em] text-muted">Paid</p>
					<p className="mt-1 font-serif text-2xl text-sage">{fmtRM(totalPaid)}</p>
				</div>
				<div className="rounded-2xl border border-line bg-white p-4 text-center">
					<p className="text-[10px] uppercase tracking-[0.2em] text-muted">Balance</p>
					<p className={`mt-1 font-serif text-2xl ${totalBalance > 0 ? "text-[#A0524B]" : "text-ink"}`}>
						{fmtRM(totalBalance)}
					</p>
				</div>
				<div className="rounded-2xl border border-sage/30 bg-sage-soft p-4 text-center">
					<p className="text-[10px] uppercase tracking-[0.2em] text-sage">Fully paid</p>
					<p className="mt-1 font-serif text-2xl text-sage">
						{paidCount}/{sorted.length}
					</p>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
				<table className="w-full min-w-[900px] border-collapse text-left">
					<thead>
						<tr className="border-b border-line bg-cream">
							<th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">#</th>
							{([
								["item", "Item"],
								["category", "Category"],
								["vendor", "Vendor"],
								["estimated", "Estimated"],
								["paid", "Paid"],
								["balance", "Balance"],
								["date", "Date"],
								["paidBy", "Paid by"],
							] as const).map(([key, label]) => (
								<th
									key={key}
									className="cursor-pointer select-none px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
									onClick={() => toggleSort(key)}
								>
									{label}
									{sortKey === key && (
										<span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
									)}
								</th>
							))}
							{canEdit && <th className="px-3 py-3" />}
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={canEdit ? 10 : 9} className="px-4 py-10 text-center text-[13px] text-muted">
									Loading budget…
								</td>
							</tr>
						) : sorted.length === 0 ? (
							<tr>
								<td colSpan={canEdit ? 10 : 9} className="px-4 py-10 text-center text-[13px] text-muted">
									No budget items yet.
								</td>
							</tr>
						) : (
							sorted.map((it, i) =>
								editingId === it._id ? (
									// Edit row — inline form for all fields.
									<tr key={it._id} className="border-b border-sage/40 bg-cream/50">
										<td className="px-3 py-2 text-[12px] text-muted">{i + 1}</td>
										<td className="px-3 py-2">
											<input
												className="w-full rounded border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-sage"
												value={draft.item ?? ""}
												onChange={(e) => setDraft({ ...draft, item: e.target.value })}
											/>
										</td>
										<td className="px-3 py-2">
											<select
												className="w-full rounded border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-sage"
												value={draft.category ?? ""}
												onChange={(e) => setDraft({ ...draft, category: e.target.value })}
											>
												{CATEGORIES.map((c) => (
													<option key={c} value={c}>{c}</option>
												))}
											</select>
										</td>
										<td className="px-3 py-2">
											<input
												className="w-full rounded border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-sage"
												value={draft.vendor ?? ""}
												onChange={(e) => setDraft({ ...draft, vendor: e.target.value })}
											/>
										</td>
										<td className="px-3 py-2">
											<input
												className="w-24 rounded border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-sage"
												type="number"
												min={0}
												value={draft.estimated ?? 0}
												onChange={(e) => setDraft({ ...draft, estimated: Math.max(0, Number(e.target.value) || 0) })}
											/>
										</td>
										<td className="px-3 py-2">
											<input
												className="w-24 rounded border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-sage"
												type="number"
												min={0}
												value={draft.paid ?? 0}
												onChange={(e) => setDraft({ ...draft, paid: Math.max(0, Number(e.target.value) || 0) })}
											/>
										</td>
										<td className="px-3 py-2 text-[13px] text-muted">
											{fmtRM(Math.max(0, (draft.estimated ?? 0) - (draft.paid ?? 0)))}
										</td>
										<td className="px-3 py-2">
											<input
												className="w-28 rounded border border-line bg-white px-2 py-1 text-[12px] outline-none focus:border-sage"
												value={draft.date ?? ""}
												onChange={(e) => setDraft({ ...draft, date: e.target.value })}
												placeholder="dd/mm/yyyy"
											/>
										</td>
										<td className="px-3 py-2">
											<input
												className="w-full rounded border border-line bg-white px-2 py-1 text-[12px] outline-none focus:border-sage"
												value={draft.paidBy ?? ""}
												onChange={(e) => setDraft({ ...draft, paidBy: e.target.value })}
											/>
										</td>
										<td className="px-3 py-2">
											<div className="flex gap-1">
												<button
													type="button"
													onClick={saveEdit}
													className="rounded bg-sage px-2.5 py-1 text-[11px] uppercase tracking-wide text-white"
												>
													Save
												</button>
												<button
													type="button"
													onClick={cancelEdit}
													className="rounded border border-line bg-white px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted"
												>
													✕
												</button>
											</div>
										</td>
									</tr>
								) : (
									<tr
										key={it._id}
										className="border-b border-line/60 transition-colors last:border-0 hover:bg-cream/60"
									>
										<td className="px-3 py-3 text-[12px] text-muted">{i + 1}</td>
										<td className="px-3 py-3 font-serif text-[15px] text-ink">
											{it.item}
											{it.notes && (
												<span className="block text-[11px] font-normal italic text-muted/70">{it.notes}</span>
											)}
										</td>
										<td className="px-3 py-3 text-[12px] text-muted">{it.category || "—"}</td>
										<td className="px-3 py-3 text-[12px] text-muted">{it.vendor || "—"}</td>
										<td className="px-3 py-3 text-[13px] text-ink">{fmtRM(it.estimated)}</td>
										<td className="px-3 py-3 text-[13px] text-sage">{fmtRM(it.paid)}</td>
										<td className={`px-3 py-3 text-[13px] ${it.balance > 0 ? "text-[#A0524B]" : "text-muted"}`}>
											{fmtRM(it.balance)}
										</td>
										<td className="px-3 py-3 text-[12px] text-muted">{it.date || "—"}</td>
										<td className="px-3 py-3 text-[12px] text-muted">{it.paidBy || "—"}</td>
										{canEdit && (
											<td className="px-3 py-3">
												<div className="flex gap-1">
													<button
														type="button"
														onClick={() => beginEdit(it)}
														className="rounded border border-line bg-white px-2 py-1 text-[11px] text-muted hover:border-sage hover:text-ink"
													>
														✎
													</button>
													<button
														type="button"
														onClick={() => setDeletingItem(it)}
														className="rounded border border-line bg-white px-2 py-1 text-[11px] text-muted hover:border-[#E4C5C2] hover:text-[#A0524B]"
													>
														🗑
													</button>
												</div>
											</td>
										)}
									</tr>
								),
							)
						)}
					</tbody>
				</table>
			</div>

			{/* Delete confirmation popup */}
			{deletingItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
					<div className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl">
						<h3 className="mb-2 font-serif text-lg text-ink">Delete item?</h3>
						<p className="mb-4 text-[13px] leading-relaxed text-muted">
							"{deletingItem.item}" ({fmtRM(deletingItem.estimated)}) will be permanently removed.
						</p>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => removeItem(deletingItem._id)}
								className="flex-1 rounded-lg bg-[#A0524B] px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
							>
								Delete
							</button>
							<button
								type="button"
								onClick={() => setDeletingItem(null)}
								className="flex-1 rounded-lg border border-line bg-white px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Totals summary */}
			{!loading && sorted.length > 0 && (
				<div className="mt-3 flex flex-wrap justify-end gap-4 text-[12px] text-muted">
					<span>Total estimated: <b className="text-ink">{fmtRM(totalEstimated)}</b></span>
					<span>Total paid: <b className="text-sage">{fmtRM(totalPaid)}</b></span>
					<span>Outstanding: <b className={totalBalance > 0 ? "text-[#A0524B]" : "text-ink"}>{fmtRM(totalBalance)}</b></span>
				</div>
			)}
				</>
			)}

			{/* ══ Home - Meridin ══ */}
			{activeTable === "home" && (
				<>
					{/* Home add form toggle */}
					{canEdit && !showHomeAdd && (
						<div className="mb-4 text-center">
							<button
								type="button"
								onClick={() => setShowHomeAdd(true)}
								className="rounded-full border border-line bg-white px-5 py-2 text-[12px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-sage hover:text-ink"
							>
								+ Add home item
							</button>
						</div>
					)}
					{canEdit && showHomeAdd && (
						<form
							onSubmit={addHomeItem}
							className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] md:grid-cols-3 xl:grid-cols-7"
						>
							<input
								className={`${inputCls} col-span-2 md:col-span-3 xl:col-span-2`}
								placeholder="Item name…"
								value={newHomeName}
								onChange={(e) => setNewHomeName(e.target.value)}
								required
							/>
							<select
								className={inputCls}
								value={newHomeCategory}
								onChange={(e) => setNewHomeCategory(e.target.value)}
							>
								{HOME_CATEGORIES.map((c) => (
									<option key={c} value={c}>{c}</option>
								))}
							</select>
							<input
								className={inputCls}
								type="number"
								min={0}
								placeholder="Unit price RM"
								value={newHomePrice || ""}
								onChange={(e) => setNewHomePrice(Math.max(0, Number(e.target.value) || 0))}
							/>
							<input
								className={inputCls}
								type="number"
								min={1}
								placeholder="Qty"
								value={newHomeQty}
								onChange={(e) => setNewHomeQty(Math.max(1, Math.round(Number(e.target.value) || 1)))}
							/>
							<input
								className={inputCls}
								type="number"
								min={0}
								placeholder="Paid RM"
								value={newHomePaid || ""}
								onChange={(e) => setNewHomePaid(Math.max(0, Number(e.target.value) || 0))}
							/>
							<input
								className={inputCls}
								placeholder="Paid by"
								value={newHomePaidBy}
								onChange={(e) => setNewHomePaidBy(e.target.value)}
							/>
							<input
								className={`${inputCls} col-span-2 xl:col-span-2`}
								placeholder="Notes (optional)"
								value={newHomeNotes}
								onChange={(e) => setNewHomeNotes(e.target.value)}
							/>
							<button
								type="submit"
								disabled={saving}
								className="col-span-2 rounded-lg bg-sage px-5 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-50 md:col-span-1 md:col-start-2 xl:col-span-1 xl:col-start-auto"
							>
								{saving ? "Saving…" : "+ Add"}
							</button>
						</form>
					)}

					{/* Home totals */}
					<div className="mb-4 grid gap-3 sm:grid-cols-4">
						<div className="rounded-2xl border border-line bg-white p-4 text-center">
							<p className="text-[10px] uppercase tracking-[0.2em] text-muted">Total cost</p>
							<p className="mt-1 font-serif text-2xl text-ink">{fmtRM(homeTotalPrice)}</p>
						</div>
						<div className="rounded-2xl border border-line bg-white p-4 text-center">
							<p className="text-[10px] uppercase tracking-[0.2em] text-muted">Paid</p>
							<p className="mt-1 font-serif text-2xl text-sage">{fmtRM(homeTotalPaid)}</p>
						</div>
						<div className="rounded-2xl border border-line bg-white p-4 text-center">
							<p className="text-[10px] uppercase tracking-[0.2em] text-muted">Balance</p>
							<p className={`mt-1 font-serif text-2xl ${homeTotalBalance > 0 ? "text-[#A0524B]" : "text-ink"}`}>
								{fmtRM(homeTotalBalance)}
							</p>
						</div>
						<div className="rounded-2xl border border-sage/30 bg-sage-soft p-4 text-center">
							<p className="text-[10px] uppercase tracking-[0.2em] text-sage">Fully paid</p>
							<p className="mt-1 font-serif text-2xl text-sage">
								{homePaidCount}/{homeSorted.length}
							</p>
						</div>
					</div>

					{/* Home table */}
					<div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
						<table className="w-full min-w-[1000px] border-collapse text-left">
							<thead>
								<tr className="border-b border-line bg-cream">
									<th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">ID</th>
									{([
										["name", "Item name"],
										["category", "Type"],
										["price", "Price"],
										["qty", "Qty"],
										["totalPrice", "Total"],
										["paid", "Paid"],
										["balance", "Balance"],
										["paidBy", "Paid by"],
										["txnStatus", "Trxn"],
									] as const).map(([key, label]) => (
										<th
											key={key}
											className="cursor-pointer select-none px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
											onClick={() => toggleHomeSort(key)}
										>
											{label}
											{homeSortKey === key && (
												<span className="ml-1">{homeSortDir === "asc" ? "↑" : "↓"}</span>
											)}
										</th>
									))}
									{canEdit && <th className="px-3 py-3" />}
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td colSpan={canEdit ? 11 : 10} className="px-4 py-10 text-center text-[13px] text-muted">
											Loading home items…
										</td>
									</tr>
								) : homeSorted.length === 0 ? (
									<tr>
										<td colSpan={canEdit ? 11 : 10} className="px-4 py-10 text-center text-[13px] text-muted">
											No home items yet.
										</td>
									</tr>
								) : (
									homeSorted.map((it) =>
										editingHomeId === it._id ? (
											// Edit row — inline form for home item fields.
											<tr key={it._id} className="border-b border-sage/40 bg-cream/50">
												<td className="px-3 py-2">
													<input
														className="w-16 rounded border border-line bg-white px-2 py-1 text-[12px] font-mono outline-none focus:border-sage"
														value={homeDraft.itemId ?? ""}
														onChange={(e) => setHomeDraft({ ...homeDraft, itemId: e.target.value })}
													/>
												</td>
												<td className="px-3 py-2">
													<input
														className="w-full rounded border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-sage"
														value={homeDraft.name ?? ""}
														onChange={(e) => setHomeDraft({ ...homeDraft, name: e.target.value })}
													/>
													<input
														className="mt-1 w-full rounded border border-line bg-white px-2 py-1 text-[11px] text-muted outline-none focus:border-sage"
														value={homeDraft.notes ?? ""}
														onChange={(e) => setHomeDraft({ ...homeDraft, notes: e.target.value })}
														placeholder="Notes"
													/>
												</td>
												<td className="px-3 py-2">
													<select
														className="w-full rounded border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-sage"
														value={homeDraft.category ?? ""}
														onChange={(e) => setHomeDraft({ ...homeDraft, category: e.target.value })}
													>
														{HOME_CATEGORIES.map((c) => (
															<option key={c} value={c}>{c}</option>
														))}
													</select>
												</td>
												<td className="px-3 py-2">
													<input
														className="w-20 rounded border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-sage"
														type="number"
														min={0}
														value={homeDraft.price ?? 0}
														onChange={(e) => setHomeDraft({ ...homeDraft, price: Math.max(0, Number(e.target.value) || 0) })}
													/>
												</td>
												<td className="px-3 py-2">
													<input
														className="w-14 rounded border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-sage"
														type="number"
														min={1}
														value={homeDraft.qty ?? 1}
														onChange={(e) => setHomeDraft({ ...homeDraft, qty: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
													/>
												</td>
												<td className="px-3 py-2 text-[13px] text-muted">
													{fmtRM((homeDraft.price ?? 0) * (homeDraft.qty ?? 1))}
												</td>
												<td className="px-3 py-2">
													<input
														className="w-20 rounded border border-line bg-white px-2 py-1 text-[13px] outline-none focus:border-sage"
														type="number"
														min={0}
														value={homeDraft.paid ?? 0}
														onChange={(e) => setHomeDraft({ ...homeDraft, paid: Math.max(0, Number(e.target.value) || 0) })}
													/>
												</td>
												<td className="px-3 py-2 text-[13px] text-muted">
													{fmtRM(Math.max(0, (homeDraft.price ?? 0) * (homeDraft.qty ?? 1) - (homeDraft.paid ?? 0)))}
												</td>
												<td className="px-3 py-2">
													<input
														className="w-full rounded border border-line bg-white px-2 py-1 text-[12px] outline-none focus:border-sage"
														value={homeDraft.paidBy ?? ""}
														onChange={(e) => setHomeDraft({ ...homeDraft, paidBy: e.target.value })}
													/>
												</td>
												<td className="px-3 py-2">
													<select
														className="w-full rounded border border-line bg-white px-2 py-1 text-[12px] outline-none focus:border-sage"
														value={homeDraft.txnStatus ?? ""}
														onChange={(e) => setHomeDraft({ ...homeDraft, txnStatus: e.target.value })}
													>
														<option value="">—</option>
														<option value="Paid">Paid</option>
														<option value="Not Paid">Not Paid</option>
														<option value="Pay Later">Pay Later</option>
														<option value="NA">NA</option>
													</select>
												</td>
												<td className="px-3 py-2">
													<div className="flex gap-1">
														<button
															type="button"
															onClick={saveHomeEdit}
															className="rounded bg-sage px-2.5 py-1 text-[11px] uppercase tracking-wide text-white"
														>
															Save
														</button>
														<button
															type="button"
															onClick={cancelHomeEdit}
															className="rounded border border-line bg-white px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted"
														>
															✕
														</button>
													</div>
												</td>
											</tr>
										) : (
										<tr
											key={it._id}
											className="border-b border-line/60 transition-colors last:border-0 hover:bg-cream/60"
										>
											<td className="px-3 py-3 text-[12px] font-mono text-muted">{it.itemId}</td>
											<td className="px-3 py-3 font-serif text-[15px] text-ink">
												{it.name}
												{it.notes && (
													<span className="block text-[11px] font-normal italic text-muted/70">{it.notes}</span>
												)}
												{it.dimension && (
													<span className="block text-[11px] font-normal text-muted/50">{it.dimension}</span>
												)}
											</td>
											<td className="px-3 py-3 text-[12px] text-muted">{it.category}</td>
											<td className="px-3 py-3 text-[13px] text-ink">{fmtRM(it.price)}</td>
											<td className="px-3 py-3 text-[13px] text-muted">{it.qty}</td>
											<td className="px-3 py-3 text-[13px] text-ink">{fmtRM(it.totalPrice)}</td>
											<td className="px-3 py-3 text-[13px] text-sage">{fmtRM(it.paid)}</td>
											<td className={`px-3 py-3 text-[13px] ${it.balance > 0 ? "text-[#A0524B]" : "text-muted"}`}>
												{fmtRM(it.balance)}
											</td>
											<td className="px-3 py-3 text-[12px] text-muted">{it.paidBy || "—"}</td>
											<td className="px-3 py-3">
												<span
													className={`rounded-full border px-2 py-0.5 text-[10px] ${
														it.txnStatus === "Paid"
															? "border-sage/30 bg-sage-soft text-sage"
															: it.txnStatus === "Pay Later"
																? "border-gold/30 bg-gold/10 text-gold"
																: "border-line bg-cream text-muted"
													}`}
												>
													{it.txnStatus || "—"}
												</span>
											</td>
											{canEdit && (
												<td className="px-3 py-3">
													<div className="flex gap-1">
														<button
															type="button"
															onClick={() => beginHomeEdit(it)}
															className="rounded border border-line bg-white px-2 py-1 text-[11px] text-muted hover:border-sage hover:text-ink"
														>
															✎
														</button>
														<button
															type="button"
															onClick={() => setDeletingHomeItem(it)}
															className="rounded border border-line bg-white px-2 py-1 text-[11px] text-muted hover:border-[#E4C5C2] hover:text-[#A0524B]"
														>
															🗑
														</button>
													</div>
												</td>
											)}
										</tr>
										),
									)
								)}
							</tbody>
						</table>
					</div>

					{/* Home totals summary */}
					{!loading && homeSorted.length > 0 && (
						<div className="mt-3 flex flex-wrap justify-end gap-4 text-[12px] text-muted">
							<span>Total cost: <b className="text-ink">{fmtRM(homeTotalPrice)}</b></span>
							<span>Total paid: <b className="text-sage">{fmtRM(homeTotalPaid)}</b></span>
							<span>Outstanding: <b className={homeTotalBalance > 0 ? "text-[#A0524B]" : "text-ink"}>{fmtRM(homeTotalBalance)}</b></span>
						</div>
					)}
				</>
			)}

			{/* Home delete confirmation popup */}
			{deletingHomeItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
					<div className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl">
						<h3 className="mb-2 font-serif text-lg text-ink">Delete item?</h3>
						<p className="mb-4 text-[13px] leading-relaxed text-muted">
							"{deletingHomeItem.name}" ({fmtRM(deletingHomeItem.totalPrice)}) will be permanently removed.
						</p>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => removeHomeItem(deletingHomeItem._id)}
								className="flex-1 rounded-lg bg-[#A0524B] px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
							>
								Delete
							</button>
							<button
								type="button"
								onClick={() => setDeletingHomeItem(null)}
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
