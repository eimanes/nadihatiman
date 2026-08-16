"use client"

import { useHomeContent } from "@/components/HomeContentProvider"

export default function LanguageToggle() {
  const { language, setLanguage } = useHomeContent()
  return (
    <div className="fixed bottom-5 right-5 z-40 flex rounded-full border border-line bg-white/90 p-1 shadow-[0_8px_24px_rgba(0,0,0,.1)] backdrop-blur">
      {(["en", "ms"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLanguage(value)}
          className={`rounded-full px-3 py-1.5 text-[10px] font-medium uppercase transition-colors ${language === value ? "bg-sage text-white" : "text-muted hover:text-ink"}`}
        >
          {value === "en" ? "EN" : "BM"}
        </button>
      ))}
    </div>
  )
}
