import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isBlogUnlocked, getBlogToken } from '@/lib/blogAuth'
import type { BlogPost } from '@/types'
import BlogLoginForm from './BlogLoginForm'
import BlogLogoutButton from './BlogLogoutButton'

export const metadata: Metadata = { title: 'ブログ' }

// 一覧に出す抜粋。改行は詰めて1行にする
function excerpt(body: string, length = 120) {
  const flat = body.replace(/\s+/g, ' ').trim()
  return flat.length > length ? `${flat.slice(0, length)}…` : flat
}

function formatPostDate(date: string) {
  return date.replace(/-/g, '/')
}

export default async function BlogPage() {
  // パスワード未入力ならページの中身の代わりに入力画面を出す
  if (!(await isBlogUnlocked())) return <BlogLoginForm />

  const supabase = await createClient()
  const { data } = await supabase.rpc('blog_posts_list', { p_token: await getBlogToken() })
  const posts = (data ?? []) as BlogPost[]

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900">
          <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
          ブログ
        </h1>
        <BlogLogoutButton />
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">
          まだ記事がありません
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map(post => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.id}`}
                className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md hover:ring-band/30"
              >
                <p className="text-xs font-medium tabular-nums text-gray-400">{formatPostDate(post.published_at)}</p>
                <h2 className="mt-1 font-bold text-gray-900">{post.title}</h2>
                <p className="mt-1.5 text-sm text-gray-500">{excerpt(post.body)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
