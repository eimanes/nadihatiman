"use client"

import { useState } from "react"
import Reveal from "@/components/Reveal"
import { site } from "@/content/site"

/** Accordion Q&A with smooth expand/collapse and rotating plus icons. */
export default function Faq() {
  const [open, setOpen] = useState<Set<number>>(new Set())

  const toggle = (idx: number) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <section className="border-t border-line bg-paper px-6 py-24 max-md:px-5 max-md:py-16">
      <div className="mx-auto max-w-[1080px]">
        <Reveal>
          <div className="mb-12 grid grid-cols-[1fr_auto] items-end gap-6 max-md:grid-cols-1">
            <div>
              <p className="mb-3.5 text-xs uppercase tracking-[0.3em] text-gold">
                {site.faq.label}
              </p>
              <h2 className="font-serif text-[clamp(34px,5vw,52px)] leading-tight">
                {site.faq.title}
              </h2>
            </div>
            <p className="text-right text-sm text-muted max-md:text-left">
              {site.faq.contactLead}
              <br />
              <a
                href={site.faq.contactHref}
                className="text-sage underline underline-offset-[3px]"
              >
                {site.faq.contactCta}
              </a>
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div>
            {site.faq.items.map((item, idx) => {
              const isOpen = open.has(idx)
              return (
                <div key={item.question} className="border-b border-line">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${idx}`}
                    onClick={() => toggle(idx)}
                    className="flex min-h-[44px] w-full items-center justify-between gap-6 px-1 py-[22px] text-left font-serif text-[19px] text-ink focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
                  >
                    <span>{item.question}</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={`h-6 w-6 shrink-0 text-gold transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <div
                    id={`faq-panel-${idx}`}
                    className={`grid transition-[grid-template-rows] duration-500 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="max-w-[68ch] space-y-2.5 px-1 pb-[26px] text-muted">
                        {item.answers.map((answer) => (
                          <p key={answer}>{answer}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
