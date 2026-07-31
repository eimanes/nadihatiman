# Jim & Pam — Wedding Website

A Next.js 15 + Tailwind CSS recreation of the Cordially demo wedding website,
including the entry overlay, scroll-reveal story chapters, polaroid photo
marquee, live countdown, details cards, and FAQ accordion.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Replacing the images

All photos live in `public/images/`:

| File | Used for |
| --- | --- |
| `chapter-1.jpg` … `chapter-3.jpg` | The three "our story" chapters |
| `gallery-1.jpg` … `gallery-9.jpg` | The polaroid marquee (in caption order) |

Two ways to swap in your own photos:

1. **Keep the filenames** — overwrite the files in `public/images/` and you are done.
2. **Use your own names/paths** — update the `image` fields in `content/site.ts`.

Images are cropped with `object-cover`, so any reasonably large photo works
(portraits look best for chapters, any aspect works for the gallery).

## Editing content

Everything editable (names, dates, venue, ticker line, chapters, captions,
details cards, FAQ, footer quote) lives in one file: `content/site.ts`.

## Structure

```
app/
  layout.tsx        Root layout + metadata
  page.tsx          Page assembly + entry state
  globals.css       Tailwind layers + reduced-motion rules
components/
  EnterOverlay.tsx  "Click to enter" splash
  Hero.tsx          Names + staggered entrance + scroll cue
  Ticker.tsx        Infinite invitation marquee
  Story.tsx         Alternating chapters with scroll reveals
  Gallery.tsx       Polaroid photo marquee (pauses on hover)
  Join.tsx          Live countdown + venue + RSVP
  Details.tsx       Six info cards + vision line
  Faq.tsx           Accordion Q&A
  SiteFooter.tsx    Closing quote
  Reveal.tsx        IntersectionObserver reveal wrapper
content/
  site.ts           ALL site content and image paths
public/images/      Photo assets (replace freely)
tailwind.config.ts  Colors, fonts, and animation keyframes
```

## Notes

- Animations respect `prefers-reduced-motion`.
- The countdown target is `site.event.dateIso` in `content/site.ts`.
