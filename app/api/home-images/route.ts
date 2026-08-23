import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary"
import { requireScoped } from "@/lib/permissions"

export const runtime = "nodejs"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024

export async function POST(req: Request) {
  // Home images are site-wide content — only unscoped / "general" editors.
  const editor = await requireScoped("edit_schedule", "home images")
  if (editor.ok && editor.viewer.eventScope && !editor.viewer.eventScope.includes("general")) {
    return NextResponse.json(
      { error: "Home images are site-wide; only full-access editors can change them." },
      { status: 403 },
    )
  }
  if (!editor.ok) return NextResponse.json({ error: editor.error }, { status: editor.status })
  if (!isCloudinaryConfigured()) return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 })

  const form = await req.formData()
  const localPath = form.get("localPath")
  if (typeof localPath === "string") {
    if (!/^\/images\/[\w.-]+$/.test(localPath)) return NextResponse.json({ error: "Invalid local media path." }, { status: 400 })
    const extension = path.extname(localPath).toLowerCase()
    const type = [".mp4", ".webm", ".mov"].includes(extension) ? "video" : "image"
    const buffer = await readFile(path.join(process.cwd(), "public", localPath))
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "nadihatiman/home", resource_type: type }, (error, upload) => error || !upload ? reject(error ?? new Error("Upload failed.")) : resolve(upload))
      stream.end(buffer)
    })
    return NextResponse.json({ media: { url: result.secure_url, publicId: result.public_id, type } })
  }
  const file = form.get("file")
  if (!(file instanceof File) || (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
    return NextResponse.json({ error: "Upload an image or video file." }, { status: 400 })
  }
  const type = file.type.startsWith("video/") ? "video" : "image"
  const limit = type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > limit) return NextResponse.json({ error: `${type === "video" ? "Video" : "Image"} is too large.` }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "nadihatiman/home", resource_type: type, ...(type === "image" ? { transformation: [{ quality: "auto", fetch_format: "auto" }] } : {}) },
      (error, upload) => error || !upload ? reject(error ?? new Error("Upload failed.")) : resolve(upload),
    )
    stream.end(bytes)
  })
  return NextResponse.json({ media: { url: result.secure_url, publicId: result.public_id, type } })
}

export async function DELETE(req: Request) {
  const editor = await requireScoped("edit_schedule", "home images")
  if (editor.ok && editor.viewer.eventScope && !editor.viewer.eventScope.includes("general")) {
    return NextResponse.json(
      { error: "Home images are site-wide; only full-access editors can change them." },
      { status: 403 },
    )
  }
  if (!editor.ok) return NextResponse.json({ error: editor.error }, { status: editor.status })
  if (!isCloudinaryConfigured()) return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 })
  const body = await req.json()
  if (typeof body.publicId !== "string" || !body.publicId.startsWith("nadihatiman/home/")) {
    return NextResponse.json({ error: "Invalid image reference." }, { status: 400 })
  }
  await cloudinary.uploader.destroy(body.publicId, { resource_type: body.type === "video" ? "video" : "image" })
  return NextResponse.json({ ok: true })
}
