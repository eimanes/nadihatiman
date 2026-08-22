# NADIhatIMAN — Wedding Planner Nadia & Eiman

A Next.js 15 + Tailwind CSS wedding planner for the three majlis:
**Nikah & Jamuan** (Jumaat, 4 Sep 2026), **Sanding** (Ahad, 6 Sep 2026) and
**Tandang / Walimatulurus** (Ahad, 4 Okt 2026).

All planner content (event details, tentative flows, invitation & guestlist
URLs) is stored in **MongoDB** and editable from the built-in **`/admin`**
page — no code changes needed.

## Landing experience

The home page starts with the **envelope video** ("Klik untuk masuk"). Clicking it plays the envelope opening, then reveals the main page with the original cordially scrolling animations: the pinned hero photo that shrinks into a collage, the marquee ticker, and the scroll-scrubbed polaroid **love story**. Edit the text/photos in `content/site.ts` → `landing` (photos live in `public/images`, video in `public/envelope`).

## Pages

| Route | What it does |
| --- | --- |
| `/` | Dashboard — countdown to the nikah, overview cards for all 3 events (date, time, location links, dress codes), quick links |
| `/tentative` | Tentative of all 3 events as a **location × time matrix** — column headers (top) are the locations, row headers (left) are the times; each card shows the activity and who is involved (Eiman / Nadia / keluarga) |
| `/invitations` | Iframes of the two digital invitations (sanding & tandang) |
| `/guestlist` | Guest list stored in **MongoDB** — proper themed table with add / inline edit (majlis, pihak, pax, status) / delete, filters and pax totals. Canva embeds kept below as read-only reference |
| `/checklist` | Wedding checklist (add / tick / delete, filter per majlis) — stored in **MongoDB** |
| `/budget` | Budget list fetched **read-only from your Google Spreadsheet** (set the sheet URL in `/admin` → Bajet tab; share the sheet as "Anyone with the link can view") |
| `/admin` | **Edit page** — input & edit every detail: dates, times, locations, tentative swim-lane steps (with lane checkboxes), dress codes, invitation URLs, guestlist embeds. Saves to MongoDB |

RSVP has been removed from the project.

### How content loading works

- `content/site.ts` holds the **default values** only.
- The Utama / Tentatif / Jemputan / Tetamu pages call `lib/settings.ts`, which
  reads the `settings` collection in MongoDB (doc `{ key: "site" }`).
- If MongoDB is not configured or nothing has been saved yet, the defaults are
  shown. The first **Simpan** on `/admin` copies everything into the DB — from
  then on, all pages read from the DB.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in MONGODB_URI
npm run dev
```

Then open http://localhost:3000.

### MongoDB setup

The Checklist and Bajet pages persist data in MongoDB via the API routes in
`app/api/checklist` and `app/api/budget` (collections: `checklist`, `budget`).
The `/admin` page saves all planner content via `app/api/settings`
(collection: `settings`).

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) (or run MongoDB locally).
2. Copy `.env.example` to `.env.local` and set:
   ```
   MONGODB_URI="mongodb+srv://user:password@cluster0.xxxxx.mongodb.net"
   MONGODB_DB="nadihatiman"
   ```
3. Restart the dev server. Without `MONGODB_URI`, the site still works with
   the default content — but Checklist/Bajet and saving from `/admin` need the
   database.

### Canva guest lists (read-only, auto-refresh)

The guest lists are embedded with Canva's `view?embed` URL, so they are
**view-only** — the planner never edits the design. The iframe reloads itself
automatically (default: every 5 minutes, configurable per embed, plus a
"Refresh sekarang" button), so the latest Canva data always appears without
manual refreshing.

> Note: the Canva designs must be shared as **"Anyone with the link can view"**
> for the embed to load.

## Editing content

Use **`/admin`** (✏️ Edit in the nav). You can edit, per majlis:

- Basic details — name, emoji, tagline, display date, ISO date (for the
  countdown), display time.
- Locations — label, place name, Google Maps link (add/remove).
- Tentative flow — add/remove/reorder steps; each step has time, activity,
  detail, location + link, and **lane checkboxes** (Eiman / Nadia / Keluarga &
  Tetamu) that control the swim lane placement.
- "Sebelum majlis" pre-steps, dress codes (with hex color swatches), and notes.
- Invitation iframe URLs and Canva guestlist embed URLs (their own tabs).

Press **Simpan** to write everything to MongoDB. `content/site.ts` only
provides the defaults used before the first save.

## Structure

```
app/
  layout.tsx               Root layout + nav + footer
  page.tsx                 Dashboard (countdown + event cards + quick links)
  tentative/page.tsx       Swim lane tentative for all 3 events (from DB)
  invitations/page.tsx     Invitation iframes (from DB)
  guestlist/page.tsx       Guest list table + Canva auto-refresh embeds
                           (guests can be tagged with who invited them AND
                           a customizable category — both managed on the
                           page; responsive card layout on mobile)
  checklist/page.tsx       MongoDB checklist UI
  budget/page.tsx          MongoDB budget tracker UI
  admin/page.tsx           Edit page for ALL planner content
  api/settings/            GET (load) + PUT (save all planner content)
  api/checklist/           GET/POST + PATCH/DELETE by id
  api/guests/              GET/POST (single + bulk import) + PATCH/DELETE by id
                           (fields: name, event, side, pax, phone, note,
                           status, invitedBy, category)
  api/guest-inviters/      GET/POST + PATCH/DELETE by id — manages the
                           "invited by" options (renames cascade to guests,
                           deletes unassign them)
  api/guest-categories/    GET/POST + PATCH/DELETE by id — manages the
                           guest categories, same cascade/unassign behaviour
  api/budget/              GET — fetches & parses your Google Sheet as CSV
components/
  PlannerNav.tsx           Shrinking pill navigation
  SwimLane.tsx             Swim lane diagram renderer
  CanvaEmbed.tsx           Read-only auto-refreshing Canva iframe
  Countdown.tsx            Live countdown (no RSVP)
  Reveal.tsx               IntersectionObserver reveal wrapper
  SmoothScroll.tsx         Lenis inertia scrolling
content/
  site.ts                  DEFAULT planner content (seed / fallback)
lib/
  mongodb.ts               MongoDB connection helper
  settings.ts              Loads planner content from DB with fallback
```
