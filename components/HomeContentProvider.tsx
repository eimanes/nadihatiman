"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { defaultHomeContent, type HomeContent, type Language } from "@/lib/home-content"

type HomeContentState = {
  language: Language
  setLanguage: (language: Language) => void
  content: HomeContent
  setContent: (content: HomeContent) => void
  loaded: boolean
}

const HomeContentContext = createContext<HomeContentState | null>(null)

export function HomeContentProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")
  const [content, setContent] = useState<HomeContent>(defaultHomeContent)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/home-content", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (data?.content) setContent(data.content)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return <HomeContentContext.Provider value={{ language, setLanguage, content, setContent, loaded }}>{children}</HomeContentContext.Provider>
}

export function useHomeContent() {
  const context = useContext(HomeContentContext)
  if (!context) throw new Error("useHomeContent must be used inside HomeContentProvider")
  return context
}
