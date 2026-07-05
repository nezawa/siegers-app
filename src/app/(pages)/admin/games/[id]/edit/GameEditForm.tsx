'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Player, Game } from '@/types'
import GameFormBase, { registerMasters, type GameSavePayload } from '../../GameFormBase'

type Props = {
  game: Game
  existingBatting: Record<string, unknown>[]
  existingPitching: Record<string, unknown>[]
  players: Player[]
}

export default function GameEditForm({ game, existingBatting, existingPitching, players }: Props) {
  const router = useRouter()

  const handleSave = async ({ game: fields, batting, pitching }: GameSavePayload) => {
    const supabase = createClient()

    const { error: gameError } = await supabase
      .from('games')
      .update(fields)
      .eq('id', game.id)
    if (gameError) throw gameError

    // 既存成績の削除と再挿入を RPC で1トランザクションにまとめる
    // （途中で失敗しても全てロールバックされ、成績が消えたままにならない）
    const { error: statsError } = await supabase.rpc('replace_game_stats', {
      p_game_id: game.id,
      p_batting: batting,
      p_pitching: pitching,
    })
    if (statsError) throw statsError

    await registerMasters(supabase, fields)
    router.push(`/games/${game.id}`)
    router.refresh()
  }

  return (
    <GameFormBase
      players={players}
      initialGame={game}
      initialBatting={existingBatting}
      initialPitching={existingPitching}
      submitLabel="変更を保存"
      onSave={handleSave}
    />
  )
}
