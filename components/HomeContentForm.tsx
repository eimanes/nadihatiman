"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { HomeContentProvider, useHomeContent } from "@/components/HomeContentProvider"
import type { ManagedMedia } from "@/lib/home-content"
import LanguageToggle from "@/components/LanguageToggle"

type HomeContentFormProps = { returnHref?: string }

export default function HomeContentForm({ returnHref = "/home" }: HomeContentFormProps) {
  return <HomeContentProvider><Editor returnHref={returnHref} /></HomeContentProvider>
}

function Editor({ returnHref }: { returnHref: string }) {
  const { content, setContent, language } = useHomeContent()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState("")
  const [message, setMessage] = useState("")
  const copy = content[language]
  const update = (patch: Partial<typeof copy>) => setContent({ ...content, [language]: { ...copy, ...patch } })
  const updateChapter = (index: number, key: "kicker" | "title" | "text", value: string) => {
    update({ storyChapters: copy.storyChapters.map((chapter, chapterIndex) => chapterIndex === index ? { ...chapter, [key]: value } : chapter) })
  }
  const setImage = (group: "hero" | "story" | "collage", index: number, image: ManagedMedia) => {
    if (group === "hero") {
      setContent({ ...content, images: { ...content.images, hero: image } })
      return
    }
    const values = [...content.images[group]]
    values[index] = image
    setContent({ ...content, images: { ...content.images, [group]: values } })
  }
  const upload = async (file: File, group: "hero" | "story" | "collage", index = 0) => {
    const key = `${group}-${index}`
    setUploading(key)
    setMessage("")
    try {
      const form = new FormData()
      form.append("file", file)
      const response = await fetch("/api/home-images", { method: "POST", body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Could not upload image.")
      const old = group === "hero" ? content.images.hero : content.images[group][index]
      if (old?.publicId) fetch("/api/home-images", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: old.publicId }) }).catch(() => {})
      setImage(group, index, data.media)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not upload image.")
    } finally {
      setUploading("")
    }
  }
  const removeImage = async (group: "hero" | "story" | "collage", index = 0) => {
    const image = group === "hero" ? content.images.hero : content.images[group][index]
    if (!image?.publicId) {
      setMessage("This is a bundled image. Replace it with an uploaded image before deletion.")
      return
    }
    try {
      const response = await fetch("/api/home-images", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: image.publicId }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Could not delete image.")
      if (group === "hero") setImage(group, index, { url: "", type: "image" })
      else {
        const values = content.images[group].filter((_, mediaIndex) => mediaIndex !== index)
        setContent({ ...content, images: { ...content.images, [group]: values } })
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not delete image.")
    }
  }
  const addMedia = (group: "story" | "collage") => setContent({ ...content, images: { ...content.images, [group]: [...content.images[group], { url: "", type: "image" }] } })
  const moveMedia = (group: "story" | "collage", index: number, direction: -1 | 1) => {
    const values = [...content.images[group]]
    const target = index + direction
    if (target < 0 || target >= values.length) return
    ;[values[index], values[target]] = [values[target], values[index]]
    setContent({ ...content, images: { ...content.images, [group]: values } })
  }
  const migrateLocalMedia = async () => {
    const groups: { group: "hero" | "story" | "collage"; index: number; path: string }[] = [
      { group: "hero", index: 0, path: "/images/hero.jpg" },
      ...content.images.story.map((media, index) => ({ group: "story" as const, index, path: media.url })).filter((item) => item.path.startsWith("/images/")),
      ...content.images.collage.map((media, index) => ({ group: "collage" as const, index, path: media.url })).filter((item) => item.path.startsWith("/images/")),
    ]
    setUploading("migrate")
    try {
      const migrated = new Map<string, ManagedMedia>()
      for (const item of groups) {
        const form = new FormData(); form.append("localPath", item.path)
        const response = await fetch("/api/home-images", { method: "POST", body: form })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? "Could not migrate media.")
        migrated.set(`${item.group}-${item.index}`, data.media)
      }
      setContent({
        ...content,
        images: {
          hero: migrated.get("hero-0") ?? content.images.hero,
          story: content.images.story.map((media, index) => migrated.get(`story-${index}`) ?? media),
          collage: content.images.collage.map((media, index) => migrated.get(`collage-${index}`) ?? media),
        },
      })
      setMessage("Local images uploaded to Cloudinary. Save home content to publish them.")
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not migrate media.") } finally { setUploading("") }
  }
  const save = async () => {
    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/home-content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Could not save home content.")
      setMessage("Home content saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save home content.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-[900px] px-5 pb-24 pt-24">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Home</p>
          <h1 className="mt-2 font-serif text-4xl text-ink">Edit home content</h1>
          <p className="mt-3 max-w-[580px] text-[14px] leading-relaxed text-muted">Edit the selected language. Save when you are ready; visitors will see the updated hero, ticker, and love story.</p>
        </div>
        <Link href={returnHref} className="rounded-full border border-line bg-white px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink">← Back to home</Link>
      </header>

      {message && <p className={`mb-5 rounded-xl px-4 py-3 text-[13px] ${message === "Home content saved." ? "bg-sage-soft text-sage" : "bg-[#FBEFEE] text-[#A0524B]"}`}>{message}</p>}
      <section className="space-y-5 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-serif text-xl text-ink">{language === "en" ? "English" : "Malay"} content</h2>
        <div className="rounded-xl border border-gold/50 bg-[#FBF6EC] p-4"><p className="text-[13px] text-ink">Move the current bundled images to Cloudinary once, then save this page. After that, Home uses Cloudinary URLs only.</p><button type="button" onClick={migrateLocalMedia} disabled={uploading === "migrate"} className="mt-3 rounded-full bg-ink px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-white disabled:opacity-50">{uploading === "migrate" ? "Migrating…" : "Upload current images to Cloudinary"}</button></div>
        <MediaControl label="Hero media" media={content.images.hero} uploading={uploading === "hero-0"} onUpload={(file) => upload(file, "hero")} onDelete={() => removeImage("hero")} />
        <label className="block text-[11px] uppercase tracking-[0.12em] text-muted">Hero eyebrow<input value={copy.heroEyebrow} onChange={(e) => update({ heroEyebrow: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></label>
        <label className="block text-[11px] uppercase tracking-[0.12em] text-muted">Hero subtitle<input value={copy.heroSubtitle} onChange={(e) => update({ heroSubtitle: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></label>
        <label className="block text-[11px] uppercase tracking-[0.12em] text-muted">Ticker<textarea value={copy.ticker} onChange={(e) => update({ ticker: e.target.value })} className="mt-1 min-h-20 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] uppercase tracking-[0.12em] text-muted">Story label<input value={copy.storyLabel} onChange={(e) => update({ storyLabel: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></label><label className="text-[11px] uppercase tracking-[0.12em] text-muted">Story title<input value={copy.storyTitle} onChange={(e) => update({ storyTitle: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink" /></label></div>
        {copy.storyChapters.map((chapter, index) => <section key={index} className="rounded-xl bg-cream p-4"><p className="mb-3 text-[10px] uppercase tracking-[0.12em] text-muted">Story chapter {index + 1}</p><MediaControl label={`Story media ${index + 1}`} media={content.images.story[index]} uploading={uploading === `story-${index}`} onUpload={(file) => upload(file, "story", index)} onDelete={() => removeImage("story", index)} /><div className="mt-4 grid gap-3 sm:grid-cols-2"><input value={chapter.kicker} onChange={(e) => updateChapter(index, "kicker", e.target.value)} placeholder="Kicker" className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink" /><input value={chapter.title} onChange={(e) => updateChapter(index, "title", e.target.value)} placeholder="Title" className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink" /></div><textarea value={chapter.text} onChange={(e) => updateChapter(index, "text", e.target.value)} placeholder="Story text" className="mt-3 min-h-24 w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink" /></section>)}
        <div className="flex items-center justify-between"><h3 className="font-serif text-lg text-ink">Collage media</h3><button type="button" onClick={() => addMedia("collage")} className="rounded-full bg-sage px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white">+ Add media</button></div>
        <div className="grid gap-4 sm:grid-cols-2">{content.images.collage.map((media, index) => <MediaControl key={`${media.url}-${index}`} label={`Collage media ${index + 1}`} media={media} uploading={uploading === `collage-${index}`} onUpload={(file) => upload(file, "collage", index)} onDelete={() => removeImage("collage", index)} onMoveUp={() => moveMedia("collage", index, -1)} onMoveDown={() => moveMedia("collage", index, 1)} />)}</div>
        <div className="sticky bottom-4 flex justify-end"><button onClick={save} disabled={saving} className="rounded-full bg-sage px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-white shadow-[0_8px_24px_rgba(0,0,0,.12)] disabled:opacity-50">{saving ? "Saving…" : "Save home content"}</button></div>
      </section>
      <LanguageToggle />
    </main>
  )
}

function MediaControl({ label, media, uploading, onUpload, onDelete, onMoveUp, onMoveDown }: { label: string; media?: ManagedMedia; uploading: boolean; onUpload: (file: File) => void; onDelete: () => void; onMoveUp?: () => void; onMoveDown?: () => void }) {
  return <section className="rounded-xl border border-line bg-cream p-3"><p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-muted">{label}</p><div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white">{media?.url ? media.type === "video" ? <video src={media.url} controls className="h-full w-full object-cover" /> : <Image src={media.url} alt={label} fill sizes="(max-width: 640px) 90vw, 360px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-[12px] text-muted">No media</span>}</div><div className="mt-3 flex flex-wrap gap-2"><label className="cursor-pointer rounded-full bg-sage px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white">{uploading ? "Uploading…" : media?.url ? "Replace" : "Upload"}<input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); e.target.value = "" }} /></label>{media?.publicId && <button type="button" onClick={onDelete} className="rounded-full border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-red-700">Delete</button>}{onMoveUp && <button type="button" onClick={onMoveUp} className="rounded-full border border-line px-3 py-1.5 text-[10px] text-muted">↑</button>}{onMoveDown && <button type="button" onClick={onMoveDown} className="rounded-full border border-line px-3 py-1.5 text-[10px] text-muted">↓</button>}</div></section>
}
