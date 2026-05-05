import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'Academy OS',
  description: 'Voice-driven tennis academy operating system',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#030506',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-base min-h-screen">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
