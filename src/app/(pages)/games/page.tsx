import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import RecentGamesSection from '@/components/RecentGamesSection'

export default async function GamesPage() {
  const supabase = await createClient()
  const games = await fetchAllRows((from, to) =>
    supabase.from('games').select('*').order('date', { ascending: false }).order('id').range(from, to)
  )
  const totalWins = games.filter(g => g.result === 'W').length
  const totalLosses = games.filter(g => g.result === 'L').length
  const totalDraws = games.filter(g => g.result === 'D').length
  const decided = totalWins + totalLosses
  const winPct = decided > 0 ? totalWins / decided : null

  const records = [
    { label: '勝', value: totalWins, color: 'text-amber-300' },
    { label: '敗', value: totalLosses, color: 'text-white' },
    { label: '分', value: totalDraws, color: 'text-white' },
  ]

  return (
    <div className="space-y-10">
      <h1 className="mb-0 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-blue-700 to-blue-950" />
        試合結果
      </h1>

      {/* 通算成績 */}
      <section className="relative overflow-hidden rounded-3xl bg-blue-950 text-white shadow-xl shadow-blue-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.4),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.18),transparent_50%)]" />
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[18px] border-white/5" />
        <div className="absolute -bottom-28 -left-12 h-72 w-72 rounded-full border-[22px] border-white/5" />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10 text-center">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.35em] text-amber-300">TEAM RECORD</p>

          <div className="mx-auto grid max-w-md grid-cols-3 gap-3 sm:gap-4">
            {records.map(r => (
              <div
                key={r.label}
                className="rounded-2xl bg-white/10 px-4 py-5 ring-1 ring-white/15 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1"
              >
                <div className={`text-4xl sm:text-5xl font-extrabold tabular-nums ${r.color}`}>{r.value}</div>
                <div className="mt-1.5 text-xs sm:text-sm text-blue-200">{r.label}</div>
              </div>
            ))}
          </div>

          {winPct !== null && (
            <div className="mx-auto mt-7 max-w-md">
              <div className="mb-2 flex items-center justify-between text-xs text-blue-200">
                <span className="tracking-widest">勝率</span>
                <span className="text-base font-bold tabular-nums text-amber-300">
                  {winPct.toFixed(3).replace(/^0/, '')}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                  style={{ width: `${Math.round(winPct * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <RecentGamesSection games={games} />
    </div>
  )
}
