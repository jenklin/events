/** @type {import('next').NextConfig} */
// GALLERY_BASE_PATH lets one codebase produce two builds from CI:
//   - '' (default)        -> gallery.cloudpeers.com served at the clean root
//   - '/gallery'          -> events.cloudpeers.com/gallery/* via a creator-portal rewrite
// assetPrefix must match so /_next/* static assets resolve under the same prefix.
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const basePath = process.env.GALLERY_BASE_PATH || ''

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone build for Cloud Run
  basePath,
  assetPrefix: basePath || undefined,
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    // npm-workspace monorepo: trace from the repo root so the standalone build
    // nests under /gallery (mirrors creator-portal). Required by gallery/Dockerfile.
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.imagedelivery.net' }]
  }
}
export default nextConfig
