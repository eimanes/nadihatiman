import Reveal from "@/components/Reveal"
import { site } from "@/content/site"

/** Closing quote and monogram. */
export default function SiteFooter() {
  return (
    <footer className="px-6 pb-20 pt-[120px] text-center">
      <Reveal>
        <p className="mb-7 text-xs uppercase tracking-[0.3em] text-muted">
          {site.footer.closing}
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <blockquote className="mx-auto mb-12 max-w-[820px] font-serif text-[clamp(26px,4.4vw,44px)] italic leading-[1.35]">
          &ldquo;{site.footer.quote}&rdquo;
        </blockquote>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-full border border-line font-serif text-xl italic text-gold">
          {site.couple.monogram}
        </div>
      </Reveal>
    </footer>
  )
}
