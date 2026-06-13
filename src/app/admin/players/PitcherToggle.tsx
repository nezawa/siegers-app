'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PitcherToggle({ id, isPitcher }: { id: string; isPitcher: boolean }) {
  const router = useRouter()
  const [on, setOn] = useState(isPitcher)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    const next = !on
    const supabase = createClient()
    const { error } = await supabase.from('players').update({ is_pitcher: next }).eq('id', id)
    if (error) {
      alert('更新に失敗しました')
      setLoading(false)
      return
    }
    setOn(next)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={
        'rounded-full px-3 py-1 text-xs font-medium transition-all disabled:opacity-50 ' +
        (on
          ? 'bg-blue-950 text-white shadow-sm hover:bg-blue-900'
          : 'bg-white text-gray-500 ring-1 ring-gray-300 hover:bg-gray-50 hover:ring-gray-400')
      }
    >
      {on ? '投手 ✓' : '投手登録'}
    </button>
  )
}
