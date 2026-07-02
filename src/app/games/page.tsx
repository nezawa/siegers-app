import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import Link from 'next/link'
import type { Game } from '@/types'

const DOW_JA = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = DOW_JA[d.getDay()]
  return { label: `${y}/${m}/${day}`, dow, isSat: d.getDay() === 6, isSun: d.getDay() === 0 }
}

function ResultBadge({ result }: { result: Game['result'] }) {
  if (result === 'W') return <span className="inline-flex justify-center rounded-md bg-red-600 px-3 py-1 text-sm font-bold text-white shadow-sm">勝ち</span>
  if (result === 'L') return <span className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-1 text-sm font-bold text-white shadow-sm">負け</span>
  if (result === 'D') return <span className="inline-flex justify-center rounded-md bg-gray-500 px-3 py-1 text-sm font-bold text-white shadow-sm">引分け</span>
  return <span className="inline-flex justify-center rounded-md bg-gray-400 px-3 py-1 text-sm font-bold text-white shadow-sm">-</span>
}

const ACCENT: Record<string, string> = {
  W: 'bg-red-500',
  L: 'bg-blue-500',
  D: 'bg-gray-400',
}

const GAME_TYPE_LABEL: Record<string, string> = {
  official: '公式戦',
  practice: '練習試合',
  other: 'その他',
}

export default async function GamesPage() {
  const supabase = await createClient()
  const games = await fetchAllRows((from, to) =>
    supabase.from('games').select('*').order('date', { ascending: false }).order('id').range(from, to)
  )

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-blue-700 to-blue-950" />
        試合結果
      </h1>
      {games.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">試合データがありません</div>
      ) : (
        <div className="space-y-3">
          {games.map(game => {
            const { label, dow, isSun } = formatDate(game.date)
            const dowColor = isSun ? 'text-red-500' : 'text-blue-500'
            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group flex items-stretch gap-3 rounded-2xl bg-white px-4 sm:px-5 py-4 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-900/15"
              >
                <span className={`w-1 shrink-0 self-stretch rounded-full ${ACCENT[game.result ?? ''] ?? 'bg-gray-200'}`} />

                {/* 左: 日付・対戦相手 */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-800">{label}</span>
                    <span className={`text-sm font-bold ${dowColor}`}>（{dow}）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="truncate text-base font-bold text-gray-900">{game.opponent}</span>
                    {game.game_type && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {GAME_TYPE_LABEL[game.game_type] ?? game.game_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* 右: スコア・結果 */}
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-extrabold leading-tight tabular-nums text-blue-950">
                      {game.score_us}<span className="text-gray-300">-</span>{game.score_them}
                    </div>
                    <div className="mt-1 flex justify-end">
                      <ResultBadge result={game.result} />
                    </div>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
