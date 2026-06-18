/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Required for monorepo/workspace setups
    outputFileTracingRoot: require('path').join(__dirname, '../'),
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Proxy events.cloudpeers.com/gallery/* to the gallery Cloud Run service.
  // GALLERY_ORIGIN = the events-flavored gallery service URL (built with
  // GALLERY_BASE_PATH='/gallery'). We pass the /gallery prefix THROUGH because
  // that build expects to be served under /gallery (basePath + assetPrefix),
  // so /_next assets resolve correctly behind the proxy.
  // e.g. GALLERY_ORIGIN=https://gallery-events-xxxxx-uc.a.run.app
  async rewrites() {
    const galleryOrigin = process.env.GALLERY_ORIGIN
    if (!galleryOrigin) return []
    return [
      { source: '/gallery', destination: `${galleryOrigin}/gallery` },
      { source: '/gallery/:path*', destination: `${galleryOrigin}/gallery/:path*` },
    ]
  },
};

module.exports = nextConfig;
