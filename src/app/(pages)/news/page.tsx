import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types'
import NewsList from './NewsList'

export const metadata: Metadata = { title: 'News' }

const PER_PAGE = 10

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1)
  const from = (page - 1) * PER_PAGE

  const supabase = await createClient()
  // 範囲外を指定すると本体クエリは count も返さないので、件数は別に取る
  const [{ data }, { count }, { data: { user } }] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('id, title, published_at, author')
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, from + PER_PAGE - 1),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
    supabase.auth.getUser(),
  ])

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE))
  // 範囲外のページ（削除で記事が減った後など）は最終ページへ寄せる
  if (page > totalPages) redirect(totalPages > 1 ? `/news?page=${totalPages}` : '/news')

  // 投稿・削除は管理者のみ（DB 側も authenticated にしか書き込みを許していない）
  return <NewsList posts={(data ?? []) as BlogPost[]} isAdmin={!!user} page={page} totalPages={totalPages} />
}
