'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BlogLogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await fetch('/api/blog/logout', { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-xl bg-white px-4 py-1.5 text-sm font-medium text-gray-600 ring-1 ring-gray-300 transition-all hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? '処理中...' : 'ログアウト'}
    </button>
  )
}
