import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isBlogUnlocked, getBlogToken } from '@/lib/blogAuth'
import type { BlogPost } from '@/types'
import BlogLoginForm from '../BlogLoginForm'

async function fetchPost(id: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('blog_post_get', { p_token: await getBlogToken(), p_id: id })
  return ((data ?? []) as BlogPost[])[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  // 未ログインの人にタイトルを見せないよう、ここでも閲覧可否を確認する
  if (!(await isBlogUnlocked())) return { title: 'ブログ' }
  const { id } = await params
  const post = await fetchPost(id)
  return { title: post ? post.title : 'ブログ' }
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isBlogUnlocked())) return <BlogLoginForm />

  const { id } = await params
  const post = await fetchPost(id)
  if (!post) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-blue-700 transition-colors hover:text-blue-900 hover:underline">
          ← ブログ一覧
        </Link>
      </div>

      <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:p-8">
        <p className="text-xs font-medium tabular-nums text-gray-400">{post.published_at.replace(/-/g, '/')}</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{post.title}</h1>
        {/* 本文はプレーンテキスト。改行をそのまま表示する */}
        <div className="mt-5 whitespace-pre-wrap border-t border-gray-100 pt-5 text-sm leading-7 text-gray-700">
          {post.body}
        </div>
      </article>
    </div>
  )
}
