'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Player } from '@/types'
import GameFormBase, { registerMasters, type GameSavePayload } from '../GameFormBase'

export default function GameForm({ players, opponents, tournaments }: { players: Player[]; opponents: string[]; tournaments: string[] }) {
  const router = useRouter()

  const handleSave = async ({ game, batting, pitching }: GameSavePayload) => {
    const supabase = createClient()

    const { data: created, error: gameError } = await supabase
      .from('games')
      .insert(game)
      .select()
      .single()
    if (gameError) throw gameError

    if (batting.length > 0) {
      const { error } = await supabase.from('batting_stats').insert(
        batting.map(r => ({ game_id: created.id, ...r }))
      )
      if (error) throw error
    }

    if (pitching.length > 0) {
      const { error } = await supabase.from('pitching_stats').insert(
        pitching.map(r => ({ game_id: created.id, ...r }))
      )
      if (error) throw error
    }

    await registerMasters(supabase, game)
    router.push(`/games/${created.id}`)
  }

  return (
    <GameFormBase
      players={players}
      opponents={opponents}
      tournaments={tournaments}
      submitLabel="試合結果を保存"
      onSave={handleSave}
    />
  )
}
