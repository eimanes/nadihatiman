"use client"

import { useEffect, useState } from "react"
import EnterOverlay from "@/components/EnterOverlay"
import Hero from "@/components/Hero"
import Ticker from "@/components/Ticker"
import Story from "@/components/Story"
import Gallery from "@/components/Gallery"
import Join from "@/components/Join"
import Details from "@/components/Details"
import Faq from "@/components/Faq"
import SiteFooter from "@/components/SiteFooter"

export default function Home() {
  const [entered, setEntered] = useState(false)

  // Lock scrolling until the guest clicks through the entry overlay.
  useEffect(() => {
    document.body.style.overflow = entered ? "" : "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [entered])

  return (
    <>
      <EnterOverlay entered={entered} onEnter={() => setEntered(true)} />
      <Hero entered={entered} />
      <Ticker />
      <Story />
      <Gallery />
      <Join />
      <Details />
      <Faq />
      <SiteFooter />
    </>
  )
}
