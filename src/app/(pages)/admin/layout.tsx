import type { Metadata } from 'next'

// 管理ページ共通のタブ表示。
// client component のページ（ログイン・選手の追加）は metadata を持てないため、
// ここでフォールバックのタイトルを定義する。個別に metadata があるページはそちらが優先される
export const metadata: Metadata = { title: '管理' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
