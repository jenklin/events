import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'cloudpeers Events - Create Your Event',
  description: 'Create beautiful event pages with RSVP, QR codes, photo galleries, and more',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
