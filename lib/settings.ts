import {
	site,
	type Guestlist,
	type Invitation,
	type WeddingEvent,
} from "@/content/site"
import { getDb, isMongoConfigured } from "@/lib/mongodb"

/**
 * Site settings = all editable planner content (events + tentative flows,
 * invitations, guestlist embeds, budget sheet URL). Stored in MongoDB
 * (collection "settings", doc { key: "site" }) and editable from /admin.
 *
 * `content/site.ts` only provides the DEFAULT values used to seed the DB
 * (and as a fallback when MongoDB is not configured yet).
 */

export type SiteSettings = {
	events: WeddingEvent[]
	invitations: Invitation[]
	guestlists: Guestlist[]
	/** Google Spreadsheet URL for the read-only budget list */
	budgetSheetUrl: string
}

export const defaultSettings: SiteSettings = {
	events: site.events,
	invitations: site.invitations,
	guestlists: site.guestlists,
	budgetSheetUrl: site.budgetSheetUrl,
}

export type SettingsResult = {
	settings: SiteSettings
	/** true when the settings were loaded from MongoDB */
	persisted: boolean
	/** true when MONGODB_URI is set */
	configured: boolean
}

export async function loadSettings(): Promise<SettingsResult> {
	if (!isMongoConfigured()) {
		return { settings: defaultSettings, persisted: false, configured: false }
	}
	try {
		const db = await getDb()
		const doc = await db.collection("settings").findOne({ key: "site" })
		if (!doc) {
			return { settings: defaultSettings, persisted: false, configured: true }
		}
		return {
			settings: {
				events: (doc.events as WeddingEvent[]) ?? defaultSettings.events,
				invitations:
					(doc.invitations as Invitation[]) ?? defaultSettings.invitations,
				guestlists:
					(doc.guestlists as Guestlist[]) ?? defaultSettings.guestlists,
				budgetSheetUrl:
					typeof doc.budgetSheetUrl === "string"
						? doc.budgetSheetUrl
						: defaultSettings.budgetSheetUrl,
			},
			persisted: true,
			configured: true,
		}
	} catch {
		// If the DB is unreachable, fall back to defaults so the site still works.
		return { settings: defaultSettings, persisted: false, configured: true }
	}
}
