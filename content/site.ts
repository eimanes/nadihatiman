/**
 * ─────────────────────────────────────────────────────────────
 *  NADIhatIMAN — SITE CONTENT
 *  Edit everything about the wedding planner here:
 *  events, tentative flows (swim lanes), invitations, guest list
 *  embeds, dress codes, nav links.
 * ─────────────────────────────────────────────────────────────
 */

export type LaneId = "groom" | "bride" | "family"

export type Lane = {
  id: LaneId
  label: string
  sublabel: string
}

export type FlowStep = {
  /** Display time, e.g. "8:00 AM" */
  time: string
  title: string
  detail?: string
  location?: string
  locationUrl?: string
  /** Which swim lanes this step belongs to */
  lanes: LaneId[]
}

export type DressCodeItem = {
  group: string
  theme: string
  /** Hex colors rendered as swatch chips */
  swatches: string[]
}

export type EventLocation = {
  label: string
  name: string
  url: string
}

export type WeddingEvent = {
  id: string
  emoji: string
  name: string
  tagline: string
  dateDisplay: string
  /** ISO date-time for countdowns. Use null when the date is still TBC. */
  dateIso: string | null
  timeDisplay: string
  locations: EventLocation[]
  dressCode: DressCodeItem[]
  /** Steps that happen before the day itself */
  preSteps: FlowStep[]
  /** The tentative flow of the day (rendered as a swim lane diagram) */
  flow: FlowStep[]
  notes: string[]
}

export type Chapter = {
  kicker: string
  title: string
  text: string
  image: string
  imageAlt: string
}

export type CollageItem = {
  image: string
  alt: string
}

export type Invitation = {
  id: string
  title: string
  subtitle: string
  url: string
}

export type Guestlist = {
  id: string
  title: string
  subtitle: string
  /** Canva read-only "view?embed" URL */
  embedUrl: string
  /** Canva view URL for opening in a new tab */
  openUrl: string
}

export const site = {
  brand: {
    name: "NADIhatIMAN",
    monogram: "N❤I",
    /** Official monogram logo (transparent PNG in /public/images) */
    logo: "/images/logo.png",
    tagline: "Nadia & Eiman's wedding planner",
  },

  couple: {
    bride: "Nadia",
    groom: "Eiman",
  },

  /**
   * Landing experience — envelope video → hero collage → love story.
   * Photos live in /public/images, video in /public/envelope.
   * Replace them with your own (keep the same filenames or update paths).
   */
  landing: {
    envelope: {
      videoSrc: "/envelope/willow-and-florals.mp4",
      cta: "Click to enter",
    },
    hero: {
      eyebrow: "September & October 2026 · Seremban, Negeri Sembilan",
      subtitle: "are getting married",
      scrollCue: "Scroll to explore",
      image: "/images/hero.jpg",
      imageAlt: "Nadia and Eiman walking together",
    },
    ticker: "you're invited to celebrate Nadia & Eiman's love story — two hearts, one beat",
    collage: {
      items: [
        { image: "/images/gallery-1.jpg", alt: "Where it all began" },
        { image: "/images/gallery-3.jpg", alt: "Memories together" },
        { image: "/images/gallery-4.jpg", alt: "Our favorite spot" },
        { image: "/images/gallery-9.jpg", alt: "Celebrating together" },
      ] as CollageItem[],
    },
    story: {
      label: "Our Story",
      title: "our love story",
      chapters: [
        {
          kicker: "Chapter One",
          title: "the meeting",
          text: "It all started with a simple meeting — an introduction that slowly grew into friendship, and every conversation felt like coming home.",
          image: "/images/chapter-1.jpg",
          imageAlt: "Nadia and Eiman's first meeting",
        },
        {
          kicker: "Chapter Two",
          title: "falling in love",
          text: "From close friends to life partners — late dinners, long drives, and a thousand little moments that made us certain: this is the one.",
          image: "/images/chapter-2.jpg",
          imageAlt: "Nadia and Eiman falling in love",
        },
        {
          kicker: "Chapter Three",
          title: "the next step",
          text: "One question, one simple answer — yes. Now we invite all our loved ones to celebrate the start of a new chapter: NADIhatIMAN.",
          image: "/images/chapter-3.jpg",
          imageAlt: "Nadia and Eiman's proposal",
        },
      ] as Chapter[],
    },
  },

  /**
   * Google Spreadsheet for the budget list (read-only).
   * Share the sheet as "Anyone with the link can view", then paste
   * its URL here or via the /admin page.
   */
  budgetSheetUrl: "",

  nav: {
    links: [
      { label: "Home", href: "/" },
      { label: "Schedule", href: "/tentative" },
      { label: "Invitations", href: "/invitations" },
      { label: "Guests", href: "/guestlist" },
      { label: "Preparation", href: "/preparation" },
      { label: "Checklist", href: "/checklist" },
      { label: "Budget", href: "/budget" },
    ],
  },

  lanes: [
    { id: "groom", label: "Eiman", sublabel: "Groom" },
    { id: "bride", label: "Nadia", sublabel: "Bride" },
    { id: "family", label: "Family & Guests", sublabel: "Both sides' entourage" },
  ] as Lane[],

  events: [
    {
      id: "nikah",
      emoji: "💍",
      name: "Nikah & Reception",
      tagline: "Nikah ceremony at the masjid, followed by a reception",
      dateDisplay: "Friday, 4 September 2026",
      dateIso: "2026-09-04T08:00:00+08:00",
      timeDisplay: "8:00 AM – 1:00 PM",
      locations: [
        {
          label: "Nikah Location",
          name: "Masjid",
          url: "https://maps.app.goo.gl/7rKAWYKRyyQFFb7x6?g_st=iw",
        },
        {
          label: "Reception Location",
          name: "Reception Venue",
          url: "https://maps.app.goo.gl/zkTFNkSWMrdm4aw59?g_st=iw",
        },
      ],
      dressCode: [
        {
          group: "Bride & Groom",
          theme: "White baju Melayu & white baju kurung",
          swatches: ["#FFFFFF"],
        },
        {
          group: "Female family",
          theme: "Purple",
          swatches: ["#7A4E9E"],
        },
        {
          group: "Male family",
          theme: "Peacock blue / navy blue",
          swatches: ["#1F6E8C", "#1E2A52"],
        },
      ],
      preSteps: [
        {
          time: "Night before",
          title: "Overnight stay at hotel, Seremban",
          detail:
            "Eiman stays overnight at the hotel with the groom assistant to prepare and make it easier to travel to the venue.",
          location: "Hotel, Seremban",
          lanes: ["groom"],
        },
      ],
      flow: [
        {
          time: "8:00 AM",
          title: "Gather at the masjid",
          detail: "Everyone gathers to prepare for the nikah.",
          location: "Masjid",
          locationUrl: "https://maps.app.goo.gl/7rKAWYKRyyQFFb7x6?g_st=iw",
          lanes: ["groom", "bride", "family"],
        },
        {
          time: "8:30 AM",
          title: "Nikah ceremony begins",
          detail: "Nikah of Eiman & Nadia.",
          location: "Masjid",
          locationUrl: "https://maps.app.goo.gl/7rKAWYKRyyQFFb7x6?g_st=iw",
          lanes: ["groom", "bride"],
        },
        {
          time: "8:30 AM",
          title: "Witnessing the nikah",
          location: "Masjid",
          locationUrl: "https://maps.app.goo.gl/7rKAWYKRyyQFFb7x6?g_st=iw",
          lanes: ["family"],
        },
        {
          time: "10:00 – 10:30 AM",
          title: "Nikah ceremony expected to finish",
          detail: "Short photo session & prayers.",
          location: "Masjid",
          locationUrl: "https://maps.app.goo.gl/7rKAWYKRyyQFFb7x6?g_st=iw",
          lanes: ["groom", "bride", "family"],
        },
        {
          time: "10:30 AM",
          title: "Head to the reception venue",
          location: "Reception Venue",
          locationUrl: "https://maps.app.goo.gl/zkTFNkSWMrdm4aw59?g_st=iw",
          lanes: ["groom", "bride", "family"],
        },
        {
          time: "11:00 AM",
          title: "Reception meal",
          detail: "Meal with family & guests.",
          location: "Reception Venue",
          locationUrl: "https://maps.app.goo.gl/zkTFNkSWMrdm4aw59?g_st=iw",
          lanes: ["groom", "bride", "family"],
        },
        {
          time: "1:00 PM",
          title: "Event concludes",
          location: "Reception Venue",
          locationUrl: "https://maps.app.goo.gl/zkTFNkSWMrdm4aw59?g_st=iw",
          lanes: ["groom", "bride", "family"],
        },
      ],
      notes: [
        "Eiman stays overnight at a hotel in Seremban with the groom assistant before the event day.",
      ],
    },
    {
      id: "sanding",
      emoji: "👑",
      name: "Sanding Ceremony",
      tagline: "Sanding ceremony & reception",
      dateDisplay: "Sunday, 6 September 2026",
      dateIso: "2026-09-06T11:00:00+08:00",
      timeDisplay: "11:00 AM – 4:00 PM",
      locations: [
        {
          label: "Location",
          name: "Venue",
          url: "https://maps.app.goo.gl/zkTFNkSWMrdm4aw59?g_st=iw",
        },
      ],
      dressCode: [
        {
          group: "Bride & Groom",
          theme: "White dress & brown suit",
          swatches: ["#FFFFFF", "#7A5C43"],
        },
        {
          group: "Female family",
          theme: "Teal blue & white",
          swatches: ["#2C8C99", "#FFFFFF"],
        },
        {
          group: "Male family",
          theme: "Light khaki / light brown / nude / light taupe",
          swatches: ["#C8B291", "#B49B7F", "#D9C4B0", "#B8A99A"],
        },
      ],
      preSteps: [],
      flow: [
        {
          time: "11:00 AM",
          title: "Event begins",
          detail: "Guests arrive & the reception begins.",
          location: "Venue",
          locationUrl: "https://maps.app.goo.gl/zkTFNkSWMrdm4aw59?g_st=iw",
          lanes: ["family"],
        },
        {
          time: "12:30 PM",
          title: "Groom's family arrives",
          detail: "Eiman's family entourage arrives.",
          location: "Venue",
          locationUrl: "https://maps.app.goo.gl/zkTFNkSWMrdm4aw59?g_st=iw",
          lanes: ["family"],
        },
        {
          time: "12:40 PM",
          title: "Bride & groom arrive",
          detail: "The couple enters for the sanding.",
          location: "Venue",
          locationUrl: "https://maps.app.goo.gl/zkTFNkSWMrdm4aw59?g_st=iw",
          lanes: ["groom", "bride"],
        },
        {
          time: "4:00 PM",
          title: "Event concludes",
          location: "Venue",
          locationUrl: "https://maps.app.goo.gl/zkTFNkSWMrdm4aw59?g_st=iw",
          lanes: ["groom", "bride", "family"],
        },
      ],
      notes: [],
    },
    {
      id: "tandang",
      emoji: "🏡",
      name: "Tandang (Walimatulurus)",
      tagline: "Groom's side welcoming celebration",
      dateDisplay: "Sunday, 4 October 2026",
      dateIso: "2026-10-04T11:00:00+08:00",
      timeDisplay: "11:00 AM – 4:00 PM",
      locations: [
        {
          label: "Location",
          name: "Tandang Venue",
          url: "https://share.google/qk9xHnYd4GWRnckxC",
        },
      ],
      dressCode: [
        {
          group: "Dress code",
          theme: "To be confirmed (TBC)",
          swatches: ["#E6E2DA"],
        },
      ],
      preSteps: [],
      flow: [
        {
          time: "11:00 AM",
          title: "Event begins",
          detail: "Guests arrive & the reception begins.",
          location: "Tandang Venue",
          locationUrl: "https://share.google/qk9xHnYd4GWRnckxC",
          lanes: ["family"],
        },
        {
          time: "12:30 PM",
          title: "Bride & groom enter",
          detail: "Arrival & sanding of the couple.",
          location: "Tandang Venue",
          locationUrl: "https://share.google/qk9xHnYd4GWRnckxC",
          lanes: ["groom", "bride"],
        },
        {
          time: "4:00 PM",
          title: "Event ends",
          location: "Tandang Venue",
          locationUrl: "https://share.google/qk9xHnYd4GWRnckxC",
          lanes: ["groom", "bride", "family"],
        },
      ],
      notes: [],
    },
  ] as WeddingEvent[],

  invitations: [
    {
      id: "sanding",
      title: "Digital Invitation — Sanding Ceremony",
      subtitle: "Sunday, 6 September 2026",
      url: "https://nadia-eiman.netlify.app/",
    },
    {
      id: "tandang",
      title: "Digital Invitation — Tandang (Walimatulurus)",
      subtitle: "Sunday, 4 October 2026",
      url: "https://walimatulurus-eiman-nadia.netlify.app/",
    },
  ] as Invitation[],

  guestlists: [
    {
      id: "sanding",
      title: "Guestlist — Sanding Ceremony",
      subtitle: "Data from Canva (view only, auto-refresh)",
      /** Canva "view" embed URL — read only */
      embedUrl:
        "https://www.canva.com/design/DAHP7efoZfc/PjgD0wFzlBW7-pcmwZhRUA/view?embed",
      openUrl:
        "https://www.canva.com/design/DAHP7efoZfc/PjgD0wFzlBW7-pcmwZhRUA/view",
    },
    {
      id: "tandang",
      title: "Guestlist — Tandang",
      subtitle: "Data from Canva (view only, auto-refresh)",
      embedUrl:
        "https://www.canva.com/design/DAHR_hM3mjI/hLbVVMuEFRFZVTi0bi2HnA/view?embed",
      openUrl:
        "https://www.canva.com/design/DAHR_hM3mjI/hLbVVMuEFRFZVTi0bi2HnA/view",
    },
  ] as Guestlist[],

  footer: {
    closing: "NADIhatIMAN — Nadia & Eiman, September 2026",
    quote: "two hearts, one beat.",
  },
}
