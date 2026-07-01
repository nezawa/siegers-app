'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const desktopLinkCls =
  'relative py-1 text-sm font-medium text-blue-100 transition-colors hover:text-white ' +
  'after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-amber-400 after:transition-all after:duration-300 hover:after:w-full'

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
      <div className="hidden sm:flex items-center gap-7">
        <Link href="/" className={desktopLinkCls}>試合結果</Link>
        <Link href="/players" className={desktopLinkCls}>選手成績</Link>
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <Link href="/admin/players" className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/25 transition-colors hover:bg-white/20">
              選手管理
            </Link>
            <Link href="/admin/games/new" className="rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-bold text-blue-950 shadow-sm transition-colors hover:bg-amber-300">
              試合入力
            </Link>
            <Link href="/admin/settings" aria-label="設定" className="rounded-lg p-1.5 text-blue-300 transition-colors hover:bg-white/10 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <button onClick={handleLogout} className="text-sm text-blue-300 transition-colors hover:text-white">
              ログアウト
            </button>
          </div>
        ) : (
          <Link href="/admin/login" className="text-sm text-blue-300 transition-colors hover:text-white">管理者</Link>
        )}
      </div>

      {/* モバイルハンバーガーボタン */}
      <button
        className="sm:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
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
        <div className="sm:hidden absolute top-full left-0 right-0 z-50 bg-blue-950/95 backdrop-blur border-t border-white/10 px-5 py-4 space-y-1 shadow-xl shadow-blue-950/30">
          <Link href="/games" onClick={close} className="block py-3 border-b border-white/10 text-blue-100 hover:text-white transition-colors">
            試合結果
          </Link>
          <Link href="/players" onClick={close} className="block py-3 text-blue-100 hover:text-white transition-colors">
            選手成績
          </Link>
          {isLoggedIn ? (
            <div className="border-t border-white/10 pt-3 mt-3 space-y-1">
              <Link href="/admin/players" onClick={close} className="block py-3 border-b border-white/10 text-blue-100 hover:text-white transition-colors">
                選手管理
              </Link>
              <Link href="/admin/games/new" onClick={close} className="block py-3 border-b border-white/10 text-amber-300 font-medium hover:text-amber-200 transition-colors">
                試合入力
              </Link>
              <Link href="/admin/settings" onClick={close} className="block py-3 border-b border-white/10 text-blue-100 hover:text-white transition-colors">
                設定
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left py-3 text-blue-300 hover:text-white transition-colors"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <Link href="/admin/login" onClick={close} className="block py-3 border-t border-white/10 mt-3 pt-4 text-sm text-blue-300 hover:text-white transition-colors">
              管理者
            </Link>
          )}
        </div>
      )}
    </>
  )
}
