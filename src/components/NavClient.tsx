'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NavClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const close = () => setOpen(false)

  return (
    <>
      {/* デスクトップナビ */}
      <div className="hidden sm:flex items-center gap-8">
        <Link href="/" className="hover:text-blue-200 transition-colors">試合結果</Link>
        <Link href="/players" className="hover:text-blue-200 transition-colors">選手成績</Link>
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <Link href="/admin/players" className="bg-white/20 text-white px-3 py-1.5 rounded text-sm hover:bg-white/30 transition-colors">
              選手管理
            </Link>
            <Link href="/admin/games/new" className="bg-white text-blue-900 px-4 py-1.5 rounded font-medium hover:bg-blue-50 transition-colors text-sm">
              試合入力
            </Link>
            <button onClick={handleLogout} className="text-blue-200 hover:text-white text-sm transition-colors">
              ログアウト
            </button>
          </div>
        ) : (
          <Link href="/admin/login" className="hover:text-blue-200 transition-colors text-sm">管理者</Link>
        )}
      </div>

      {/* モバイルハンバーガーボタン */}
      <button
        className="sm:hidden p-2 rounded hover:bg-white/10 transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="メニューを開く"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* モバイルドロップダウン */}
      {open && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-blue-900 border-t border-blue-800 px-5 py-4 space-y-1 z-50 shadow-lg">
          <Link href="/games" onClick={close} className="block py-3 border-b border-blue-800 hover:text-blue-200 transition-colors">
            試合結果
          </Link>
          <Link href="/players" onClick={close} className="block py-3 hover:text-blue-200 transition-colors">
            選手成績
          </Link>
          {isLoggedIn ? (
            <div className="border-t border-blue-800 pt-3 mt-3 space-y-1">
              <Link href="/admin/players" onClick={close} className="block py-3 border-b border-blue-800 hover:text-blue-200 transition-colors">
                選手管理
              </Link>
              <Link href="/admin/games/new" onClick={close} className="block py-3 border-b border-blue-800 hover:text-blue-200 transition-colors">
                試合入力
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left py-3 text-blue-200 hover:text-white transition-colors"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <Link href="/admin/login" onClick={close} className="block py-3 border-t border-blue-800 mt-3 pt-4 hover:text-blue-200 transition-colors text-sm">
              管理者
            </Link>
          )}
        </div>
      )}
    </>
  )
}
