"use client"

import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"

export default function ScheduleEditLink() {
  const { can } = usePermissions()
  if (!can("edit_schedule")) return null

  return (
    <Link
      href="/admin"
      className="mt-5 inline-block rounded-full bg-sage px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-px"
    >
      ✏️ Edit schedule
    </Link>
  )
}