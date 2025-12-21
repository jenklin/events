import './globals.css'
import type { ReactNode } from 'react'
export const metadata = { title: 'CloudPeers Gallery', description: 'CloudPeers Events Photo Gallery - Share event photos with magic link access' }
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </body>
    </html>
  )
}
