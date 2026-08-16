import { notFound } from "next/navigation"
import { getViewerPermissions } from "@/lib/permissions"

export default async function AccountsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewerPermissions()
  if (!viewer.isSuperadmin) notFound()
  return children
}