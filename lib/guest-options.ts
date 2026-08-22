import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb, isMongoConfigured } from "@/lib/mongodb"
import { requirePermission } from "@/lib/permissions"

/**
 * Shared helpers for the two customizable guest-list option lists:
 *   - "invited by"  (guest_inviters collection)  → guests.invitedBy
 *   - "category"    (guest_categories collection) → guests.category
 *
 * Both work the same way:
 *   - Guests store the option's *name*, so renaming cascades to guests.
 *   - Deleting an option unassigns guests that used it (value → "").
 *   - Write access requires the edit_guests permission.
 */

export type OptionListConfig = {
	/** Mongo collection holding the options, e.g. "guest_inviters". */
	collection: string
	/** The field on the guest document, e.g. "invitedBy". */
	guestField: "invitedBy" | "category"
	/** Human label used in error messages, e.g. "Inviter". */
	label: string
	/** Response key for the list endpoint, e.g. "inviters". */
	listKey: string
	/** Response key for a single created item, e.g. "inviter". */
	itemKey: string
}

export const INVITERS_CONFIG: OptionListConfig = {
	collection: "guest_inviters",
	guestField: "invitedBy",
	label: "Inviter",
	listKey: "inviters",
	itemKey: "inviter",
}

export const CATEGORIES_CONFIG: OptionListConfig = {
	collection: "guest_categories",
	guestField: "category",
	label: "Category",
	listKey: "categories",
	itemKey: "category",
}

const NOT_CONFIGURED = {
	error:
		"Storage is not configured yet. Add MONGODB_URI in the .env.local file (see .env.example), then restart the server.",
}

/** Escape user input before using it inside a $regex. */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** GET — list all options for the configured collection. */
export async function listOptions(
	config: OptionListConfig,
): Promise<NextResponse> {
	if (!isMongoConfigured()) {
		return NextResponse.json({ [config.listKey]: [] })
	}
	try {
		const db = await getDb()
		const docs = await db
			.collection(config.collection)
			.find({})
			.sort({ createdAt: 1 })
			.toArray()
		return NextResponse.json({
			[config.listKey]: docs.map((d) => ({ ...d, _id: d._id.toString() })),
		})
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}

/** POST — add an option; case-insensitive duplicate check. */
export async function createOption(
	config: OptionListConfig,
	req: Request,
): Promise<NextResponse> {
	const editor = await requirePermission("edit_guests")
	if (!editor.ok) {
		return NextResponse.json({ error: editor.error }, { status: editor.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const body = await req.json()
		const name = typeof body.name === "string" ? body.name.trim() : ""
		if (!name) {
			return NextResponse.json(
				{ error: `${config.label} name is required.` },
				{ status: 400 },
			)
		}
		const db = await getDb()
		const existing = await db.collection(config.collection).findOne({
			name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
		})
		if (existing) {
			return NextResponse.json(
				{ error: `That ${config.label.toLowerCase()} already exists.` },
				{ status: 409 },
			)
		}
		const doc = { name, createdAt: new Date().toISOString() }
		const result = await db.collection(config.collection).insertOne(doc)
		return NextResponse.json(
			{ [config.itemKey]: { ...doc, _id: result.insertedId.toString() } },
			{ status: 201 },
		)
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}

/** PATCH — rename an option and cascade the new name to guests. */
export async function renameOption(
	config: OptionListConfig,
	req: Request,
	id: string,
): Promise<NextResponse> {
	const editor = await requirePermission("edit_guests")
	if (!editor.ok) {
		return NextResponse.json({ error: editor.error }, { status: editor.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const body = await req.json()
		const name = typeof body.name === "string" ? body.name.trim() : ""
		if (!name) {
			return NextResponse.json(
				{ error: `${config.label} name is required.` },
				{ status: 400 },
			)
		}
		const db = await getDb()
		const existing = await db
			.collection(config.collection)
			.findOne({ _id: new ObjectId(id) })
		if (!existing) {
			return NextResponse.json(
				{ error: `${config.label} not found.` },
				{ status: 404 },
			)
		}
		const oldName = existing.name
		if (oldName === name) {
			return NextResponse.json({ ok: true, renamed: 0 })
		}
		const clash = await db.collection(config.collection).findOne({
			name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
			_id: { $ne: existing._id },
		})
		if (clash) {
			return NextResponse.json(
				{ error: `That ${config.label.toLowerCase()} already exists.` },
				{ status: 409 },
			)
		}
		await db
			.collection(config.collection)
			.updateOne({ _id: existing._id }, { $set: { name } })
		// Cascade the rename to guests referencing the old name.
		const guests = await db
			.collection("guests")
			.updateMany({ [config.guestField]: oldName }, { $set: { [config.guestField]: name } })
		return NextResponse.json({ ok: true, renamed: guests.modifiedCount })
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}

/** DELETE — remove an option and unassign guests that used it. */
export async function deleteOption(
	config: OptionListConfig,
	id: string,
): Promise<NextResponse> {
	const editor = await requirePermission("edit_guests")
	if (!editor.ok) {
		return NextResponse.json({ error: editor.error }, { status: editor.status })
	}
	if (!isMongoConfigured()) {
		return NextResponse.json(NOT_CONFIGURED, { status: 503 })
	}
	try {
		const db = await getDb()
		const existing = await db
			.collection(config.collection)
			.findOneAndDelete({ _id: new ObjectId(id) })
		if (!existing) {
			return NextResponse.json(
				{ error: `${config.label} not found.` },
				{ status: 404 },
			)
		}
		// Unassign guests that referenced the deleted option.
		await db
			.collection("guests")
			.updateMany(
				{ [config.guestField]: existing.name },
				{ $set: { [config.guestField]: "" } },
			)
		return NextResponse.json({ ok: true })
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}
