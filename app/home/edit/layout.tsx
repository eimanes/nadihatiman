import { notFound } from "next/navigation"
import { getViewerPermissions } from "@/lib/permissions"

export default async function EditHomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewerPermissions()
  if (!viewer.permissions.includes("edit_schedule")) notFound()
  return children
}
