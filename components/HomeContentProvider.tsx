"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { defaultHomeContent, type HomeContent, type Language } from "@/lib/home-content"
import { readCachedHomeContent, writeCachedHomeContent } from "@/lib/media-cache"

type HomeContentState = {
  language: Language
  setLanguage: (language: Language) => void
  content: HomeContent
  setContent: (content: HomeContent) => void
  /** true once the API response has arrived (paint is never blocked on it) */
  loaded: boolean
  /** true when the visible content came from the local cache */
  fromCache: boolean
}

const HomeContentContext = createContext<HomeContentState | null>(null)

export function HomeContentProvider({ children }: { children: React.ReactNode }) {
  // Seed from the previous visit's cache (defaults on a cold first visit).
  const [content, setContent] = useState<HomeContent>(() => readCachedHomeContent() ?? defaultHomeContent)
  const [fromCache, setFromCache] = useState(() => readCachedHomeContent() !== null)
  const [language, setLanguage] = useState<Language>("en")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/home-content", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled || !data?.content) return
        setContent(data.content)
        writeCachedHomeContent(data.content) // refresh the cache for next time
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <HomeContentContext.Provider value={{ language, setLanguage, content, setContent, loaded, fromCache }}>
      {children}
    </HomeContentContext.Provider>
  )
}

export function useHomeContent() {
  const context = useContext(HomeContentContext)
  if (!context) throw new Error("useHomeContent must be used inside HomeContentProvider")
  return context
}
