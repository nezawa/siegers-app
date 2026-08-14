import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import GameEditForm from './GameEditForm'

export default async function EditGamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ year?: string; page?: string }>
}) {
  const { id } = await params
  // 一覧の表示状態（年度・ページ）。保存後の試合詳細へ引き継いで、そこから元のページに戻れるようにする
  const { year, page } = await searchParams
  const listQuery = new URLSearchParams()
  if (year) listQuery.set('year', year)
  if (page) listQuery.set('page', page)
  const query = listQuery.toString()

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
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
        試合結果を編集
      </h1>
      <GameEditForm
        game={game}
        existingBatting={batting ?? []}
        existingPitching={pitching ?? []}
        players={players ?? []}
        listQuery={query}
      />
    </div>
  )
}
