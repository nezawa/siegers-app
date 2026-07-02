import Link from 'next/link'
import { existsSync } from 'fs'
import { join } from 'path'
import { createClient } from '@/lib/supabase/server'
import NavClient from './NavClient'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // public/logo.png を置くと ⚾ の代わりにロゴ画像が表示される
  const hasLogo = existsSync(join(process.cwd(), 'public', 'logo.png'))

  return (
    <nav className="sticky top-0 z-50 bg-band text-white shadow-lg shadow-blue-950/20">
      {/* ロゴは左端、ナビは中央、管理系・ハンバーガーは右端に絶対配置 */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center">
        <Link href="/" className="group flex items-center">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo.png" alt="小雀シーガーズ" className="h-10 w-auto" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 text-lg transition-colors group-hover:bg-white/20">
              ⚾
            </span>
          )}
        </Link>
        <NavClient isLoggedIn={!!user} />
      </div>
      <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
    </nav>
  )
}
