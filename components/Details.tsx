import Reveal from "@/components/Reveal"
import { site } from "@/content/site"

/** Six hover-lift info cards plus the closing vision line. */
export default function Details() {
  return (
    <section id="details" className="px-6 py-24 max-md:px-5 max-md:py-16">
      <div className="mx-auto max-w-[1080px]">
        <Reveal>
          <p className="mb-3.5 text-xs uppercase tracking-[0.3em] text-gold">
            {site.details.label}
          </p>
          <h2 className="mb-3 font-serif text-[clamp(34px,5vw,52px)] leading-tight">
            {site.details.title}
          </h2>
          <p className="max-w-[560px] text-muted">{site.details.subtitle}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-3 gap-6 max-md:grid-cols-1 max-md:gap-4">
          {site.details.cards.map((card, idx) => (
            <Reveal key={card.title} delay={idx * 0.08}>
              <div className="h-full rounded-xl border border-line bg-paper p-7 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-[5px] hover:border-[#D8D3C8] hover:shadow-[0_1px_2px_rgba(0,0,0,.05),0_10px_28px_rgba(0,0,0,.07)]">
                <div className="mb-4.5 flex h-11 w-11 items-center justify-center rounded-full bg-sage-soft font-serif text-lg italic text-sage" style={{ marginBottom: "18px" }}>
                  {card.numeral}
                </div>
                <h3 className="mb-2 font-serif text-[21px]">{card.title}</h3>
                <p className="text-[15px] text-muted">{card.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-[72px] text-center">
          <p className="mx-auto max-w-[680px] font-serif text-[clamp(19px,2.6vw,24px)] italic leading-[1.7]">
            {site.details.vision}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
