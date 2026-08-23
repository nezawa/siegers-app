'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeletePostButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`「${title}」を削除しますか？`)) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) {
      alert(`削除に失敗しました: ${error.message}`)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="text-sm text-red-500 transition-colors hover:text-red-700 disabled:opacity-50">
      {loading ? '削除中...' : '削除'}
    </button>
  )
}
