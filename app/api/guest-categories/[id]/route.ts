import { CATEGORIES_CONFIG, deleteOption, renameOption } from "@/lib/guest-options"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

/** Rename a category — cascades to all guests using the old name. */
export async function PATCH(req: Request, { params }: Params) {
	const { id } = await params
	return renameOption(CATEGORIES_CONFIG, req, id)
}

/** Delete a category — guests using it are unassigned (category → ""). */
export async function DELETE(_req: Request, { params }: Params) {
	const { id } = await params
	return deleteOption(CATEGORIES_CONFIG, _req, id)
}
