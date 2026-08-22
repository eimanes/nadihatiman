/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    // Optimized images are content-hashed by URL (w/q params) — safe to
    // cache hard in the browser so repeat visits skip Cloudinary entirely.
    minimumCacheTTL: 2592000,
  },
  async headers() {
    return [
      {
        // Bundled static media (hero/collage/story fallbacks, envelope
        // video, logo). Filenames never change in place — cache hard.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/envelope/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cloudinary itself already serves media with long cache headers, so
      // warmed videos/images are reused across visits without extra config.
    ]
  },
}

export default nextConfig

