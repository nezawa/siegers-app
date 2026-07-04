'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const desktopLinkCls =
  'relative py-1 text-sm font-medium text-white/90 transition-colors hover:text-white ' +
  'after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-white after:transition-all after:duration-300 hover:after:w-full'

export default function NavClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false)
  const adminMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // ドロワー表示中は背景のスクロールを止める
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // 歯車メニューの外側をクリックしたら閉じる
  useEffect(() => {
    if (!adminOpen) return
    const handleClick = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setAdminOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [adminOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const close = () => {
    setOpen(false)
    setMobileAdminOpen(false)
  }

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
          <div className="relative" ref={adminMenuRef}>
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
              <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-gray-900/10">
                <Link href="/admin/games/new" onClick={() => setAdminOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50">
                  試合入力
                </Link>
                <Link href="/admin/players" onClick={() => setAdminOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50">
                  選手管理
                </Link>
                <Link href="/admin/opponents" onClick={() => setAdminOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50">
                  対戦相手管理
                </Link>
                <Link href="/admin/tournaments" onClick={() => setAdminOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50">
                  大会管理
                </Link>
                <Link href="/admin/settings" onClick={() => setAdminOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50">
                  設定
                </Link>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => { setAdminOpen(false); handleLogout() }}
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-blue-50 hover:text-gray-700"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/admin/login"
            aria-label="管理者ログイン"
            className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
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

      {/* モバイルドロワー */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50">
          {/* 背景オーバーレイ */}
          <div className="absolute inset-0 bg-blue-950/40" onClick={close} />
          {/* 右側パネル */}
          <div className="absolute right-0 top-0 flex h-full w-[76%] max-w-xs flex-col overflow-y-auto bg-band/95 backdrop-blur px-6 pb-10 shadow-2xl shadow-blue-950/40">
            <button
              onClick={close}
              aria-label="メニューを閉じる"
              className="mb-8 mt-5 flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-full border-2 border-white/70 text-white transition-colors hover:bg-white/10"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <nav className="flex flex-col items-center text-center">
              <Link href="/" onClick={close} className="block w-full py-4 tracking-wide text-white/90 transition-colors hover:text-white">
                TOP
              </Link>
              <Link href="/about" onClick={close} className="block w-full py-4 tracking-wide text-white/90 transition-colors hover:text-white">
                小雀シーガーズとは
              </Link>
              <Link href="/games" onClick={close} className="block w-full py-4 tracking-wide text-white/90 transition-colors hover:text-white">
                試合結果
              </Link>
              <Link href="/players" onClick={close} className="block w-full py-4 tracking-wide text-white/90 transition-colors hover:text-white">
                選手成績
              </Link>
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setMobileAdminOpen(v => !v)}
                    className="flex w-full items-center justify-center gap-2 py-4 tracking-wide text-white/90 transition-colors hover:text-white"
                  >
                    管理者
                    <svg
                      className={`h-4 w-4 transition-transform ${mobileAdminOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {mobileAdminOpen && (
                    <div className="flex w-full flex-col items-center text-[15px]">
                      <Link href="/admin/games/new" onClick={close} className="block w-full py-3 tracking-wide text-white/80 transition-colors hover:text-white">
                        試合入力
                      </Link>
                      <Link href="/admin/players" onClick={close} className="block w-full py-3 tracking-wide text-white/80 transition-colors hover:text-white">
                        選手管理
                      </Link>
                      <Link href="/admin/opponents" onClick={close} className="block w-full py-3 tracking-wide text-white/80 transition-colors hover:text-white">
                        対戦相手管理
                      </Link>
                      <Link href="/admin/tournaments" onClick={close} className="block w-full py-3 tracking-wide text-white/80 transition-colors hover:text-white">
                        大会管理
                      </Link>
                      <Link href="/admin/settings" onClick={close} className="block w-full py-3 tracking-wide text-white/80 transition-colors hover:text-white">
                        設定
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full py-3 tracking-wide text-white/60 transition-colors hover:text-white"
                      >
                        ログアウト
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link href="/admin/login" onClick={close} className="block w-full py-4 tracking-wide text-white/90 transition-colors hover:text-white">
                  管理者ログイン
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
