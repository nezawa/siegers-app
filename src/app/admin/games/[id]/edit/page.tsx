import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import GameEditForm from './GameEditForm'

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: game }, { data: batting }, { data: pitching }, { data: players }] = await Promise.all([
    supabase.from('games').select('*').eq('id', id).single(),
    supabase.from('batting_stats').select('*').eq('game_id', id).order('batting_order'),
    supabase.from('pitching_stats').select('*').eq('game_id', id),
    supabase.from('players').select('*').order('number'),
  ])

  if (!game) notFound()

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">試合結果を編集</h1>
      <GameEditForm
        game={game}
        existingBatting={batting ?? []}
        existingPitching={pitching ?? []}
        players={players ?? []}
      />
    </div>
  )
}
