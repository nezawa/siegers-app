'use client'

import { useLinkStatus } from 'next/link'

// 成績タブのラベル。切り替え待ちの間はラベルをスピナーに置き換える。
// ラベルは invisible で場所だけ残し、タブの幅・高さが変わらないようにする
export default function TabLabel({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus()
  return (
    <span className="relative inline-block">
      <span className={pending ? 'invisible' : undefined}>{children}</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center" role="status" aria-label="読み込み中">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2.5} className="opacity-25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
        </span>
      )}
    </span>
  )
}
