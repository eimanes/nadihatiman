"use client"

import { useState } from "react"
import { useHomeContent } from "@/components/HomeContentProvider"
import { usePermissions } from "@/hooks/usePermissions"

export default function HomeContentEditor() {
  const { can } = usePermissions()
  const { content, setContent, language } = useHomeContent()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  if (!can("edit_schedule")) return null

  const copy = content[language]
  const update = (patch: Partial<typeof copy>) => setContent({ ...content, [language]: { ...copy, ...patch } })
  const updateChapter = (index: number, key: "kicker" | "title" | "text", value: string) => {
    const storyChapters = copy.storyChapters.map((chapter, chapterIndex) => chapterIndex === index ? { ...chapter, [key]: value } : chapter)
    update({ storyChapters })
  }

  const save = async () => {
    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/home-content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Could not save home content.")
      setMessage("Saved")
      setOpen(false)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save home content.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div id="edit-home" className="fixed bottom-5 left-5 z-40">
      {open && <div className="mb-3 max-h-[72vh] w-[min(92vw,560px)] overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,.16)]">
        <h2 className="font-serif text-xl text-ink">Edit home content ({language === "en" ? "English" : "Malay"})</h2>
        <div className="mt-4 space-y-3">
          <label className="block text-[11px] uppercase tracking-[0.12em] text-muted">Hero eyebrow<input value={copy.heroEyebrow} onChange={(e) => update({ heroEyebrow: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></label>
          <label className="block text-[11px] uppercase tracking-[0.12em] text-muted">Hero subtitle<input value={copy.heroSubtitle} onChange={(e) => update({ heroSubtitle: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></label>
          <label className="block text-[11px] uppercase tracking-[0.12em] text-muted">Ticker<textarea value={copy.ticker} onChange={(e) => update({ ticker: e.target.value })} className="mt-1 min-h-16 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] uppercase tracking-[0.12em] text-muted">Story label<input value={copy.storyLabel} onChange={(e) => update({ storyLabel: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></label><label className="text-[11px] uppercase tracking-[0.12em] text-muted">Story title<input value={copy.storyTitle} onChange={(e) => update({ storyTitle: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></label></div>
          {copy.storyChapters.map((chapter, index) => <div key={index} className="rounded-xl bg-cream p-3"><p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-muted">Story chapter {index + 1}</p><div className="grid gap-2 sm:grid-cols-2"><input value={chapter.kicker} onChange={(e) => updateChapter(index, "kicker", e.target.value)} placeholder="Kicker" className="rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /><input value={chapter.title} onChange={(e) => updateChapter(index, "title", e.target.value)} placeholder="Title" className="rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></div><textarea value={chapter.text} onChange={(e) => updateChapter(index, "text", e.target.value)} placeholder="Story text" className="mt-2 min-h-16 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></div>)}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2"><button onClick={() => setOpen(false)} className="rounded-full border border-line px-4 py-2 text-[11px] text-muted">Cancel</button><button onClick={save} disabled={saving} className="rounded-full bg-sage px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div>
      </div>}
      <button onClick={() => setOpen((value) => !value)} className="rounded-full bg-ink px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] text-white shadow-[0_8px_24px_rgba(0,0,0,.18)]">{message || (open ? "Close editor" : "Edit home")}</button>
    </div>
  )
}
