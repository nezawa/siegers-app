import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Game } from '@/types'

function ResultBadge({ result }: { result: Game['result'] }) {
  if (result === 'W') return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-sm font-medium">勝</span>
  if (result === 'L') return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-sm font-medium">負</span>
  if (result === 'D') return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm font-medium">分</span>
  return null
}

export default async function TopPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('games').select('*').order('date', { ascending: false })
  const games = data ?? []
  const recentGames = games.slice(0, 5)
  const totalWins = games.filter(g => g.result === 'W').length
  const totalLosses = games.filter(g => g.result === 'L').length
  const totalDraws = games.filter(g => g.result === 'D').length

  return (
    <div className="space-y-8">
      <div className="bg-blue-900 text-white rounded-xl p-6 sm:p-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">⚾ Siegers</h1>
        <p className="text-blue-300 text-sm mb-6">2025シーズン</p>
        <div className="flex justify-center gap-8 sm:gap-16">
          <div>
            <div className="text-4xl sm:text-5xl font-bold">{totalWins}</div>
            <div className="text-blue-300 text-sm mt-1">勝</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-bold">{totalLosses}</div>
            <div className="text-blue-300 text-sm mt-1">敗</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-bold">{totalDraws}</div>
            <div className="text-blue-300 text-sm mt-1">分</div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">最近の試合</h2>
          <Link href="/games" className="text-blue-600 hover:underline text-sm">すべて見る →</Link>
        </div>
        {recentGames.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl shadow-sm">試合データがありません</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {recentGames.map(game => (
              <Link key={game.id} href={`/games/${game.id}`} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ResultBadge result={game.result} />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">vs {game.opponent}</div>
                    <div className="text-xs sm:text-sm text-gray-400 truncate">{game.date}{game.venue && `・${game.venue}`}</div>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 shrink-0">{game.score_us} - {game.score_them}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
