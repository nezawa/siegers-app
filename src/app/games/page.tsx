import { createClient } from '@/lib/supabase/server'
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
  if (result === 'W') return <span className="px-3 py-1 bg-red-700 text-white rounded text-sm font-bold">勝ち</span>
  if (result === 'L') return <span className="px-3 py-1 bg-gray-500 text-white rounded text-sm font-bold">負け</span>
  if (result === 'D') return <span className="px-3 py-1 bg-green-600 text-white rounded text-sm font-bold">引分け</span>
  return <span className="px-3 py-1 bg-gray-400 text-white rounded text-sm font-bold">-</span>
}

export default async function GamesPage() {
  const supabase = await createClient()
  const { data: games } = await supabase.from('games').select('*').order('date', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">試合結果</h1>
      {!games || games.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl shadow-sm">試合データがありません</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {games.map(game => {
            const { label, dow, isSat, isSun } = formatDate(game.date)
            const dowColor = isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-blue-500'
            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* 左: 日付・対戦相手 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-bold text-gray-800">{label}</span>
                    <span className={`text-sm font-bold ${dowColor}`}>（{dow}）</span>
                  </div>
                  <div className="text-base font-bold text-gray-900 truncate">
                    {game.opponent}
                  </div>
                </div>

                {/* 右: スコア・結果 */}
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600 leading-tight">
                      {game.score_us}-{game.score_them}
                    </div>
                    <div className="mt-1 flex justify-end">
                      <ResultBadge result={game.result} />
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
