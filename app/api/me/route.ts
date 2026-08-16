import { NextResponse } from "next/server"
import { getViewerPermissions } from "@/lib/permissions"

export async function GET() {
  return NextResponse.json(await getViewerPermissions())
}