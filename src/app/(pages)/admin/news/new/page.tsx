import type { Metadata } from 'next'
import Link from 'next/link'
import BlogPostForm from '../BlogPostForm'

export const metadata: Metadata = { title: '新規投稿' }

export default function NewNewsPostPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href="/news" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          News
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
