import type { Metadata } from 'next'
import Link from 'next/link'
import { isBlogUnlocked } from '@/lib/blogAuth'
import BlogLoginForm from '../BlogLoginForm'
import NewPostForm from '../NewPostForm'

export const metadata: Metadata = { title: '新規投稿' }

export default async function NewBlogPostPage() {
  if (!(await isBlogUnlocked())) return <BlogLoginForm />

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-blue-700 transition-colors hover:text-blue-900 hover:underline">
          ← ブログ一覧
        </Link>
      </div>
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
        新規投稿
      </h1>
      <NewPostForm />
    </div>
  )
}
