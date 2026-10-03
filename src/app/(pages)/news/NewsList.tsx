'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BlogPost } from '@/types'

// 一覧に出す抜粋。改行は詰めて1行にする
function excerpt(body: string, length = 120) {
  const flat = body.replace(/\s+/g, ' ').trim()
  return flat.length > length ? `${flat.slice(0, length)}…` : flat
}

function formatPostDate(date: string) {
  return date.replace(/-/g, '/')
}

// News の見出し＋記事一覧。管理者には新規投稿・削除ボタンを出し、
// 削除ボタンで選択モードに入ると各記事の横にチェックボックスが出て一括削除できる
export default function NewsList({ posts, isAdmin }: { posts: BlogPost[]; isAdmin: boolean }) {
  const router = useRouter()
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelecting = () => {
    setSelecting(false)
    setSelected(new Set())
    setError('')
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`選択した ${selected.size} 件の記事を削除しますか？`)) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('blog_posts').delete().in('id', [...selected])
    setLoading(false)
    if (err) {
      setError(`削除に失敗しました: ${err.message}`)
      return
    }
    exitSelecting()
    router.refresh()
  }

  const subBtnCls = 'rounded-xl bg-white px-4 py-1.5 text-sm font-bold text-gray-600 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 disabled:opacity-50'

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900">
          <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
          News
        </h1>
        {isAdmin && (
          <div className="flex items-center gap-2">
            {selecting ? (
              <>
                <button onClick={exitSelecting} disabled={loading} className={subBtnCls}>
                  キャンセル
                </button>
                <button onClick={handleDelete} disabled={loading || selected.size === 0}
                  className="rounded-xl bg-red-500 px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-600 disabled:opacity-50">
                  {loading ? '削除中...' : `選択した記事を削除（${selected.size}）`}
                </button>
              </>
            ) : (
              <>
                <Link href="/admin/news/new"
                  className="rounded-xl bg-band px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-85">
                  新規投稿
                </Link>
                {posts.length > 0 && (
                  <button onClick={() => setSelecting(true)} className={subBtnCls}>
                    削除
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {posts.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">
          まだ記事がありません
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map(post => {
            const content = (
              <>
                <p className="text-xs font-medium text-gray-400">
                  <span className="tabular-nums">{formatPostDate(post.published_at)}</span>
                  {post.author && <span className="ml-2">{post.author}</span>}
                </p>
                <h2 className="mt-1 font-bold text-gray-900">{post.title}</h2>
                <p className="mt-1.5 text-sm text-gray-500">{excerpt(post.body)}</p>
              </>
            )
            const cardCls = 'block rounded-2xl bg-white p-5 shadow-sm ring-1 transition-all'

            return (
              <li key={post.id}>
                {selecting ? (
                  // 選択モード中はカード全体をラベルにして、どこを押しても選択を切り替えられるようにする
                  <label className={`${cardCls} flex cursor-pointer items-start gap-4 ${selected.has(post.id) ? 'ring-2 ring-red-400' : 'ring-gray-900/5 hover:ring-red-200'}`}>
                    <input type="checkbox" checked={selected.has(post.id)} onChange={() => toggle(post.id)}
                      className="mt-1 h-5 w-5 shrink-0 accent-red-500" />
                    <div className="min-w-0 flex-1">{content}</div>
                  </label>
                ) : (
                  <Link href={`/news/${post.id}`} className={`${cardCls} ring-gray-900/5 hover:shadow-md hover:ring-band/30`}>
                    {content}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
