import type { Metadata } from "next"
import "./globals.css"
import { site } from "@/content/site"

export const metadata: Metadata = {
  title: `${site.couple.partnerA} & ${site.couple.partnerB} — Wedding`,
  description: `Join us to celebrate the wedding of ${site.couple.partnerA} & ${site.couple.partnerB}.`,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="overflow-x-hidden bg-cream font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  )
}
