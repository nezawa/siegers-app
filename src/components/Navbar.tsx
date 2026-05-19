import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="bg-blue-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">⚾ Siegers</Link>
        <div className="flex items-center gap-8">
          <Link href="/games" className="hover:text-blue-200 transition-colors">試合結果</Link>
          <Link href="/players" className="hover:text-blue-200 transition-colors">選手成績</Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/admin/players" className="bg-white/20 text-white px-3 py-1.5 rounded text-sm hover:bg-white/30 transition-colors">
                選手管理
              </Link>
              <Link href="/admin/games/new" className="bg-white text-blue-900 px-4 py-1.5 rounded font-medium hover:bg-blue-50 transition-colors text-sm">
                試合入力
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/admin/login" className="hover:text-blue-200 transition-colors text-sm">管理者</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
