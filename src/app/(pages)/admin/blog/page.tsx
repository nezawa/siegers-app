import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types'
import DeletePostButton from './DeletePostButton'

export const metadata: Metadata = { title: 'ブログ管理' }

export default async function AdminBlogPage() {
  const supabase = await createClient()
  // 管理者は RLS のポリシーでテーブルを直接読める
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, body, published_at, author')
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false })
  const posts = (data ?? []) as BlogPost[]

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900">
          <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
          ブログ管理
        </h1>
        <Link href="/admin/blog/new"
          className="rounded-xl bg-band px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-85">
          新規投稿
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
        {posts.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">まだ記事がありません</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {posts.map(post => (
              <li key={post.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="text-xs tabular-nums text-gray-400">{post.published_at.replace(/-/g, '/')}</p>
                  <p className="truncate font-bold text-gray-900">{post.title}</p>
                </div>
                <Link href={`/admin/blog/${post.id}/edit`}
                  className="shrink-0 text-sm text-blue-700 transition-colors hover:text-blue-900 hover:underline">
                  編集
                </Link>
                <DeletePostButton id={post.id} title={post.title} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
