'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeletePlayerButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const supabase = createClient()

    // 成績データが残っている選手は削除させない（FK 設定に依存せず挙動を保証する）
    const [{ count: bCount }, { count: pCount }] = await Promise.all([
      supabase.from('batting_stats').select('id', { count: 'exact', head: true }).eq('player_id', id),
      supabase.from('pitching_stats').select('id', { count: 'exact', head: true }).eq('player_id', id),
    ])
    if ((bCount ?? 0) > 0 || (pCount ?? 0) > 0) {
      alert(`「${name}」には試合成績が登録されているため削除できません。\n先に該当試合の成績からこの選手を外してください。`)
      setLoading(false)
      return
    }

    if (!confirm(`「${name}」を削除しますか？`)) {
      setLoading(false)
      return
    }

    const { error } = await supabase.from('players').delete().eq('id', id)
    if (error) {
      alert(`削除に失敗しました: ${error.message}`)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50">
      削除
    </button>
  )
}
