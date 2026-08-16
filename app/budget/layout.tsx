import { notFound } from "next/navigation"
import { getViewerPermissions } from "@/lib/permissions"

export default async function BudgetLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewerPermissions()
  if (!viewer.permissions.includes("view_budget")) notFound()
  return children
}