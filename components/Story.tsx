import Image from "next/image"
import Reveal from "@/components/Reveal"
import { site } from "@/content/site"

/** Alternating chapter layout with scroll-reveal animations. */
export default function Story() {
  return (
    <section id="story" className="px-6 py-24 max-md:px-5 max-md:py-16">
      <div className="mx-auto max-w-[1080px]">
        <Reveal>
          <p className="mb-3.5 text-xs uppercase tracking-[0.3em] text-gold">
            {site.story.label}
          </p>
          <h2 className="font-serif text-[clamp(34px,5vw,52px)] leading-tight">
            {site.story.title}
          </h2>
        </Reveal>

        {site.story.chapters.map((chapter, idx) => (
          <div
            key={chapter.title}
            className="mt-[88px] grid grid-cols-2 items-center gap-14 max-md:mt-16 max-md:grid-cols-1 max-md:gap-7"
          >
            <Reveal className={idx % 2 === 1 ? "md:order-2" : ""}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-sage-soft">
                <Image
                  src={chapter.image}
                  alt={chapter.imageAlt}
                  fill
                  sizes="(max-width: 820px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mb-3 text-xs uppercase tracking-[0.28em] text-gold">
                {chapter.kicker}
              </p>
              <h3 className="mb-4 font-serif text-[clamp(26px,3.4vw,36px)]">
                {chapter.title}
              </h3>
              <p className="max-w-[46ch] text-muted">{chapter.text}</p>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  )
}
