export type Language = "en" | "ms"

export type HomeCopy = {
  heroEyebrow: string
  heroSubtitle: string
  ticker: string
  storyLabel: string
  storyTitle: string
  storyChapters: { kicker: string; title: string; text: string }[]
}

export type ManagedMedia = {
  url: string
  publicId?: string
  type?: "image" | "video"
}

export type HomeImages = {
  hero: ManagedMedia
  story: ManagedMedia[]
  collage: ManagedMedia[]
}

export type HomeContent = Record<Language, HomeCopy> & { images: HomeImages }

export const defaultHomeContent: HomeContent = {
  en: {
    heroEyebrow: "September & October 2026 · Seremban, Negeri Sembilan",
    heroSubtitle: "are getting married",
    ticker: "you're invited to celebrate Nadia & Eiman's love story — two hearts, one beat",
    storyLabel: "Our Story",
    storyTitle: "our love story",
    storyChapters: [
      { kicker: "Chapter One", title: "the meeting", text: "It all started with a simple meeting — an introduction that slowly grew into friendship, and every conversation felt like coming home." },
      { kicker: "Chapter Two", title: "falling in love", text: "From close friends to life partners — late dinners, long drives, and a thousand little moments that made us certain: this is the one." },
      { kicker: "Chapter Three", title: "the next step", text: "One question, one simple answer — yes. Now we invite all our loved ones to celebrate the start of a new chapter: NADIhatIMAN." },
    ],
  },
  ms: {
    heroEyebrow: "September & Oktober 2026 · Seremban, Negeri Sembilan",
    heroSubtitle: "akan melangsungkan perkahwinan",
    ticker: "anda dijemput meraikan kisah cinta Nadia & Eiman — dua hati, satu nadi",
    storyLabel: "Kisah Kami",
    storyTitle: "kisah cinta kami",
    storyChapters: [
      { kicker: "Bab Satu", title: "pertemuan", text: "Semuanya bermula dengan pertemuan yang sederhana — perkenalan yang perlahan-lahan menjadi persahabatan, dan setiap perbualan terasa seperti pulang." },
      { kicker: "Bab Dua", title: "jatuh cinta", text: "Dari teman rapat kepada teman hidup — makan malam lewat, perjalanan jauh, dan seribu detik kecil yang membuatkan kami pasti: inilah orangnya." },
      { kicker: "Bab Tiga", title: "langkah seterusnya", text: "Satu soalan, satu jawapan yang mudah — ya. Kini kami menjemput semua yang tersayang untuk meraikan permulaan bab baharu: NADIhatIMAN." },
    ],
  },
  images: {
    hero: { url: "/images/hero.jpg", type: "image" },
    story: [
      { url: "/images/chapter-1.jpg", type: "image" },
      { url: "/images/chapter-2.jpg", type: "image" },
      { url: "/images/chapter-3.jpg", type: "image" },
    ],
    collage: [
      { url: "/images/gallery-1.jpg", type: "image" },
      { url: "/images/gallery-3.jpg", type: "image" },
      { url: "/images/gallery-4.jpg", type: "image" },
      { url: "/images/gallery-9.jpg", type: "image" },
    ],
  },
}

export const isHomeContent = (value: unknown): value is HomeContent => {
  if (!value || typeof value !== "object") return false
  const content = value as Partial<HomeContent>
  const hasCopies = ["en", "ms"].every((language) => {
    const copy = content[language as Language]
    return Boolean(copy && typeof copy.heroEyebrow === "string" && typeof copy.heroSubtitle === "string" && typeof copy.ticker === "string" && typeof copy.storyLabel === "string" && typeof copy.storyTitle === "string" && Array.isArray(copy.storyChapters))
  })
  const images = content.images
  return Boolean(hasCopies && images && typeof images.hero?.url === "string" && Array.isArray(images.story) && Array.isArray(images.collage))
}
