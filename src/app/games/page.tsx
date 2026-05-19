import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Game } from '@/types'

function ResultBadge({ result }: { result: Game['result'] }) {
  if (result === 'W') return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-sm font-medium">勝</span>
  if (result === 'L') return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-sm font-medium">負</span>
  if (result === 'D') return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm font-medium">分</span>
  return null
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">日付</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">対戦相手</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">スコア</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">結果</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">球場</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {games.map(game => (
                <tr key={game.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{game.date}</td>
                  <td className="px-6 py-4">
                    <Link href={`/games/${game.id}`} className="font-medium text-blue-600 hover:underline">
                      vs {game.opponent}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-center font-bold">{game.score_us} - {game.score_them}</td>
                  <td className="px-6 py-4 text-center"><ResultBadge result={game.result} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{game.venue ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
