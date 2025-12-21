import { redirect } from 'next/navigation'

export default function Home() {
  // For Cloudflare Worker proxy, use absolute URL to ensure correct path
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seoul.redheli.com/gallery'
  redirect(`${appUrl}/login`)
}
