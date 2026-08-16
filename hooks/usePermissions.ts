"use client"

import { useEffect, useState } from "react"
import type { Permission, ViewerPermissions } from "@/lib/permission-types"

const empty: ViewerPermissions = {
  signedIn: false,
  email: null,
  isSuperadmin: false,
  permissions: [],
}

export function usePermissions() {
  const [viewer, setViewer] = useState<ViewerPermissions>(empty)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setViewer(data))
      .catch(() => setViewer(empty))
      .finally(() => setLoaded(true))
  }, [])

  const can = (permission: Permission) => viewer.permissions.includes(permission)
  return { ...viewer, can, loaded }
}
