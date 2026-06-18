/** @type {import('next').NextConfig} */
// GALLERY_BASE_PATH lets one codebase produce two builds from CI:
//   - '' (default)        -> gallery.cloudpeers.com served at the clean root
//   - '/gallery'          -> events.cloudpeers.com/gallery/* via a creator-portal rewrite
// assetPrefix must match so /_next/* static assets resolve under the same prefix.
const basePath = process.env.GALLERY_BASE_PATH || ''

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone build for Cloud Run
  basePath,
  assetPrefix: basePath || undefined,
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.imagedelivery.net' }]
  }
}
export default nextConfig
