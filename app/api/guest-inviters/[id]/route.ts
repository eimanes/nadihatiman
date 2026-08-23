import { INVITERS_CONFIG, deleteOption, renameOption } from "@/lib/guest-options"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

/** Rename an inviter — cascades to all guests using the old name. */
export async function PATCH(req: Request, { params }: Params) {
	const { id } = await params
	return renameOption(INVITERS_CONFIG, req, id)
}

/** Delete an inviter — guests using it are unassigned (invitedBy → ""). */
export async function DELETE(_req: Request, { params }: Params) {
	const { id } = await params
	return deleteOption(INVITERS_CONFIG, _req, id)
}
