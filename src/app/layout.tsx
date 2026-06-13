import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
})

export const metadata: Metadata = {
  title: 'Siegers',
  description: '草野球チーム Siegers の公式サイト',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${GeistSans.variable} ${notoSansJP.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-100 text-gray-900 antialiased">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>
        <footer className="mt-12 bg-blue-950 text-blue-200">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 text-sm">⚾</span>
              <div className="leading-tight">
                <p className="font-extrabold italic tracking-wider text-white">SIEGERS</p>
                <p className="text-[10px] tracking-widest text-blue-300">BASEBALL TEAM</p>
              </div>
            </div>
            <p className="text-xs text-blue-300/80">&copy; Siegers — 草野球チーム シーガーズ</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
