'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const desktopLinkCls =
  'relative py-1 text-sm font-medium text-white/90 transition-colors hover:text-white ' +
  'after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-white after:transition-all after:duration-300 hover:after:w-full'

export default function NavClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
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
      {/* デスクトップナビ（ヘッダー中央） */}
      <div className="hidden sm:flex items-center gap-7 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
        <Link href="/" className={desktopLinkCls}>Top</Link>
        <Link href="/about" className={desktopLinkCls}>小雀シーガーズとは</Link>
        <Link href="/games" className={desktopLinkCls}>試合結果</Link>
        <Link href="/players" className={desktopLinkCls}>選手成績</Link>
      </div>

      {/* デスクトップ管理系（右端・縦中央） */}
      <div className="hidden sm:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 items-center">
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setAdminOpen(o => !o)}
                aria-label="管理メニュー"
                className={`rounded-lg p-1.5 transition-colors hover:bg-white/15 hover:text-white ${adminOpen ? 'bg-white/15 text-white' : 'text-white/80'}`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {adminOpen && (
                <>
                  {/* 外側クリックで閉じるための透明レイヤー */}
                  <div className="fixed inset-0 z-40" onClick={() => setAdminOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-gray-900/10">
                    <Link href="/admin/games/new" onClick={() => setAdminOpen(false)}
                      className="block px-4 py-2.5 text-sm font-bold text-blue-950 transition-colors hover:bg-blue-50">
                      試合入力
                    </Link>
                    <Link href="/admin/players" onClick={() => setAdminOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50">
                      選手管理
                    </Link>
                    <Link href="/admin/settings" onClick={() => setAdminOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50">
                      設定
                    </Link>
                  </div>
                </>
              )}
            </div>
            <button onClick={handleLogout} className="text-sm text-white/75 transition-colors hover:text-white">
              ログアウト
            </button>
          </div>
        ) : (
          <Link href="/admin/login" className="text-sm text-white/75 transition-colors hover:text-white">管理者</Link>
        )}
      </div>

      {/* モバイルハンバーガーボタン */}
      <button
        className="sm:hidden absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors"
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
        <div className="sm:hidden absolute top-full left-0 right-0 z-50 bg-band/95 backdrop-blur border-t border-white/15 px-5 py-4 space-y-1 shadow-xl shadow-blue-950/30">
          <Link href="/" onClick={close} className="block py-3 border-b border-white/10 text-white/90 hover:text-white transition-colors">
            ホーム
          </Link>
          <Link href="/about" onClick={close} className="block py-3 border-b border-white/10 text-white/90 hover:text-white transition-colors">
            小雀シーガーズとは
          </Link>
          <Link href="/games" onClick={close} className="block py-3 border-b border-white/10 text-white/90 hover:text-white transition-colors">
            試合結果
          </Link>
          <Link href="/players" onClick={close} className="block py-3 text-white/90 hover:text-white transition-colors">
            選手成績
          </Link>
          {isLoggedIn ? (
            <div className="border-t border-white/10 pt-3 mt-3 space-y-1">
              <Link href="/admin/players" onClick={close} className="block py-3 border-b border-white/10 text-white/90 hover:text-white transition-colors">
                選手管理
              </Link>
              <Link href="/admin/games/new" onClick={close} className="block py-3 border-b border-white/10 text-amber-300 font-medium hover:text-amber-200 transition-colors">
                試合入力
              </Link>
              <Link href="/admin/settings" onClick={close} className="block py-3 border-b border-white/10 text-white/90 hover:text-white transition-colors">
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
            <Link href="/admin/login" onClick={close} className="block py-3 border-t border-white/10 mt-3 pt-4 text-sm text-white/75 hover:text-white transition-colors">
              管理者
            </Link>
          )}
        </div>
      )}
    </>
  )
}
