import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { TournamentOption } from '../GameFormBase'
import GameForm from './GameForm'
import JsonGameForm from './JsonGameForm'
import JsonFileForm from './JsonFileForm'

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const supabase = await createClient()
  const [{ data: players }, { data: opponentRows }, { data: tournamentRows }] = await Promise.all([
    supabase.from('players').select('*').order('number'),
    supabase.from('opponents').select('name').order('name'),
    supabase.from('tournaments').select('name, game_type').order('name'),
  ])
  const playerList = players ?? []
  const opponents = (opponentRows ?? []).map(o => o.name) as string[]
  // 大会名は、フォームで選んだときに試合種別を自動入力するため属性込みで渡す
  const tournaments = (tournamentRows ?? []) as TournamentOption[]

  // タブが3つあるとスマホでは横に収まらないので、幅いっぱいに分け合わせる
  const tabCls = (active: boolean) =>
    `flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-xs transition-all sm:flex-none sm:px-6 sm:text-sm ${
      active
        ? 'bg-white text-blue-950 font-bold shadow'
        : 'text-gray-500 font-medium hover:text-gray-800'
    }`

  // タブ同士の区切り線。選択中のタブ（白いカード）の隣は、線があると窮屈なので消す
  const current = mode === 'json' ? 'json' : mode === 'file' ? 'file' : 'form'
  const divider = (left: string, right: string) => (
    <span
      aria-hidden
      className={`my-1.5 w-px shrink-0 bg-gray-300 transition-opacity ${
        current === left || current === right ? 'opacity-0' : 'opacity-100'
      }`}
    />
  )

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
        試合結果入力
      </h1>

      <div className="mb-6 flex w-full rounded-xl bg-gray-200/70 p-1 ring-1 ring-gray-300/60 sm:inline-flex sm:w-auto">
        <Link href="/admin/games/new" className={tabCls(current === 'form')}>
          フォーム入力
        </Link>
        {divider('form', 'json')}
        <Link href="/admin/games/new?mode=json" className={tabCls(current === 'json')}>
          JSON入力
        </Link>
        {divider('json', 'file')}
        <Link href="/admin/games/new?mode=file" className={tabCls(current === 'file')}>
          JSONファイル入力
        </Link>
      </div>

      {mode === 'json' ? (
        <JsonGameForm players={playerList} />
      ) : mode === 'file' ? (
        <JsonFileForm players={playerList} />
      ) : (
        <GameForm players={playerList} opponents={opponents} tournaments={tournaments} />
      )}
    </div>
  )
}
