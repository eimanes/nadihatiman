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
 *
 * Categories are additionally OWNED BY an inviter (categories.owner stores
 * the inviter's name): "Eiman → BSN" means BSN only appears in the category
 * dropdown when the Eiman invitation is selected.
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
	/** When true, options are owned by an inviter (categories). */
	ownedByInviter?: boolean
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
	ownedByInviter: true,
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
	owner?: string,
): Promise<NextResponse> {
	if (!isMongoConfigured()) {
		return NextResponse.json({ [config.listKey]: [] })
	}
	try {
		const db = await getDb()
		// For owner-scoped lists (categories), an owner can be passed as a
		// query param: /api/guest-categories?owner=Eiman
		const query: Record<string, unknown> = {}
		if (config.ownedByInviter && owner) query.owner = owner
		const docs = await db
			.collection(config.collection)
			.find(query)
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
		// Categories are owned by an inviter — the owner is required and must
		// be a real inviter. Uniqueness is per-owner ("Eiman → BSN" and
		// "Abah → BSN" are both allowed).
		let owner = ""
		if (config.ownedByInviter) {
			owner = typeof body.owner === "string" ? body.owner.trim() : ""
			if (!owner) {
				return NextResponse.json(
					{ error: "Choose which invitation this category belongs to." },
					{ status: 400 },
				)
			}
			const inviterExists = await db
				.collection("guest_inviters")
				.findOne({ name: owner })
			if (!inviterExists) {
				return NextResponse.json(
					{ error: "That invitation does not exist yet — add it first." },
					{ status: 400 },
				)
			}
		}
		const dupQuery: Record<string, unknown> = {
			name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
		}
		if (config.ownedByInviter) dupQuery.owner = owner
		const existing = await db.collection(config.collection).findOne(dupQuery)
		if (existing) {
			return NextResponse.json(
				{ error: `That ${config.label.toLowerCase()} already exists.` },
				{ status: 409 },
			)
		}
		const doc: Record<string, unknown> = { name, createdAt: new Date().toISOString() }
		if (config.ownedByInviter) doc.owner = owner
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
		// Categories can also be moved to a different invitation (owner).
		let ownerChanged = false
		let newOwner = typeof existing.owner === "string" ? existing.owner : ""
		if (config.ownedByInviter && typeof body.owner === "string") {
			newOwner = body.owner.trim()
			if (newOwner && newOwner !== existing.owner) {
				const inviterExists = await db
					.collection("guest_inviters")
					.findOne({ name: newOwner })
				if (!inviterExists) {
					return NextResponse.json(
						{ error: "That invitation does not exist yet — add it first." },
						{ status: 400 },
					)
				}
				ownerChanged = true
			}
		}
		const clashQuery: Record<string, unknown> = {
			name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
			_id: { $ne: existing._id },
		}
		if (config.ownedByInviter) clashQuery.owner = newOwner
		const clash = await db.collection(config.collection).findOne(clashQuery)
		if (clash) {
			return NextResponse.json(
				{ error: `That ${config.label.toLowerCase()} already exists.` },
				{ status: 409 },
			)
		}
		const optionUpdate: Record<string, unknown> = { name }
		if (ownerChanged) optionUpdate.owner = newOwner
		await db
			.collection(config.collection)
			.updateOne({ _id: existing._id }, { $set: optionUpdate })
		// Cascade the rename to guests referencing the old name. When the
		// owner also changed, only guests that were using this category under
		// the old invitation are renamed.
		const guestQuery: Record<string, unknown> = { [config.guestField]: oldName }
		if (ownerChanged) guestQuery.invitedBy = existing.owner
		const guests = await db
			.collection("guests")
			.updateMany(guestQuery, { $set: { [config.guestField]: name } })
		// Renaming an INVITER also renames the owner stored on its categories,
		// so "Eiman → Im" keeps the categories (BSN, …) pointing at Im.
		if (config.guestField === "invitedBy") {
			await cascadeInviterRename(oldName, name)
		}
		return NextResponse.json({ ok: true, renamed: guests.modifiedCount })
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}

/**
 * Cascade an inviter rename into its owned categories. Called by the
 * guest-inviters PATCH route so "Eiman → Im" also updates the owner stored
 * on Eiman's categories.
 */
export async function cascadeInviterRename(
	oldName: string,
	newName: string,
): Promise<void> {
	const db = await getDb()
	await db
		.collection("guest_categories")
		.updateMany({ owner: oldName }, { $set: { owner: newName } })
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
		// Unassign guests that referenced the deleted option. For owner-scoped
		// options (categories), scope by the owner too so a category with the
		// same name under another invitation is untouched.
		const guestQuery: Record<string, unknown> = {
			[config.guestField]: existing.name,
		}
		if (config.ownedByInviter) guestQuery.invitedBy = existing.owner
		await db
			.collection("guests")
			.updateMany(guestQuery, { $set: { [config.guestField]: "" } })
		// Deleting an INVITER also deletes its owned categories (their owner
		// would otherwise point at a non-existent invitation). Any guest still
		// using one of those categories has it unassigned first.
		if (config.guestField === "invitedBy") {
			const ownedCategories = await db
				.collection("guest_categories")
				.find({ owner: existing.name })
				.map((c) => c.name)
				.toArray()
			if (ownedCategories.length > 0) {
				await db
					.collection("guests")
					.updateMany(
						{ category: { $in: ownedCategories } },
						{ $set: { category: "" } },
					)
			}
			await db
				.collection("guest_categories")
				.deleteMany({ owner: existing.name })
		}
		return NextResponse.json({ ok: true })
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Database error." },
			{ status: 500 },
		)
	}
}
