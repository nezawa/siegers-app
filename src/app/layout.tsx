import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
})

export const metadata: Metadata = {
  title: '小雀シーガーズ',
  description: '草野球チーム 小雀シーガーズの公式サイト',
  // iOS でホーム画面に追加したときの表示名・ステータスバー
  appleWebApp: {
    capable: true,
    title: '小雀シーガーズ',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#6c9dc6', // --color-band（Android のアドレスバー色）
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${GeistSans.variable} ${notoSansJP.variable} h-full`}>
      <body className="min-h-full flex flex-col overflow-x-clip bg-slate-100 text-gray-900 antialiased">
        <Navbar />
        <div className="flex flex-1 flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}
