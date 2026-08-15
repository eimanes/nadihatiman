"use client"

import Link from "next/link"
import { UserButton, useUser } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { site } from "@/content/site"

/** Hrefs shown inline in the top bar; the rest live in the hamburger menu. */
const PRIMARY_HREFS = ["/", "/tentative", "/invitations", "/guestlist"]

/**
 * Floating pill navigation for the planner. Starts wide at the top of the
 * page and smoothly shrinks to a compact pill as you scroll down.
 *
 * The top bar shows a few primary links (Home, Schedule, Invitations); a
 * hamburger button opens a menu with the full navigation.
 */
export default function PlannerNav() {
  const { isSignedIn } = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close the menu on route change.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close the menu when clicking outside or pressing Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const primaryLinks = site.nav.links.filter((l) =>
    PRIMARY_HREFS.includes(l.href),
  )

  return (
    <div className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <nav
        className={`flex w-full items-center justify-between gap-3 rounded-full border border-line bg-white/85 py-2 pl-5 pr-3 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
          scrolled
            ? "max-w-[760px] shadow-[0_10px_34px_rgba(0,0,0,.1)]"
            : "max-w-[1040px] shadow-[0_1px_2px_rgba(0,0,0,.04)]"
        }`}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap"
          title={site.brand.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.brand.logo}
            alt={`Logo ${site.brand.name}`}
            className={`w-auto object-contain transition-all duration-500 ${
              scrolled ? "h-8" : "h-9"
            }`}
          />
          <span className="hidden font-serif text-[15px] italic text-ink sm:inline">
            {site.brand.name}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Primary links (hidden on the smallest screens to save space) */}
          <div className="hidden items-center gap-1 sm:flex">
            {primaryLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                  isActive(link.href)
                    ? "bg-sage text-white"
                    : "text-muted hover:bg-sage-soft hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Hamburger — opens the full navigation menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                menuOpen
                  ? "border-sage bg-sage text-white"
                  : "border-line bg-white text-ink hover:bg-sage-soft"
              }`}
            >
              <span className="relative flex h-3.5 w-4 flex-col justify-between">
                <span
                  className={`h-0.5 w-full rounded-full bg-current transition-transform duration-300 ${
                    menuOpen ? "translate-y-[6px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full rounded-full bg-current transition-opacity duration-300 ${
                    menuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full rounded-full bg-current transition-transform duration-300 ${
                    menuOpen ? "-translate-y-[6px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-56 overflow-hidden rounded-2xl border border-line bg-white/95 p-2 shadow-[0_18px_50px_rgba(0,0,0,.14)] backdrop-blur-md">
                {site.nav.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-xl px-4 py-2.5 text-[13px] transition-colors ${
                      isActive(link.href)
                        ? "bg-sage text-white"
                        : "text-ink hover:bg-sage-soft"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: { avatarBox: "h-8 w-8" },
              }}
            />
          ) : (
            <Link
              href="/sign-in"
              className="rounded-full border border-line bg-white px-3 py-1.5 text-[11px] text-ink transition-colors hover:bg-sage-soft"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}
