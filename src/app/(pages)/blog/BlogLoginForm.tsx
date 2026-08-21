'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BlogLoginForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/blog/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'ログインに失敗しました')
        setLoading(false)
        return
      }
      setPassword('')
      // Cookie が付いた状態でサーバー側の判定をやり直す
      router.refresh()
    } catch {
      setError('通信に失敗しました。時間をおいて試してください')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:p-8">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-band/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6 text-band">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 1 0-8 0v4M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" />
            </svg>
          </span>
          <p className="text-sm text-gray-500">
            ブログはチーム内限定です。パスワードを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="パスワード"
            autoFocus
            autoComplete="current-password"
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || password === ''}
            className="w-full rounded-xl bg-band py-2.5 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50"
          >
            {loading ? '確認中...' : 'ログイン'}
          </button>
        </form>
      </div>

      <p className="mt-3 text-center text-xs text-gray-400">
        パスワードが分からない場合はチームの管理者にお問い合わせください
      </p>
    </div>
  )
}
