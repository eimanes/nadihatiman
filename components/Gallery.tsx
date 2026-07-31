import Image from "next/image"
import Reveal from "@/components/Reveal"
import { site } from "@/content/site"

const TILTS = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 2.5, -0.5]

/** Infinite polaroid marquee. Pauses on hover; cards straighten on hover. */
export default function Gallery() {
  const items = [...site.gallery.items, ...site.gallery.items]

  return (
    <section className="group overflow-hidden border-y border-line bg-paper py-24">
      <Reveal className="mb-14 px-6 text-center">
        <p className="mb-3.5 text-xs uppercase tracking-[0.3em] text-gold">
          {site.gallery.label}
        </p>
        <h2 className="font-serif text-[clamp(34px,5vw,52px)] leading-tight">
          {site.gallery.title}
        </h2>
      </Reveal>

      <div
        aria-label="Photo gallery"
        className="flex w-max animate-marquee gap-7 py-3 group-hover:[animation-play-state:paused]"
      >
        {items.map((item, i) => (
          <figure
            key={`${item.caption}-${i}`}
            style={{ rotate: `${TILTS[i % TILTS.length]}deg` }}
            className="w-[220px] shrink-0 rounded-md border border-line bg-white p-3 pb-4 shadow-[0_1px_2px_rgba(0,0,0,.05),0_6px_16px_rgba(0,0,0,.05)] transition-[rotate,transform] duration-300 hover:-translate-y-1.5 hover:rotate-0"
          >
            <div className="relative mb-3 aspect-square overflow-hidden rounded bg-sage-soft">
              <Image
                src={item.image}
                alt={item.caption}
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>
            <figcaption className="text-center font-serif text-sm italic text-muted">
              {item.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
