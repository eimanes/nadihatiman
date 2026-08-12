"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type BudgetRow = {
	id: number
	item: string
	event: string
	category: string
	estimated: number
	actual: number
	paid: boolean
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

/**
 * Budget page — READ-ONLY view of the couple's Google Spreadsheet.
 * The sheet URL is configured on /admin (tab "Budget"); edit the numbers in
 * Google Sheets itself and press "Reload" here.
 */
export default function BudgetPage() {
	const [items, setItems] = useState<BudgetRow[]>([])
	const [sheetUrl, setSheetUrl] = useState<string>("")
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filter, setFilter] = useState("semua")
	const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch("/api/budget", { cache: "no-store" })
			const data = await res.json()
			if (!res.ok) throw new Error(data.error ?? "Error loading budget.")
			setItems(data.items)
			setSheetUrl(data.sheetUrl ?? "")
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
		for (const it of items) {
			if (it.event.trim()) set.add(it.event.trim())
		}
		return [...set]
	}, [items])

	const filtered = useMemo(
		() =>
			filter === "semua"
				? items
				: items.filter(
						(it) => it.event.trim().toLowerCase() === filter.toLowerCase(),
					),
		[items, filter],
	)

	const totalEstimated = filtered.reduce((s, it) => s + it.estimated, 0)
	const totalActual = filtered.reduce((s, it) => s + it.actual, 0)
	const paidCount = filtered.filter((it) => it.paid).length

	return (
		<div className="mx-auto max-w-[1000px] px-5 pb-20 pt-24">
			<header className="py-10 text-center">
				<p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">Budget</p>
				<h1 className="font-serif text-4xl text-ink">Budget list</h1>
				<p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-relaxed text-muted">
					Shown directly from your Google Spreadsheet (read-only). Update the
					numbers in Google Sheets, then press “Reload”.
				</p>
			</header>

			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<select
						className={inputCls}
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
					>
						<option value="semua">All events</option>
						{eventOptions.map((ev) => (
							<option key={ev} value={ev}>
								{ev}
							</option>
						))}
					</select>
					<button
						type="button"
						onClick={load}
						disabled={loading}
						className="rounded-lg bg-sage px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-50"
					>
						{loading ? "Loading…" : "↻ Reload"}
					</button>
					{sheetUrl && (
						<a
							href={sheetUrl}
							target="_blank"
							rel="noreferrer"
							className="rounded-lg border border-line bg-white px-4 py-2 text-[12px] text-ink transition-colors hover:border-sage"
						>
							Open Google Sheet ↗
						</a>
					)}
				</div>
				{updatedAt && !loading && (
					<span className="text-[11px] text-muted">
						Updated {updatedAt.toLocaleTimeString("en-MY")}
					</span>
				)}
			</div>

			{error ? (
				<div className="rounded-2xl border border-[#E4C5C2] bg-[#FBEFEE] px-5 py-6 text-center text-[13px] leading-relaxed text-[#A0524B]">
					{error}
					<div className="mt-3">
						<a
							href="/admin"
							className="inline-block rounded-full bg-sage px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-white"
						>
							✏️ Set the sheet URL on the Edit page
						</a>
					</div>
				</div>
			) : (
				<>
					{/* Totals */}
					<div className="mb-4 grid gap-3 sm:grid-cols-3">
						<div className="rounded-2xl border border-line bg-white p-4 text-center">
							<p className="text-[10px] uppercase tracking-[0.2em] text-muted">Estimated</p>
							<p className="mt-1 font-serif text-2xl text-ink">{fmtRM(totalEstimated)}</p>
						</div>
						<div className="rounded-2xl border border-line bg-white p-4 text-center">
							<p className="text-[10px] uppercase tracking-[0.2em] text-muted">Actual</p>
							<p
								className={`mt-1 font-serif text-2xl ${totalActual > totalEstimated ? "text-[#A0524B]" : "text-ink"}`}
							>
								{fmtRM(totalActual)}
							</p>
						</div>
						<div className="rounded-2xl border border-sage/30 bg-sage-soft p-4 text-center">
							<p className="text-[10px] uppercase tracking-[0.2em] text-sage">Paid</p>
							<p className="mt-1 font-serif text-2xl text-sage">
								{paidCount}/{filtered.length} items
							</p>
						</div>
					</div>

					{/* Table */}
					<div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
						<table className="w-full min-w-[700px] border-collapse text-left">
							<thead>
								<tr className="border-b border-line bg-cream">
									{["#", "Item", "Event", "Category", "Estimated", "Actual", "Status"].map(
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
										<td colSpan={7} className="px-4 py-10 text-center text-[13px] text-muted">
											Loading from Google Sheets…
										</td>
									</tr>
								) : filtered.length === 0 ? (
									<tr>
										<td colSpan={7} className="px-4 py-10 text-center text-[13px] text-muted">
											No budget items in the sheet yet.
										</td>
									</tr>
								) : (
									filtered.map((it, i) => (
										<tr
											key={it.id}
											className="border-b border-line/60 transition-colors last:border-0 hover:bg-cream/60"
										>
											<td className="px-4 py-3 text-[12px] text-muted">{i + 1}</td>
											<td className="px-4 py-3 font-serif text-[15px] text-ink">{it.item}</td>
											<td className="px-4 py-3 text-[13px] text-muted">{it.event || "—"}</td>
											<td className="px-4 py-3 text-[13px] text-muted">{it.category || "—"}</td>
											<td className="px-4 py-3 text-[13px] text-ink">{fmtRM(it.estimated)}</td>
											<td
												className={`px-4 py-3 text-[13px] ${it.actual > it.estimated ? "text-[#A0524B]" : "text-ink"}`}
											>
												{fmtRM(it.actual)}
											</td>
											<td className="px-4 py-3">
												<span
													className={`rounded-full border px-2.5 py-1 text-[11px] ${
														it.paid
															? "border-sage/30 bg-sage-soft text-sage"
															: "border-line bg-cream text-muted"
													}`}
												>
													{it.paid ? "Paid ✓" : "Not paid"}
												</span>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					<p className="mt-4 text-center text-[11px] text-muted">
						Supported columns in the sheet: Item · Event · Category ·
						Estimated · Actual · Paid (yes/no)
					</p>
				</>
			)}
		</div>
	)
}
