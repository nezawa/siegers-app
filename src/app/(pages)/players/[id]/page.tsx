import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import { computeBatting, computePitching, type BattingTotals, type PitchingTotals } from '@/lib/stats'
import { battingRanks, pitchingRanks, type RankMap } from '@/lib/ranking'
import { rankBgClass } from '@/lib/rankStyle'
import RankLegend from '@/components/RankLegend'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// 表示列の定義。key を lib/ranking.ts の指標キーと揃えることで順位バッジと紐付ける
type Col<T> = { header: string; key: string; get: (t: T) => string | number; bold?: boolean }

const BATTING_COLS: Col<BattingTotals>[] = [
  { header: '試合数', key: 'games', get: t => t.games },
  { header: '打率', key: 'avg', get: t => t.avg, bold: true },
  { header: '打席', key: 'pa', get: t => t.pa },
  { header: '打数', key: 'ab', get: t => t.ab },
  { header: '安打', key: 'hits', get: t => t.hits },
  { header: '本塁打', key: 'hr', get: t => t.hr },
  { header: '打点', key: 'rbi', get: t => t.rbi },
  { header: '得点', key: 'runs', get: t => t.runs },
  { header: '盗塁', key: 'sb', get: t => t.sb },
  { header: '出塁率', key: 'obp', get: t => t.obp },
  { header: '長打率', key: 'slg', get: t => t.slg },
  { header: '得点圏打率', key: 'risp_avg', get: t => t.risp_avg },
  { header: 'OPS', key: 'ops', get: t => t.ops, bold: true },
  { header: '二塁打', key: 'doubles', get: t => t.doubles },
  { header: '三塁打', key: 'triples', get: t => t.triples },
  { header: '塁打数', key: 'tb', get: t => t.tb },
  { header: '三振', key: 'k', get: t => t.k },
  { header: '四球', key: 'bb', get: t => t.bb },
  { header: '死球', key: 'hbp', get: t => t.hbp },
  { header: '犠打', key: 'sac_bunt', get: t => t.sac_bunt },
  { header: '犠飛', key: 'sac_fly', get: t => t.sac_fly },
  { header: '併殺打', key: 'gidp', get: t => t.gidp },
  { header: '敵失', key: 'reach_on_error', get: t => t.reach_on_error },
  { header: '失策', key: 'errors', get: t => t.errors },
  { header: '盗塁阻止', key: 'cs', get: t => t.cs },
]

const PITCHING_COLS: Col<PitchingTotals>[] = [
  { header: '登板', key: 'appearances', get: t => t.appearances },
  { header: '勝', key: 'wins', get: t => t.wins },
  { header: 'H', key: 'holds', get: t => t.holds },
  { header: 'S', key: 'saves', get: t => t.saves },
  { header: '敗', key: 'losses', get: t => t.losses },
  { header: '勝率', key: 'winPct', get: t => t.winPct, bold: true },
  { header: '防御率', key: 'era', get: t => t.era, bold: true },
  { header: '投球回', key: 'ip', get: t => t.ip },
  { header: '投球数', key: 'pitch_count', get: t => t.pitch_count },
  { header: '失点', key: 'runs', get: t => t.runs },
  { header: '自責点', key: 'er', get: t => t.er },
  { header: '完投', key: 'cg', get: t => t.cg },
  { header: '完封', key: 'sho', get: t => t.sho },
  { header: '被安打', key: 'hits_allowed', get: t => t.hits_allowed },
  { header: '被本塁打', key: 'hr_allowed', get: t => t.hr_allowed },
  { header: '奪三振', key: 'k', get: t => t.k },
  { header: '与四球', key: 'bb', get: t => t.bb },
  { header: '与死球', key: 'hbp', get: t => t.hbp },
  { header: 'ボーク', key: 'balk', get: t => t.balk },
  { header: '暴投', key: 'wp', get: t => t.wp },
]

const thCls = 'px-3 py-2.5 font-semibold text-white text-center whitespace-nowrap text-xs'
const tdCls = 'px-3 py-3 text-center text-sm tabular-nums'

type StatRow<T> = { label: string; totals: T; ranks: RankMap }

function StatTable<T>({
  cols,
  yearRows,
  total,
}: {
  cols: Col<T>[]
  yearRows: StatRow<T>[]
  total: StatRow<T>
}) {
  const renderCells = (row: StatRow<T>) =>
    cols.map(col => {
      return (
        <td key={col.key} className={`${tdCls}${col.bold ? ' font-medium' : ''}${rankBgClass(row.ranks[col.key])}`}>
          {col.get(row.totals)}
        </td>
      )
    })

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-x-auto">
      <table className="text-sm border-collapse">
        <thead className="bg-band">
          <tr>
            <th className="px-4 py-2.5 font-semibold text-white text-left whitespace-nowrap sticky left-0 bg-band text-xs">年度</th>
            {cols.map(col => (
              <th key={col.key} className={thCls}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {yearRows.map(row => (
            <tr key={row.label} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
              <td className="px-4 py-3 font-bold sticky left-0 bg-inherit whitespace-nowrap tabular-nums">{row.label}</td>
              {renderCells(row)}
            </tr>
          ))}
          <tr className="bg-blue-50 font-semibold border-t-2 border-blue-200">
            <td className="px-4 py-3 sticky left-0 bg-blue-50 whitespace-nowrap text-sm font-bold text-blue-950">通算</td>
            {renderCells(total)}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 順位の判定にはチーム全員の成績が必要なので、成績は全件取得してから自分の分を絞り込む
  const [{ data: player }, allBatting, allPitching, allGames, { data: settings }] = await Promise.all([
    supabase.from('players').select('*').eq('id', id).single(),
    fetchAllRows((from, to) => supabase.from('batting_stats').select('*, games(date)').order('id').range(from, to)),
    fetchAllRows((from, to) => supabase.from('pitching_stats').select('*, games(date)').order('id').range(from, to)),
    fetchAllRows((from, to) => supabase.from('games').select('id, date').order('id').range(from, to)),
    supabase.from('settings').select('qualified_pa, qualified_ip').eq('id', 1).single(),
  ])

  if (!player) notFound()

  const allB = allBatting as Record<string, unknown>[]
  const allP = allPitching as Record<string, unknown>[]

  const getYear = (row: Record<string, unknown>) =>
    ((row.games as { date?: string })?.date ?? '').slice(0, 4)

  const bStats = allB.filter(s => s.player_id === id)
  const pStats = allP.filter(s => s.player_id === id)

  // 規定打席・規定投球回の閾値は「その年度の試合数 × 倍率」。通算は全試合数で計算する
  const qualifiedPaRate = settings?.qualified_pa ?? 3.1
  const qualifiedIpRate = settings?.qualified_ip ?? 1.0
  const gameCount = (year: string | null) =>
    year
      ? (allGames as { date: string }[]).filter(g => g.date?.startsWith(year)).length
      : allGames.length
  const paThreshold = (year: string | null) => gameCount(year) * qualifiedPaRate
  const outsThreshold = (year: string | null) => gameCount(year) * qualifiedIpRate * 3

  const bYears = [...new Set(bStats.map(getYear).filter(Boolean))].sort().reverse()
  const pYears = [...new Set(pStats.map(getYear).filter(Boolean))].sort().reverse()

  const battingYearRows = bYears.map(year => {
    const scope = allB.filter(s => getYear(s) === year)
    return {
      label: year,
      totals: computeBatting(bStats.filter(s => getYear(s) === year)),
      ranks: battingRanks(scope, id, paThreshold(year)),
    }
  })
  const battingTotal = bStats.length > 0
    ? { label: '通算', totals: computeBatting(bStats), ranks: battingRanks(allB, id, paThreshold(null)) }
    : null

  const pitchingYearRows = pYears.map(year => {
    const scope = allP.filter(s => getYear(s) === year)
    return {
      label: year,
      totals: computePitching(pStats.filter(s => getYear(s) === year)),
      ranks: pitchingRanks(scope, id, outsThreshold(year)),
    }
  })
  const pitchingTotal = pStats.length > 0
    ? { label: '通算', totals: computePitching(pStats), ranks: pitchingRanks(allP, id, outsThreshold(null)) }
    : null

  return (
    <div className="space-y-8">
      <div>
        <Link href="/players" className="inline-flex items-center gap-1 text-sm text-blue-700 transition-colors hover:text-blue-900 hover:underline">
          ← 選手成績一覧
        </Link>
      </div>

      {/* 選手ヘッダー */}
      <div className="relative overflow-hidden rounded-3xl bg-band text-white shadow-xl shadow-blue-950/20">
        <div className="relative flex items-center gap-5 p-6 sm:p-8">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 text-3xl sm:text-4xl font-extrabold italic tabular-nums text-amber-300">
            {player.number ?? '-'}
          </div>
          <div>
            <p className="text-[10px] tracking-[0.3em] text-white/80">PLAYER</p>
            <h1 className="mt-0.5 text-2xl sm:text-3xl font-extrabold">{player.name}</h1>
            {player.notes && <p className="mt-1 text-sm text-white/85">{player.notes}</p>}
          </div>
        </div>
      </div>

      {/* 打撃成績 */}
      {battingTotal && (
        <div>
          <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-gray-900">
            <span className="inline-block h-5 w-1.5 rounded-full bg-band" />
            打撃成績
          </h2>
          <StatTable cols={BATTING_COLS} yearRows={battingYearRows} total={battingTotal} />
        </div>
      )}

      {/* 投手成績 */}
      {pitchingTotal && (
        <div>
          <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-gray-900">
            <span className="inline-block h-5 w-1.5 rounded-full bg-band" />
            投手成績
          </h2>
          <StatTable cols={PITCHING_COLS} yearRows={pitchingYearRows} total={pitchingTotal} />
        </div>
      )}

      {(battingTotal || pitchingTotal) && <RankLegend />}

      {!battingTotal && !pitchingTotal && (
        <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">
          成績データがありません
        </div>
      )}
    </div>
  )
}
