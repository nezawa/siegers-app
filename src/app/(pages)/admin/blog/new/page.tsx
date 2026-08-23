import type { Metadata } from 'next'
import Link from 'next/link'
import BlogPostForm from '../BlogPostForm'

export const metadata: Metadata = { title: '新規投稿' }

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href="/admin/blog" className="text-sm text-blue-700 transition-colors hover:text-blue-900 hover:underline">
          ← ブログ管理
        </Link>
      </div>
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
        新規投稿
      </h1>
      <BlogPostForm />
    </div>
  )
}
