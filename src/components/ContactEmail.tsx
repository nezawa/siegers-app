'use client'

import { useSyncExternalStore } from 'react'

// アドレス収集ボット対策：サーバーが返す HTML にはアドレスを含めず、ブラウザで組み立てて表示する
const USER = 'kosuzume.siegers.2015'
const DOMAIN = 'gmail.com'

const subscribe = () => () => {}

export default function ContactEmail() {
  // サーバー描画時は null、ブラウザでは組み立てたアドレスになる
  const email = useSyncExternalStore(subscribe, () => `${USER}@${DOMAIN}`, () => null)

  return (
    // 枠の幅を中身に合わせ、見出しとアドレスの左端を揃える（枠自体の位置はフッター側で決める）
    <div className="w-fit text-xs text-white/70">
      <p>お問い合わせ</p>
      <div className="mt-1 flex min-h-5 items-center">
        {email && (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 break-all text-white/85 underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {email}
          </a>
        )}
      </div>
    </div>
  )
}
