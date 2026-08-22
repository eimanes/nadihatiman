import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import SmoothScroll from "@/components/SmoothScroll"
import PlannerNav from "@/components/PlannerNav"
import { site } from "@/content/site"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://nadihatiman.vercel.app"),
  title: `${site.brand.name} — Wedding Planner`,
  description: `${site.brand.name}: ${site.couple.bride} & ${site.couple.groom}'s wedding planner — event schedule, digital invitations, guest list, checklist and budget.`,
  openGraph: {
    title: `${site.brand.name} — Wedding Planner`,
    description: `${site.couple.bride} & ${site.couple.groom}'s wedding planner`,
    images: ['/N_E-preview.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.brand.name} — Wedding Planner`,
    description: `${site.couple.bride} & ${site.couple.groom}'s wedding planner`,
    images: ['/N_E-preview.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="overflow-x-hidden bg-cream font-sans text-ink antialiased">
          <SmoothScroll />
          <PlannerNav />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-line bg-white px-6 py-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={site.brand.logo}
              alt={`Logo ${site.brand.name}`}
              className="mx-auto mb-4 h-14 w-14 object-contain"
            />
            <p className="font-serif text-lg italic text-sage">
              “{site.footer.quote}”
            </p>
            <p className="mt-2 text-[12px] uppercase tracking-[0.2em] text-muted">
              {site.footer.closing}
            </p>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
