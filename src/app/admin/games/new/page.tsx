import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import GameForm from './GameForm'
import JsonGameForm from './JsonGameForm'

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const supabase = await createClient()
  const [{ data: players }, { data: games }] = await Promise.all([
    supabase.from('players').select('*').order('number'),
    supabase.from('games').select('opponent'),
  ])
  const playerList = players ?? []
  const opponents = [...new Set((games ?? []).map(g => g.opponent).filter(Boolean))] as string[]

  const tabCls = (active: boolean) =>
    `px-6 py-2 rounded-lg text-sm transition-all ${
      active
        ? 'bg-white text-blue-950 font-bold shadow'
        : 'text-gray-500 font-medium hover:text-gray-800'
    }`

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-blue-700 to-blue-950" />
        試合結果入力
      </h1>

      <div className="mb-6 inline-flex rounded-xl bg-gray-200/70 p-1">
        <Link href="/admin/games/new" className={tabCls(mode !== 'json')}>
          フォーム入力
        </Link>
        <Link href="/admin/games/new?mode=json" className={tabCls(mode === 'json')}>
          JSON入力
        </Link>
      </div>

      {mode === 'json'
        ? <JsonGameForm players={playerList} />
        : <GameForm players={playerList} opponents={opponents} />
      }
    </div>
  )
}
