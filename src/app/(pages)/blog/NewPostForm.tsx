'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ブログにログインした人が使う投稿フォーム。
// テーブルへ直接 insert する権限は無いので、セッションを検証する RPC 経由で投稿する。
// トークンは httpOnly Cookie にあり JS から読めないため、サーバー側の API を挟む
export default function NewPostForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')
  const [publishedAt, setPublishedAt] = useState(new Date().toLocaleDateString('sv-SE'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() === '' || body.trim() === '') {
      setError('タイトルと本文を入力してください')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, author, published_at: publishedAt }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? '投稿に失敗しました')
        setLoading(false)
        return
      }
      router.push(`/blog/${data.id}`)
      router.refresh()
    } catch {
      setError('通信に失敗しました。時間をおいて試してください')
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">投稿日</label>
              <input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} className={inputCls} />
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">投稿者名</label>
              <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
                placeholder="任意" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">タイトル *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="開幕戦を勝利で飾りました" className={inputCls} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">本文 *</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={16}
              placeholder="改行はそのまま表示されます" className={`${inputCls} resize-y leading-7`} />
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-band py-3 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50">
            {loading ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </div>
    </form>
  )
}
