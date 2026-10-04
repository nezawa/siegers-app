import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types'
import BlogPostForm from '../../BlogPostForm'

export const metadata: Metadata = { title: '記事の編集' }

export default async function EditNewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, body, published_at, author')
    .eq('id', id)
    .single()

  if (!data) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href={`/news/${id}`} className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          記事に戻る
        </Link>
      </div>
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
        記事の編集
      </h1>
      <BlogPostForm post={data as BlogPost} />
    </div>
  )
}
