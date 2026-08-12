"use client"

import { Fragment } from "react"
import type { FlowStep, LaneId, WeddingEvent } from "@/content/site"
import { site } from "@/content/site"

/**
 * Tentative matrix diagram for one event.
 *
 * Columns (top headers)  = LOCATIONS
 * Rows    (left headers) = TIMES
 * Each card sits at (time, location) and is colored by who is involved
 * (Eiman / Nadia / the couple / family & guests / everyone).
 */

const LANE_DOT: Record<LaneId, string> = {
	groom: "bg-[#1E2A52]",
	bride: "bg-[#7A4E9E]",
	family: "bg-gold",
}

const LANE_STYLE: Record<LaneId, string> = {
	groom: "border-l-[3px] border-l-[#1E2A52] bg-white",
	bride: "border-l-[3px] border-l-[#7A4E9E] bg-white",
	family: "border-l-[3px] border-l-gold bg-white",
}

function stepStyle(lanes: LaneId[]): string {
	if (lanes.length >= 3) return "border-l-[3px] border-l-sage bg-sage-soft"
	if (lanes.length === 2) return "border-l-[3px] border-l-[#55405E] bg-[#F4EFF7]"
	return LANE_STYLE[lanes[0]] ?? "border-l-[3px] border-l-line bg-white"
}

function laneLabel(id: LaneId): string {
	return site.lanes.find((l) => l.id === id)?.label ?? id
}

type Column = { name: string; url?: string }
type Row = { time: string; cells: { step: FlowStep; col: number }[] }

/**
 * Build the location × time matrix. A step without an explicit location
 * inherits the previous step's location (the flow is chronological).
 */
function buildMatrix(steps: FlowStep[]): { columns: Column[]; rows: Row[] } {
	const columns: Column[] = []
	const rows: Row[] = []
	let lastLocation = ""
	for (const step of steps) {
		const name = step.location?.trim() || lastLocation || "Event location"
		lastLocation = name
		let col = columns.findIndex((c) => c.name === name)
		if (col === -1) {
			columns.push({ name, url: step.locationUrl })
			col = columns.length - 1
		} else if (step.locationUrl && !columns[col].url) {
			columns[col].url = step.locationUrl
		}
		const last = rows[rows.length - 1]
		const row =
			last && last.time === step.time
				? last
				: rows[rows.push({ time: step.time, cells: [] }) - 1]
		row.cells.push({ step, col })
	}
	return { columns, rows }
}

function StepCard({ step }: { step: FlowStep }) {
	const everyone = step.lanes.length >= 3
	return (
		<div
			className={`flex h-full flex-col gap-1.5 rounded-xl border border-line p-3 shadow-[0_1px_2px_rgba(0,0,0,.04)] ${stepStyle(step.lanes)}`}
		>
			<p className="font-serif text-[15px] leading-snug text-ink">{step.title}</p>
			{step.detail && (
				<p className="text-[12px] leading-snug text-muted">{step.detail}</p>
			)}
			<div className="mt-auto flex flex-wrap gap-1 pt-1">
				{everyone ? (
					<span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-0.5 text-[10px] text-muted">
						<span className="h-2 w-2 rounded-full bg-sage" />
						Everyone
					</span>
				) : (
					step.lanes.map((l) => (
						<span
							key={l}
							className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-0.5 text-[10px] text-muted"
						>
							<span className={`h-2 w-2 rounded-full ${LANE_DOT[l]}`} />
							{laneLabel(l)}
						</span>
					))
				)}
			</div>
		</div>
	)
}

export default function SwimLane({ event }: { event: WeddingEvent }) {
	const { columns, rows } = buildMatrix(event.flow)

	return (
		<div className="space-y-4">
			{/* Pre-event steps (e.g. overnight hotel stay) */}
			{event.preSteps.length > 0 && (
				<div className="space-y-2">
					{event.preSteps.map((step) => (
						<div
							key={step.title}
							className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-dashed border-gold/60 bg-[#FBF6EC] px-4 py-3"
						>
							<span className="rounded-full bg-gold px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white">
								Before the event · {step.time}
							</span>
							<span className="font-serif text-[15px] text-ink">{step.title}</span>
							{step.detail && (
								<span className="w-full text-[12px] text-muted">{step.detail}</span>
							)}
						</div>
					))}
				</div>
			)}

			{/* Legend */}
			<div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
				{site.lanes.map((lane) => (
					<span key={lane.id} className="inline-flex items-center gap-1.5">
						<span className={`h-2.5 w-2.5 rounded-full ${LANE_DOT[lane.id]}`} />
						{lane.label}
					</span>
				))}
				<span className="inline-flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-full bg-[#55405E]" />
					The couple
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-full bg-sage" />
					Everyone
				</span>
			</div>

			{/* Matrix grid: location columns × time rows (scrolls on small screens) */}
			<div className="overflow-x-auto rounded-2xl border border-line bg-cream p-3">
				<div
					className="grid gap-2"
					style={{
						gridTemplateColumns: `110px repeat(${columns.length}, minmax(230px, 1fr))`,
					}}
				>
					{/* Corner cell */}
					<div
						className="sticky left-0 z-10 flex items-end rounded-lg bg-cream px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-muted"
						style={{ gridRow: 1, gridColumn: 1 }}
					>
						Time ↓
					</div>

					{/* Column headers: locations */}
					{columns.map((col, ci) => (
						<div
							key={col.name}
							className="rounded-xl bg-sage px-3 py-2.5 text-center text-white"
							style={{ gridRow: 1, gridColumn: ci + 2 }}
						>
							<span className="block font-serif text-[15px] leading-tight">
								📍 {col.name}
							</span>
							{col.url && (
								<a
									href={col.url}
									target="_blank"
									rel="noreferrer"
									className="mt-0.5 inline-block text-[10px] uppercase tracking-[0.14em] text-white/80 underline-offset-2 hover:underline"
								>
									Open map ↗
								</a>
							)}
						</div>
					))}

					{/* Rows: time header (left) + cards at (time, location) */}
					{rows.map((row, ri) => (
						<Fragment key={`${row.time}-${ri}`}>
							<div
								className="sticky left-0 z-10 flex items-center justify-center rounded-xl border border-line bg-white px-2 py-2 text-center text-[12px] font-semibold leading-tight text-sage"
								style={{ gridRow: ri + 2, gridColumn: 1 }}
							>
								{row.time}
							</div>
							{columns.map((_, ci) => {
								const cells = row.cells.filter((c) => c.col === ci)
								if (cells.length === 0) return null
								return (
									<div
										key={ci}
										className="flex flex-col gap-2"
										style={{ gridRow: ri + 2, gridColumn: ci + 2 }}
									>
										{cells.map((c, k) => (
											<StepCard key={k} step={c.step} />
										))}
									</div>
								)
							})}
						</Fragment>
					))}
				</div>
			</div>
		</div>
	)
}
