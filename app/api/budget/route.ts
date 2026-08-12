import { NextResponse } from "next/server"
import { loadSettings } from "@/lib/settings"

export const dynamic = "force-dynamic"

/**
 * Budget list — fetched READ-ONLY from a Google Spreadsheet.
 *
 * Configure the sheet URL on the /admin page (Bajet tab) or via the
 * BUDGET_SHEET_URL env variable. The sheet must be shared as
 * "Anyone with the link can view".
 *
 * Supported columns (header row, flexible naming, MY/EN):
 * Item/Perkara · Majlis/Event · Kategori/Category · Anggaran/Estimated ·
 * Sebenar/Actual · Dibayar/Paid
 */

function toCsvUrl(url: string): string | null {
	const m = url.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/)
	if (!m) return null
	const gid = url.match(/[#?&]gid=(\d+)/)?.[1]
	return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv${gid ? `&gid=${gid}` : ""}`
}

/** Minimal quote-aware CSV parser. */
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

const toNumber = (s: string | undefined): number => {
	const n = parseFloat(String(s ?? "").replace(/[^0-9.-]/g, ""))
	return Number.isFinite(n) ? n : 0
}

export async function GET() {
	const { settings } = await loadSettings()
	const sheetUrl = settings.budgetSheetUrl || process.env.BUDGET_SHEET_URL || ""
	if (!sheetUrl) {
		return NextResponse.json(
			{
				error:
					"The budget Google Sheet has not been set. Go to the ✏️ Edit page → Budget tab, paste your Google Spreadsheet URL, and press Save.",
			},
			{ status: 503 },
		)
	}
	const csvUrl = toCsvUrl(sheetUrl)
	if (!csvUrl) {
		return NextResponse.json(
			{ error: "Invalid Google Spreadsheet URL. It should look like https://docs.google.com/spreadsheets/d/…" },
			{ status: 400 },
		)
	}
	try {
		const res = await fetch(csvUrl, { cache: "no-store", redirect: "follow" })
		if (!res.ok) {
			return NextResponse.json(
				{
					error: `Google Sheets responded with status ${res.status}. Make sure the sheet is shared as "Anyone with the link can view".`,
				},
				{ status: 502 },
			)
		}
		const rows = parseCsv(await res.text())
		if (rows.length === 0) {
			return NextResponse.json({ items: [], sheetUrl })
		}
		const header = rows[0].map((h) => h.trim().toLowerCase())
		const col = (...names: string[]) =>
			header.findIndex((h) => names.some((n) => h.includes(n)))
		const iItem = col("item", "perkara")
		const iEvent = col("majlis", "event")
		const iCategory = col("kategori", "category")
		const iEstimated = col("anggaran", "estimat", "budget")
		const iActual = col("sebenar", "actual", "belanja")
		const iPaid = col("bayar", "paid", "status")
		const items = rows
			.slice(1)
			.filter((r) => r.some((c) => c.trim() !== ""))
			.map((r, i) => ({
				id: i,
				item: (iItem >= 0 ? r[iItem] : r[0])?.trim() ?? "",
				event: (iEvent >= 0 ? r[iEvent] : "")?.trim() ?? "",
				category: (iCategory >= 0 ? r[iCategory] : "")?.trim() ?? "",
				estimated: iEstimated >= 0 ? toNumber(r[iEstimated]) : 0,
				actual: iActual >= 0 ? toNumber(r[iActual]) : 0,
				paid:
					iPaid >= 0
						? /ya|yes|true|sudah|paid|dibayar|selesai|done|✓|✔|1/i.test(
								(r[iPaid] ?? "").trim(),
							)
						: false,
			}))
		return NextResponse.json({ items, sheetUrl })
	} catch (e) {
		return NextResponse.json(
			{
				error:
					e instanceof Error
						? `Could not load the Google Sheet: ${e.message}`
						: "Could not load the Google Sheet.",
			},
			{ status: 502 },
		)
	}
}
