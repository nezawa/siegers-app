import type { Metadata } from 'next'
import { isBlogUnlocked } from '@/lib/blogAuth'
import BlogLoginForm from './BlogLoginForm'
import BlogLogoutButton from './BlogLogoutButton'

export const metadata: Metadata = { title: 'ブログ' }

export default async function BlogPage() {
  // パスワード未入力ならページの中身の代わりに入力画面を出す
  if (!(await isBlogUnlocked())) return <BlogLoginForm />

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900">
          <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
          ブログ
        </h1>
        <BlogLogoutButton />
      </div>

      <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">
        準備中です
      </div>
    </div>
  )
}
