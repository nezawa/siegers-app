'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { errorMessage } from '@/lib/errorMessage'
import type { BlogPost } from '@/types'

// 新規投稿と編集で共有するフォーム。post があれば編集モード
export default function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter()
  const [title, setTitle] = useState(post?.title ?? '')
  const [body, setBody] = useState(post?.body ?? '')
  const [publishedAt, setPublishedAt] = useState(
    post?.published_at ?? new Date().toLocaleDateString('sv-SE') // "YYYY-MM-DD"（端末のローカル日付）
  )
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
      const supabase = createClient()
      const fields = { title: title.trim(), body, published_at: publishedAt }

      if (post) {
        const { error: err } = await supabase
          .from('blog_posts')
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq('id', post.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('blog_posts').insert(fields)
        if (err) throw err
      }

      router.push('/admin/blog')
      router.refresh()
    } catch (err: unknown) {
      setError(`保存に失敗しました: ${errorMessage(err)}`)
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">投稿日</label>
            <input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)}
              className={`${inputCls} sm:w-52`} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">タイトル *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="開幕戦を勝利で飾りました" className={inputCls} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">本文 *</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={16}
              placeholder="改行はそのまま表示されます"
              className={`${inputCls} resize-y leading-7`} />
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-band py-3 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50">
            {loading ? '保存中...' : post ? '変更を保存' : '投稿する'}
          </button>
        </div>
      </div>
    </form>
  )
}
