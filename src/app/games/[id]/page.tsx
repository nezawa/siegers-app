import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Game } from '@/types'

function ResultBadge({ result }: { result: Game['result'] }) {
  if (result === 'W') return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">勝利</span>
  if (result === 'L') return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-medium">敗戦</span>
  if (result === 'D') return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">引分</span>
  return null
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: game }, { data: batting }, { data: pitching }, { data: { user } }] = await Promise.all([
    supabase.from('games').select('*').eq('id', id).single(),
    supabase.from('batting_stats').select('*, players(*)').eq('game_id', id).order('batting_order'),
    supabase.from('pitching_stats').select('*, players(*)').eq('game_id', id),
    supabase.auth.getUser(),
  ])

  if (!game) notFound()

  const battingData = batting ?? []
  const pitchingData = pitching ?? []

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">{game.date}{game.venue && `・${game.venue}`}</p>
            <h1 className="text-2xl font-bold mt-1">vs {game.opponent}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ResultBadge result={game.result} />
            {user && (
              <Link href={`/admin/games/${id}/edit`}
                className="text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors">
                編集
              </Link>
            )}
          </div>
        </div>
        <div className="mt-6 text-center">
          <span className="text-5xl font-bold">{game.score_us}</span>
          <span className="text-2xl text-gray-300 mx-4">-</span>
          <span className="text-5xl font-bold">{game.score_them}</span>
        </div>
        {game.notes && <p className="mt-6 text-sm text-gray-500 border-t pt-4">{game.notes}</p>}
      </div>

      {battingData.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">打撃成績</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="text-sm border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['打順', '選手', '打席', '打数', '安打', '本塁打', '打点', '得点', '盗塁', '二塁打', '三塁打', '得点圏打数', '得点圏安打', '三振', '四球', '死球', '犠打', '犠飛', '併殺打', '敵失', '失策', '盗塁阻止'].map(h => (
                    <th key={h} className="px-2 py-3 font-medium text-gray-500 text-center whitespace-nowrap text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {battingData.map(stat => (
                  <tr key={stat.id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 text-center text-gray-500">{stat.batting_order ?? '-'}</td>
                    <td className="px-2 py-3 font-medium whitespace-nowrap">{(stat.players as any)?.name ?? '-'}</td>
                    <td className="px-2 py-3 text-center">{stat.pa}</td>
                    <td className="px-2 py-3 text-center">{stat.ab}</td>
                    <td className="px-2 py-3 text-center">{stat.hits}</td>
                    <td className="px-2 py-3 text-center">{stat.hr}</td>
                    <td className="px-2 py-3 text-center">{stat.rbi}</td>
                    <td className="px-2 py-3 text-center">{stat.runs}</td>
                    <td className="px-2 py-3 text-center">{stat.sb}</td>
                    <td className="px-2 py-3 text-center">{stat.doubles}</td>
                    <td className="px-2 py-3 text-center">{stat.triples}</td>
                    <td className="px-2 py-3 text-center">{stat.risp_ab}</td>
                    <td className="px-2 py-3 text-center">{stat.risp_hits}</td>
                    <td className="px-2 py-3 text-center">{stat.k}</td>
                    <td className="px-2 py-3 text-center">{stat.bb}</td>
                    <td className="px-2 py-3 text-center">{stat.hbp}</td>
                    <td className="px-2 py-3 text-center">{stat.sac_bunt}</td>
                    <td className="px-2 py-3 text-center">{stat.sac_fly}</td>
                    <td className="px-2 py-3 text-center">{stat.gidp}</td>
                    <td className="px-2 py-3 text-center">{stat.reach_on_error}</td>
                    <td className="px-2 py-3 text-center">{stat.errors}</td>
                    <td className="px-2 py-3 text-center">{stat.cs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pitchingData.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">投手成績</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="text-sm border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['選手', '勝', 'H', 'S', '敗', '投球回', '投球数', '失点', '自責点', '完投', '完封', '被安打', '被本塁打', '奪三振', '与四球', '与死球', 'ボーク', '暴投'].map(h => (
                    <th key={h} className="px-2 py-3 font-medium text-gray-500 text-center whitespace-nowrap text-xs first:text-left first:px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pitchingData.map(stat => (
                  <tr key={stat.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{(stat.players as any)?.name ?? '-'}</td>
                    <td className="px-2 py-3 text-center">{stat.is_win ? <span className="text-green-600 font-bold">○</span> : '-'}</td>
                    <td className="px-2 py-3 text-center">{(stat as any).is_hold ? <span className="text-blue-600 font-bold">○</span> : '-'}</td>
                    <td className="px-2 py-3 text-center">{(stat as any).is_save ? <span className="text-purple-600 font-bold">○</span> : '-'}</td>
                    <td className="px-2 py-3 text-center">{stat.is_loss ? <span className="text-red-600 font-bold">○</span> : '-'}</td>
                    <td className="px-2 py-3 text-center">{stat.ip}</td>
                    <td className="px-2 py-3 text-center">{(stat as any).pitch_count ?? '-'}</td>
                    <td className="px-2 py-3 text-center">{(stat as any).runs ?? '-'}</td>
                    <td className="px-2 py-3 text-center">{stat.er}</td>
                    <td className="px-2 py-3 text-center">{(stat as any).is_cg ? <span className="font-bold">○</span> : '-'}</td>
                    <td className="px-2 py-3 text-center">{(stat as any).is_sho ? <span className="font-bold">○</span> : '-'}</td>
                    <td className="px-2 py-3 text-center">{stat.hits_allowed}</td>
                    <td className="px-2 py-3 text-center">{stat.hr_allowed}</td>
                    <td className="px-2 py-3 text-center">{stat.k}</td>
                    <td className="px-2 py-3 text-center">{stat.bb}</td>
                    <td className="px-2 py-3 text-center">{(stat as any).hbp ?? '-'}</td>
                    <td className="px-2 py-3 text-center">{(stat as any).balk ?? '-'}</td>
                    <td className="px-2 py-3 text-center">{(stat as any).wp ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
