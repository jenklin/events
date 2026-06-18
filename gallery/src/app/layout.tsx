import './globals.css'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-inter', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-playfair', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-jetbrains', display: 'swap' })

export const metadata: Metadata = {
  title: 'cloudpeers Gallery',
  description: 'cloudpeers Events Photo Gallery - Share event photos with magic link access',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans bg-paradigm-deep-black text-paradigm-text antialiased">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </body>
    </html>
  )
}
