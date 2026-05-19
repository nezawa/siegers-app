'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeletePlayerButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`「${name}」を削除しますか？`)) return

    const supabase = createClient()
    await supabase.from('players').delete().eq('id', id)
    router.refresh()
  }

  return (
    <button onClick={handleDelete}
      className="text-sm text-red-500 hover:text-red-700 transition-colors">
      削除
    </button>
  )
}
