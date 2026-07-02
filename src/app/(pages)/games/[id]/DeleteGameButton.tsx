'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteGameButton({ gameId }: { gameId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('この試合を削除しますか？選手成績も全て削除されます。')) return
    setLoading(true)
    const res = await fetch(`/api/games/${gameId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/games')
      router.refresh()
    } else {
      alert('削除に失敗しました')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg px-3 py-1 text-sm text-red-300 ring-1 ring-red-400/50 transition-colors hover:bg-red-500/10 disabled:opacity-50"
    >
      {loading ? '削除中...' : '削除'}
    </button>
  )
}
