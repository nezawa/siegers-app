'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }

    router.push('/admin/games/new')
    router.refresh()
  }

  const inputCls =
    'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'

  return (
    <div className="max-w-sm mx-auto mt-14">
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-blue-950/5 ring-1 ring-gray-900/5">
        <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-8 py-6 text-center text-white">
          <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 text-xl">⚾</span>
          <h1 className="text-lg font-bold">管理者ログイン</h1>
          <p className="mt-0.5 text-xs text-blue-300">SIEGERS ADMIN</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 p-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-900 to-blue-950 py-2.5 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:from-blue-800 hover:to-blue-900 hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
