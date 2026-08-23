"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import type { Permission, ViewerPermissions } from "@/lib/permission-types"

const empty: ViewerPermissions = {
  signedIn: false,
  email: null,
  isSuperadmin: false,
  permissions: [],
  eventScope: null,
}

export function usePermissions() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [viewer, setViewer] = useState<ViewerPermissions>(empty)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    setLoaded(false)
    fetch("/api/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setViewer(data))
      .catch(() => setViewer(empty))
      .finally(() => setLoaded(true))
  }, [isLoaded, isSignedIn, user?.id])

  const can = (permission: Permission) => viewer.permissions.includes(permission)
  return { ...viewer, can, loaded }
}
