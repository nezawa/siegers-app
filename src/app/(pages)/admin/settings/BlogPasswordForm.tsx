'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { errorMessage } from '@/lib/errorMessage'

// ブログ閲覧用パスワードの変更（管理者パスワードとは別）。
// 現在のパスワードは DB にハッシュでしか無く、画面から読み出すことはできないため
// 「新しいパスワードを設定する」だけの UI にしている。
export default function BlogPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (password.length < 4) {
      setError('パスワードは4文字以上にしてください')
      return
    }
    if (password !== confirm) {
      setError('確認用のパスワードが一致しません')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.rpc('set_blog_password', { p_password: password })
      if (err) throw err
      setPassword('')
      setConfirm('')
      setSaved(true)
    } catch (err: unknown) {
      setError(`変更に失敗しました: ${errorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <h2 className="mb-1 border-l-4 border-band pl-2.5 font-bold text-gray-900">ブログの閲覧パスワード</h2>
        <p className="mb-5 pl-3.5 text-xs text-gray-400">
          ブログページを開くときに必要なパスワードです（管理者ログインのパスワードとは別）。
          変更すると、いまブログにログイン中の人は全員もう一度入力が必要になります
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">新しいパスワード</label>
            <input
              type="password" value={password} autoComplete="new-password"
              onChange={e => setPassword(e.target.value)}
              placeholder="4文字以上"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">確認のためもう一度</label>
            <input
              type="password" value={confirm} autoComplete="new-password"
              onChange={e => setConfirm(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">ブログのパスワードを変更しました</p>}

      <button type="submit" disabled={loading || password === '' || confirm === ''}
        className="w-full rounded-xl bg-band py-3 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50">
        {loading ? '変更中...' : 'パスワードを変更'}
      </button>
    </form>
  )
}
