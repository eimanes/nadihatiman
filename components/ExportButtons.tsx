"use client"

import * as XLSX from "xlsx"

type ExportRow = Record<string, unknown>

type ExportButtonsProps = {
	rows: ExportRow[]
	filename: string
	className?: string
}

const valueForExport = (value: unknown) => {
	if (Array.isArray(value)) return value.join("; ")
	if (value && typeof value === "object") return JSON.stringify(value)
	return value ?? ""
}

const normalizedRows = (rows: ExportRow[]) =>
	rows.map((row) =>
		Object.fromEntries(Object.entries(row).map(([key, value]) => [key, valueForExport(value)])),
	)

const downloadText = (content: string, filename: string, type: string) => {
	const blob = new Blob([content], { type })
	const url = URL.createObjectURL(blob)
	const link = document.createElement("a")
	link.href = url
	link.download = filename
	link.click()
	URL.revokeObjectURL(url)
}

export default function ExportButtons({ rows, filename, className }: ExportButtonsProps) {
	const exportCsv = () => {
		const sheet = XLSX.utils.json_to_sheet(normalizedRows(rows))
		downloadText(XLSX.utils.sheet_to_csv(sheet), `${filename}.csv`, "text/csv;charset=utf-8")
	}

	const exportText = () => {
		const sheet = XLSX.utils.json_to_sheet(normalizedRows(rows))
		downloadText(XLSX.utils.sheet_to_txt(sheet), `${filename}.txt`, "text/plain;charset=utf-8")
	}

	const exportXlsx = () => {
		const workbook = XLSX.utils.book_new()
		const sheet = XLSX.utils.json_to_sheet(normalizedRows(rows))
		XLSX.utils.book_append_sheet(workbook, sheet, "Export")
		XLSX.writeFile(workbook, `${filename}.xlsx`)
	}

	const buttonClass =
		"rounded-lg border border-line bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:border-sage hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"

	return (
		<div className={`flex min-w-0 flex-wrap items-center gap-1.5 ${className ?? ""}`} aria-label="Export filtered list">
			<span className="mr-1 text-[10px] uppercase tracking-[0.14em] text-muted">Export</span>
			<button type="button" className={buttonClass} onClick={exportXlsx} disabled={rows.length === 0}>XLSX</button>
			<button type="button" className={buttonClass} onClick={exportCsv} disabled={rows.length === 0}>CSV</button>
			<button type="button" className={buttonClass} onClick={exportText} disabled={rows.length === 0}>TXT</button>
		</div>
	)
}
