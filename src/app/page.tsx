import { createClient } from '@/lib/supabase/server'
import RecentGamesSection from '@/components/RecentGamesSection'

export default async function TopPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('games').select('*').order('date', { ascending: false })
  const games = data ?? []
  const totalWins = games.filter(g => g.result === 'W').length
  const totalLosses = games.filter(g => g.result === 'L').length
  const totalDraws = games.filter(g => g.result === 'D').length

  return (
    <div className="space-y-8">
      <div className="bg-blue-900 text-white rounded-xl p-6 sm:p-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">⚾ Siegers</h1>
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

      <RecentGamesSection games={games} />
    </div>
  )
}
