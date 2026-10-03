import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types'
import NewsList from './NewsList'

export const metadata: Metadata = { title: 'News' }

export default async function NewsPage() {
  const supabase = await createClient()
  const [{ data }, { data: { user } }] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('id, title, body, published_at, author')
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  // 投稿・削除は管理者のみ（DB 側も authenticated にしか書き込みを許していない）
  return <NewsList posts={(data ?? []) as BlogPost[]} isAdmin={!!user} />
}
