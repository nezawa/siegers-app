import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import NavClient from './NavClient'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 bg-band text-white shadow-lg shadow-blue-950/20">
      {/* ロゴは左端、ナビは中央、管理系・ハンバーガーは右端に絶対配置 */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center">
        <Link href="/" className="group flex items-center">
          <Image src="/logo.png" alt="小雀シーガーズ" width={2828} height={1192} priority className="h-10 w-auto" />
        </Link>
        <NavClient isLoggedIn={!!user} />
      </div>
      <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
    </nav>
  )
}
