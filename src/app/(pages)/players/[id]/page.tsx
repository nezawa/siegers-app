import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function fmt(n: number, d: number, digits = 3): string {
  if (d === 0) return '-'
  return (n / d).toFixed(digits).replace(/^0/, '')
}

function fmtOps(obp: number | null, slg: number | null): string {
  if (obp === null || slg === null) return '-'
  return (obp + slg).toFixed(3)
}

function ipToOuts(ip: number): number {
  return Math.floor(ip) * 3 + Math.round((ip - Math.floor(ip)) * 10)
}

function sumIp(ips: number[]): { display: string; outs: number } {
  const totalOuts = ips.reduce((s, ip) => s + ipToOuts(ip), 0)
  const rem = totalOuts % 3
  return { display: rem === 0 ? `${Math.floor(totalOuts / 3)}` : `${Math.floor(totalOuts / 3)}.${rem}`, outs: totalOuts }
}

function fmtEra(er: number, totalOuts: number): string {
  if (totalOuts === 0) return '-'
  return (er * 27 / totalOuts).toFixed(2)
}

function computeBatting(rows: Record<string, unknown>[]) {
  const games = rows.length
  const pa  = rows.reduce((s, b) => s + ((b.pa  as number) ?? 0), 0)
  const ab  = rows.reduce((s, b) => s + ((b.ab  as number) ?? 0), 0)
  const hits = rows.reduce((s, b) => s + ((b.hits as number) ?? 0), 0)
  const doubles = rows.reduce((s, b) => s + ((b.doubles as number) ?? 0), 0)
  const triples = rows.reduce((s, b) => s + ((b.triples as number) ?? 0), 0)
  const hr  = rows.reduce((s, b) => s + ((b.hr  as number) ?? 0), 0)
  const rbi = rows.reduce((s, b) => s + ((b.rbi as number) ?? 0), 0)
  const runs = rows.reduce((s, b) => s + ((b.runs as number) ?? 0), 0)
  const sb  = rows.reduce((s, b) => s + ((b.sb  as number) ?? 0), 0)
  const bb  = rows.reduce((s, b) => s + ((b.bb  as number) ?? 0), 0)
  const hbp = rows.reduce((s, b) => s + ((b.hbp as number) ?? 0), 0)
  const sac_fly  = rows.reduce((s, b) => s + ((b.sac_fly  as number) ?? 0), 0)
  const sac_bunt = rows.reduce((s, b) => s + ((b.sac_bunt as number) ?? 0), 0)
  const k   = rows.reduce((s, b) => s + ((b.k   as number) ?? 0), 0)
  const gidp = rows.reduce((s, b) => s + ((b.gidp as number) ?? 0), 0)
  const reach_on_error = rows.reduce((s, b) => s + ((b.reach_on_error as number) ?? 0), 0)
  const errors = rows.reduce((s, b) => s + ((b.errors as number) ?? 0), 0)
  const cs  = rows.reduce((s, b) => s + ((b.cs  as number) ?? 0), 0)
  const risp_ab   = rows.reduce((s, b) => s + ((b.risp_ab   as number) ?? 0), 0)
  const risp_hits = rows.reduce((s, b) => s + ((b.risp_hits as number) ?? 0), 0)
  const tb = hits + doubles + 2 * triples + 3 * hr
  const obpDenom = ab + bb + hbp + sac_fly
  const obpNum = hits + bb + hbp
  const obp = obpDenom > 0 ? obpNum / obpDenom : null
  const slg = ab > 0 ? tb / ab : null
  return {
    games, pa, ab, hits, doubles, triples, hr, rbi, runs, sb,
    bb, hbp, sac_fly, sac_bunt, k, gidp, reach_on_error, errors, cs, tb,
    avg: fmt(hits, ab),
    obp: obpDenom > 0 ? fmt(obpNum, obpDenom) : '-',
    slg: ab > 0 ? fmt(tb, ab) : '-',
    ops: fmtOps(obp, slg),
    risp_avg: fmt(risp_hits, risp_ab),
  }
}

function computePitching(rows: Record<string, unknown>[]) {
  const appearances = rows.length
  const wins   = rows.filter(p => p.is_win).length
  const holds  = rows.filter(p => p.is_hold).length
  const saves  = rows.filter(p => p.is_save).length
  const losses = rows.filter(p => p.is_loss).length
  const { display: ip, outs: totalOuts } = sumIp(rows.map(p => (p.ip as number) ?? 0))
  const pitch_count = rows.reduce((s, p) => s + ((p.pitch_count as number) ?? 0), 0)
  const runs = rows.reduce((s, p) => s + ((p.runs as number) ?? 0), 0)
  const er   = rows.reduce((s, p) => s + ((p.er   as number) ?? 0), 0)
  const cg   = rows.filter(p => p.is_cg).length
  const sho  = rows.filter(p => p.is_sho).length
  const hits_allowed = rows.reduce((s, p) => s + ((p.hits_allowed as number) ?? 0), 0)
  const hr_allowed   = rows.reduce((s, p) => s + ((p.hr_allowed   as number) ?? 0), 0)
  const k    = rows.reduce((s, p) => s + ((p.k    as number) ?? 0), 0)
  const bb   = rows.reduce((s, p) => s + ((p.bb   as number) ?? 0), 0)
  const hbp  = rows.reduce((s, p) => s + ((p.hbp  as number) ?? 0), 0)
  const balk = rows.reduce((s, p) => s + ((p.balk as number) ?? 0), 0)
  const wp   = rows.reduce((s, p) => s + ((p.wp   as number) ?? 0), 0)
  const wl = wins + losses
  return {
    appearances, wins, holds, saves, losses,
    winPct: wl > 0 ? (wins / wl).toFixed(3).replace(/^0/, '') : '-',
    era: fmtEra(er, totalOuts),
    ip, pitch_count, runs, er, cg, sho,
    hits_allowed, hr_allowed, k, bb, hbp, balk, wp,
  }
}

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: player }, rawBatting, rawPitching] = await Promise.all([
    supabase.from('players').select('*').eq('id', id).single(),
    fetchAllRows((from, to) => supabase.from('batting_stats').select('*, games(date)').eq('player_id', id).order('id').range(from, to)),
    fetchAllRows((from, to) => supabase.from('pitching_stats').select('*, games(date)').eq('player_id', id).order('id').range(from, to)),
  ])

  if (!player) notFound()

  const bStats = rawBatting as Record<string, unknown>[]
  const pStats = rawPitching as Record<string, unknown>[]

  const getYear = (row: Record<string, unknown>) =>
    ((row.games as { date?: string })?.date ?? '').slice(0, 4)

  const bYears = [...new Set(bStats.map(getYear).filter(Boolean))].sort().reverse()
  const pYears = [...new Set(pStats.map(getYear).filter(Boolean))].sort().reverse()

  const battingYearRows = bYears.map(year => ({
    label: year,
    ...computeBatting(bStats.filter(s => getYear(s) === year)),
  }))
  const battingTotal = bStats.length > 0 ? computeBatting(bStats) : null

  const pitchingYearRows = pYears.map(year => ({
    label: year,
    ...computePitching(pStats.filter(s => getYear(s) === year)),
  }))
  const pitchingTotal = pStats.length > 0 ? computePitching(pStats) : null

  const thCls = 'px-3 py-2.5 font-semibold text-white text-center whitespace-nowrap text-xs'
  const tdCls = 'px-3 py-3 text-center text-sm tabular-nums'
  const totalRowCls = 'bg-blue-50 font-semibold border-t-2 border-blue-200'

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
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-x-auto">
            <table className="text-sm border-collapse">
              <thead className="bg-band">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-white text-left whitespace-nowrap sticky left-0 bg-band text-xs">年度</th>
                  {['試合数','打率','打席','打数','安打','本塁打','打点','得点','盗塁','出塁率','長打率','得点圏打率','OPS','二塁打','三塁打','塁打数','三振','四球','死球','犠打','犠飛','併殺打','敵失','失策','盗塁阻止'].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {battingYearRows.map(r => (
                  <tr key={r.label} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-bold sticky left-0 bg-inherit whitespace-nowrap tabular-nums">{r.label}</td>
                    <td className={tdCls}>{r.games}</td>
                    <td className={`${tdCls} font-medium`}>{r.avg}</td>
                    <td className={tdCls}>{r.pa}</td>
                    <td className={tdCls}>{r.ab}</td>
                    <td className={tdCls}>{r.hits}</td>
                    <td className={tdCls}>{r.hr}</td>
                    <td className={tdCls}>{r.rbi}</td>
                    <td className={tdCls}>{r.runs}</td>
                    <td className={tdCls}>{r.sb}</td>
                    <td className={tdCls}>{r.obp}</td>
                    <td className={tdCls}>{r.slg}</td>
                    <td className={tdCls}>{r.risp_avg}</td>
                    <td className={`${tdCls} font-medium`}>{r.ops}</td>
                    <td className={tdCls}>{r.doubles}</td>
                    <td className={tdCls}>{r.triples}</td>
                    <td className={tdCls}>{r.tb}</td>
                    <td className={tdCls}>{r.k}</td>
                    <td className={tdCls}>{r.bb}</td>
                    <td className={tdCls}>{r.hbp}</td>
                    <td className={tdCls}>{r.sac_bunt}</td>
                    <td className={tdCls}>{r.sac_fly}</td>
                    <td className={tdCls}>{r.gidp}</td>
                    <td className={tdCls}>{r.reach_on_error}</td>
                    <td className={tdCls}>{r.errors}</td>
                    <td className={tdCls}>{r.cs}</td>
                  </tr>
                ))}
                <tr className={totalRowCls}>
                  <td className="px-4 py-3 sticky left-0 bg-blue-50 whitespace-nowrap text-sm font-bold text-blue-950">通算</td>
                  <td className={tdCls}>{battingTotal.games}</td>
                  <td className={`${tdCls} font-medium`}>{battingTotal.avg}</td>
                  <td className={tdCls}>{battingTotal.pa}</td>
                  <td className={tdCls}>{battingTotal.ab}</td>
                  <td className={tdCls}>{battingTotal.hits}</td>
                  <td className={tdCls}>{battingTotal.hr}</td>
                  <td className={tdCls}>{battingTotal.rbi}</td>
                  <td className={tdCls}>{battingTotal.runs}</td>
                  <td className={tdCls}>{battingTotal.sb}</td>
                  <td className={tdCls}>{battingTotal.obp}</td>
                  <td className={tdCls}>{battingTotal.slg}</td>
                  <td className={tdCls}>{battingTotal.risp_avg}</td>
                  <td className={`${tdCls} font-medium`}>{battingTotal.ops}</td>
                  <td className={tdCls}>{battingTotal.doubles}</td>
                  <td className={tdCls}>{battingTotal.triples}</td>
                  <td className={tdCls}>{battingTotal.tb}</td>
                  <td className={tdCls}>{battingTotal.k}</td>
                  <td className={tdCls}>{battingTotal.bb}</td>
                  <td className={tdCls}>{battingTotal.hbp}</td>
                  <td className={tdCls}>{battingTotal.sac_bunt}</td>
                  <td className={tdCls}>{battingTotal.sac_fly}</td>
                  <td className={tdCls}>{battingTotal.gidp}</td>
                  <td className={tdCls}>{battingTotal.reach_on_error}</td>
                  <td className={tdCls}>{battingTotal.errors}</td>
                  <td className={tdCls}>{battingTotal.cs}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 投手成績 */}
      {pitchingTotal && (
        <div>
          <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-gray-900">
            <span className="inline-block h-5 w-1.5 rounded-full bg-band" />
            投手成績
          </h2>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-x-auto">
            <table className="text-sm border-collapse">
              <thead className="bg-band">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-white text-left whitespace-nowrap sticky left-0 bg-band text-xs">年度</th>
                  {['登板','勝','H','S','敗','勝率','防御率','投球回','投球数','失点','自責点','完投','完封','被安打','被本塁打','奪三振','与四球','与死球','ボーク','暴投'].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pitchingYearRows.map(r => (
                  <tr key={r.label} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-bold sticky left-0 bg-inherit whitespace-nowrap tabular-nums">{r.label}</td>
                    <td className={tdCls}>{r.appearances}</td>
                    <td className={tdCls}>{r.wins}</td>
                    <td className={tdCls}>{r.holds}</td>
                    <td className={tdCls}>{r.saves}</td>
                    <td className={tdCls}>{r.losses}</td>
                    <td className={`${tdCls} font-medium`}>{r.winPct}</td>
                    <td className={`${tdCls} font-medium`}>{r.era}</td>
                    <td className={tdCls}>{r.ip}</td>
                    <td className={tdCls}>{r.pitch_count}</td>
                    <td className={tdCls}>{r.runs}</td>
                    <td className={tdCls}>{r.er}</td>
                    <td className={tdCls}>{r.cg}</td>
                    <td className={tdCls}>{r.sho}</td>
                    <td className={tdCls}>{r.hits_allowed}</td>
                    <td className={tdCls}>{r.hr_allowed}</td>
                    <td className={tdCls}>{r.k}</td>
                    <td className={tdCls}>{r.bb}</td>
                    <td className={tdCls}>{r.hbp}</td>
                    <td className={tdCls}>{r.balk}</td>
                    <td className={tdCls}>{r.wp}</td>
                  </tr>
                ))}
                <tr className={totalRowCls}>
                  <td className="px-4 py-3 sticky left-0 bg-blue-50 whitespace-nowrap text-sm font-bold text-blue-950">通算</td>
                  <td className={tdCls}>{pitchingTotal.appearances}</td>
                  <td className={tdCls}>{pitchingTotal.wins}</td>
                  <td className={tdCls}>{pitchingTotal.holds}</td>
                  <td className={tdCls}>{pitchingTotal.saves}</td>
                  <td className={tdCls}>{pitchingTotal.losses}</td>
                  <td className={`${tdCls} font-medium`}>{pitchingTotal.winPct}</td>
                  <td className={`${tdCls} font-medium`}>{pitchingTotal.era}</td>
                  <td className={tdCls}>{pitchingTotal.ip}</td>
                  <td className={tdCls}>{pitchingTotal.pitch_count}</td>
                  <td className={tdCls}>{pitchingTotal.runs}</td>
                  <td className={tdCls}>{pitchingTotal.er}</td>
                  <td className={tdCls}>{pitchingTotal.cg}</td>
                  <td className={tdCls}>{pitchingTotal.sho}</td>
                  <td className={tdCls}>{pitchingTotal.hits_allowed}</td>
                  <td className={tdCls}>{pitchingTotal.hr_allowed}</td>
                  <td className={tdCls}>{pitchingTotal.k}</td>
                  <td className={tdCls}>{pitchingTotal.bb}</td>
                  <td className={tdCls}>{pitchingTotal.hbp}</td>
                  <td className={tdCls}>{pitchingTotal.balk}</td>
                  <td className={tdCls}>{pitchingTotal.wp}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!battingTotal && !pitchingTotal && (
        <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">
          成績データがありません
        </div>
      )}
    </div>
  )
}
