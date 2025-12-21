/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone build for Cloud Run
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.imagedelivery.net' }]
  }
}
export default nextConfig
