import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Song Books',
  description: 'Create and share songbooks with lyrics and guitar chords',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

