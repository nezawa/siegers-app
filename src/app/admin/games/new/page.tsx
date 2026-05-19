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
  const { data: players } = await supabase.from('players').select('*').order('number')
  const playerList = players ?? []

  const tabCls = (active: boolean) =>
    `px-5 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${
      active
        ? 'bg-white border-gray-200 text-blue-900'
        : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">試合結果入力</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <Link href="/admin/games/new" className={tabCls(mode !== 'json')}>
          フォーム入力
        </Link>
        <Link href="/admin/games/new?mode=json" className={tabCls(mode === 'json')}>
          JSON入力
        </Link>
      </div>

      {mode === 'json'
        ? <JsonGameForm players={playerList} />
        : <GameForm players={playerList} />
      }
    </div>
  )
}
