import type { Metadata } from "next"
import Reveal from "@/components/Reveal"
import { site } from "@/content/site"
import { loadSettings } from "@/lib/settings"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Digital Invitations — ${site.brand.name}`,
}

export default async function InvitationsPage() {
  const { settings } = await loadSettings()

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-20 pt-24">
      <header className="py-10 text-center">
        <Reveal>
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">
            Invitations
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="font-serif text-4xl text-ink">Digital invitations</h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-relaxed text-muted">
            Preview the digital invitation cards for the sanding and tandang
            events — shown directly from the live sites.
          </p>
        </Reveal>
      </header>

      <div className="space-y-10">
        {settings.invitations.map((inv, i) => (
          <Reveal key={inv.id} delay={i * 0.08}>
            <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h2 className="font-serif text-xl text-ink">{inv.title}</h2>
                  <p className="text-[12px] text-muted">{inv.subtitle}</p>
                </div>
                <a
                  href={inv.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-sage px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-px"
                >
                  Open full ↗
                </a>
              </header>
              <div className="relative h-[82vh] min-h-[540px] bg-cream">
                <iframe
                  src={inv.url}
                  title={inv.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="autoplay; fullscreen"
                />
              </div>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
