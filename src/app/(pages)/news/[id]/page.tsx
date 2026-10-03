import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types'

type PostLink = Pick<BlogPost, 'id' | 'title'>

// generateMetadata と本体で同じ記事を引くので、1リクエスト内では1回の取得にまとめる
const fetchPost = cache(async (id: string): Promise<BlogPost | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, body, published_at, author')
    .eq('id', id)
    .maybeSingle()
  return (data as BlogPost | null) ?? null
})

// 前後の記事。一覧と同じ並び（新しい順）で隣を探す。記事数は少ないので id・タイトルだけ全件取る
async function fetchNeighbors(id: string): Promise<{ newer: PostLink | null; older: PostLink | null }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title')
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false })
  const list = (data ?? []) as PostLink[]
  const i = list.findIndex(p => p.id === id)
  if (i < 0) return { newer: null, older: null }
  return { newer: list[i - 1] ?? null, older: list[i + 1] ?? null }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = await fetchPost(id)
  return { title: post ? post.title : 'News' }
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}

export default async function NewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [post, { newer, older }, { data: { user } }] = await Promise.all([
    fetchPost(id),
    fetchNeighbors(id),
    supabase.auth.getUser(),
  ])
  if (!post) notFound()

  const neighborCls = 'group flex min-w-0 flex-1 flex-col gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md hover:ring-band/30'

  return (
    <div className="mx-auto max-w-2xl">
      {/* 階層が浅いのでパンくずではなく「一覧へ戻る」1本。本文より目立たせない */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/news" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
          <Chevron dir="left" />
          News
        </Link>
        {/* 編集は管理者のみ */}
        {user && (
          <Link href={`/admin/news/${post.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-sm font-bold text-gray-600 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            編集
          </Link>
        )}
      </div>

      <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:p-8">
        <p className="text-xs font-medium text-gray-400">
          <span className="tabular-nums">{post.published_at.replace(/-/g, '/')}</span>
          {post.author && <span className="ml-2">投稿者: {post.author}</span>}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{post.title}</h1>
        {/* 本文はプレーンテキスト。改行をそのまま表示する */}
        <div className="mt-5 whitespace-pre-wrap border-t border-gray-100 pt-5 text-sm leading-7 text-gray-700">
          {post.body}
        </div>
      </article>

      {/* 読み終わった位置から次の行動へ：前後の記事と一覧へ戻る */}
      {(newer || older) && (
        <nav className="mt-6 flex flex-col gap-3 sm:flex-row">
          {older ? (
            <Link href={`/news/${older.id}`} className={neighborCls}>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400"><Chevron dir="left" />前の記事</span>
              <span className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-blue-900">{older.title}</span>
            </Link>
          ) : <div className="hidden flex-1 sm:block" />}
          {newer ? (
            <Link href={`/news/${newer.id}`} className={`${neighborCls} sm:items-end sm:text-right`}>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">次の記事<Chevron dir="right" /></span>
              <span className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-blue-900">{newer.title}</span>
            </Link>
          ) : <div className="hidden flex-1 sm:block" />}
        </nav>
      )}

      <div className="mt-6 text-center">
        <Link href="/news"
          className="inline-block rounded-xl bg-band px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg">
          News一覧へ戻る
        </Link>
      </div>
    </div>
  )
}
