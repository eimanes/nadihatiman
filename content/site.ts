/**
 * ─────────────────────────────────────────────────────────────
 *  SITE CONTENT — edit everything about the website here.
 *
 *  To use your own photos:
 *  1. Drop your files into /public/images
 *  2. Either overwrite the existing files keeping the same
 *     filenames, or update the image paths below.
 * ─────────────────────────────────────────────────────────────
 */

export type Chapter = {
  kicker: string
  title: string
  text: string
  image: string
  imageAlt: string
}

export type GalleryItem = {
  caption: string
  image: string
}

export type DetailCard = {
  numeral: string
  title: string
  text: string
}

export type FaqItem = {
  question: string
  answers: string[]
}

export const site = {
  couple: {
    partnerA: "Jim",
    partnerB: "Pam",
    monogram: "J&P",
  },

  hero: {
    eyebrow: "June 18, 2027 · Vancouver, BC",
    subtitle: "are getting married",
    scrollCue: "Scroll to explore",
  },

  enterCta: "Click to enter",

  ticker: "you're cordially invited to celebrate the story of Jim & Pam",

  story: {
    label: "The Story So Far",
    title: "our story",
    chapters: [
      {
        kicker: "Chapter One",
        title: "how we met",
        text: "We met at university, became fast friends, and eventually realized the best parts of every week were the parts we spent together.",
        image: "/images/chapter-1.jpg",
        imageAlt: "Two students walking across a leafy campus quad",
      },
      {
        kicker: "Chapter Two",
        title: "falling in love",
        text: "Toronto became our home base for late dinners, weekend walks, shared routines, and all of the small moments that made life feel bigger.",
        image: "/images/chapter-2.jpg",
        imageAlt: "A couple walking through a city street at dusk",
      },
      {
        kicker: "Chapter Three",
        title: "the next step",
        text: "A trip, a question, a very easy yes, and suddenly the future we had been imagining became something we could invite everyone into.",
        image: "/images/chapter-3.jpg",
        imageAlt: "A proposal on a lakeside dock at golden hour",
      },
    ] as Chapter[],
  },

  gallery: {
    label: "Snapshots",
    title: "a few of our favorite moments",
    items: [
      { caption: "First year on campus", image: "/images/gallery-1.jpg" },
      { caption: "Coffee between classes", image: "/images/gallery-2.jpg" },
      { caption: "The start of everything", image: "/images/gallery-3.jpg" },
      { caption: "A favorite city corner", image: "/images/gallery-4.jpg" },
      { caption: "Weekends downtown", image: "/images/gallery-5.jpg" },
      { caption: "Our everyday ritual", image: "/images/gallery-6.jpg" },
      { caption: "The weekend away", image: "/images/gallery-7.jpg" },
      { caption: "Right after yes", image: "/images/gallery-8.jpg" },
      { caption: "Celebrating together", image: "/images/gallery-9.jpg" },
    ] as GalleryItem[],
  },

  event: {
    label: "so please join us...",
    dateDisplay: "june 18, 2027",
    /** ISO date-time used by the live countdown */
    dateIso: "2027-06-18T16:00:00-07:00",
    venueName: "Cecil Green Park House",
    venueAddress: "6251 Cecil Green Park Rd, Vancouver, BC",
    rsvpCta: "RSVP by august 20, 2027",
    rsvpHref: "#",
  },

  details: {
    label: "The Fine Print",
    title: "and now some additional details...",
    subtitle:
      "The people, places, and practical details that will make the weekend feel effortless.",
    cards: [
      { numeral: "i", title: "Wedding Parties", text: "Meet our favorite people." },
      { numeral: "ii", title: "Travel Logistics", text: "Plan your trip and stay." },
      { numeral: "iii", title: "Registry", text: "Your presence is enough, but if you insist..." },
      { numeral: "iv", title: "Dress Code", text: "Summer garden party vibes." },
      { numeral: "v", title: "Dinner Menu", text: "A quick look at what we are serving." },
      { numeral: "vi", title: "Music", text: "Cocktail hour and dance party playlists." },
    ] as DetailCard[],
    vision:
      "The vision for the night is simple: all of our most beloved people in one place that happens to have a gorgeous garden, flowing drinks, and an unforgettable dance floor.",
  },

  faq: {
    label: "Good To Know",
    title: "Questions and answers",
    contactLead: "Can't find the answer here?",
    contactCta: "Reach out to Jim or Pam",
    contactHref: "mailto:your-email@example.com",
    items: [
      {
        question: "When should I RSVP by?",
        answers: ["Please RSVP by August 20, 2027."],
      },
      {
        question: "Is there a dress code?",
        answers: [
          "Yes! Think Summer Garden Party.",
          "For the ladies: tea or floor length dresses. We welcome bright colours and florals.",
          "For the gentlemen: dress shirts and suits. We welcome linen and light colours.",
          "Wear comfy shoes for wandering (and dancing!) and anything else that makes you feel fabulous and ready to party!",
        ],
      },
      {
        question: "Is the wedding outdoors?",
        answers: [
          "Yes! The ceremony will take place in the garden and the reception will take place on the terrace.",
        ],
      },
      {
        question: "What will the weather be like? What happens if it rains?",
        answers: [
          "Expect a warm afternoon and a cooler evening. We recommend bringing a light layer just in case.",
          "If the weather shifts, the venue has an indoor backup plan ready to go.",
        ],
      },
      {
        question: "Can I bring a plus one or my kids?",
        answers: [
          "We are keeping the guest list intimate, so plus-ones and children may be limited depending on your invitation.",
          "Please reach out if you have any questions about your household.",
        ],
      },
      {
        question: "What time should I arrive at the ceremony?",
        answers: [
          "Please plan to arrive about 15 minutes before the ceremony begins so everyone has time to get settled.",
        ],
      },
      {
        question: "I have a food allergy, can I make a special request?",
        answers: [
          "Yes! Please make note of any food allergies or restrictions when submitting your RSVP and we will do our best to accommodate.",
        ],
      },
      {
        question: "Is there parking at the venue?",
        answers: [
          "Use this answer to share parking, drop-off, shuttle, or rideshare instructions for your venue.",
        ],
      },
      {
        question: "Help! I have other questions!",
        answers: [
          "Please reach out at your-email@example.com with any other questions.",
        ],
      },
    ] as FaqItem[],
  },

  footer: {
    closing: "We cannot wait to celebrate with you",
    quote:
      "you're my favorite person to do anything with for the rest of my life.",
  },
}
