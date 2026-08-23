import { notFound } from "next/navigation"
import { getViewerPermissions } from "@/lib/permissions"

export default async function EditHomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewerPermissions()
  // Home content is site-wide — scoped editors (without "general") can't edit it.
  const scoped = viewer.eventScope && !viewer.eventScope.includes("general")
  if (!viewer.permissions.includes("edit_schedule") || scoped) notFound()
  return children
}
