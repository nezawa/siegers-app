'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { isLoading, setNavigating, subscribeLoading } from '@/lib/loadingStore'

// 想定外に遷移が終わらなかったとき（同じURLへのリダイレクトなど）にスピナーが出っぱなしにならないための保険
const MAX_SPIN_MS = 10_000

// 画面遷移中に画面中央へ出すスピナー。layout.tsx に1つだけ置く。
// すぐ終わる遷移でちらつかないよう、表示は少し遅れてフェードインする
export default function NavigationSpinner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const loading = useSyncExternalStore(subscribeLoading, isLoading, () => false)

  // 開始の合図は instrumentation-client.ts から届く
  useEffect(() => {
    const start = () => setNavigating(true)
    window.addEventListener('app:navigation-start', start)
    return () => window.removeEventListener('app:navigation-start', start)
  }, [])

  // URLが切り替わったら遷移完了（スケルトンが出るページは LoadingHold が引き継ぐ）
  useEffect(() => {
    setNavigating(false)
  }, [pathname, searchParams])

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setNavigating(false), MAX_SPIN_MS)
    return () => clearTimeout(timer)
  }, [loading])

  if (!loading) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      <div role="status" aria-label="読み込み中"
        className="animate-delayed-fade-in rounded-2xl bg-white/90 p-4 text-band shadow-lg ring-1 ring-gray-900/5">
        <svg className="h-9 w-9 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2.5} className="opacity-25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
