import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import BattingTable from './BattingTable'
import PitchingTable from './PitchingTable'
import DateRangeFilter from './DateRangeFilter'

function fmt(numerator: number, denominator: number, digits = 3): string {
  if (denominator === 0) return '-'
  const val = numerator / denominator
  return val.toFixed(digits).replace(/^0/, '')
}

function fmtOps(obp: number | null, slg: number | null): string {
  if (obp === null || slg === null) return '-'
  return (obp + slg).toFixed(3)
}

function ipToOuts(ip: number): number {
  const innings = Math.floor(ip)
  const outs = Math.round((ip - innings) * 10)
  return innings * 3 + outs
}

function sumIp(ips: number[]): { display: string; outs: number } {
  const totalOuts = ips.reduce((sum, ip) => sum + ipToOuts(ip), 0)
  const innings = Math.floor(totalOuts / 3)
  const rem = totalOuts % 3
  return { display: rem === 0 ? `${innings}` : `${innings}.${rem}`, outs: totalOuts }
}

function fmtEra(er: number, totalOuts: number): string {
  if (totalOuts === 0) return '-'
  return (er * 27 / totalOuts).toFixed(2)
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; year?: string; from?: string; to?: string }>
}) {
  const { tab, year, from, to } = await searchParams
  const showPitching = tab === 'pitching'
  const hasRange = Boolean(from || to)

  // 期間指定（from/to）が優先、なければ年度フィルター
  const matchesPeriod = (date?: string): boolean => {
    if (hasRange) {
      if (!date) return false
      if (from && date < from) return false
      if (to && date > to) return false
      return true
    }
    if (year) return Boolean(date?.startsWith(year))
    return true
  }

  const supabase = await createClient()

  const [{ data: players }, { data: battingStats }, { data: pitchingStats }, { data: allGames }, { data: settings }] = await Promise.all([
    supabase.from('players').select('*').order('number'),
    supabase.from('batting_stats').select('*, games(date, game_type)'),
    supabase.from('pitching_stats').select('*, games(date)'),
    supabase.from('games').select('id, date, game_type'),
    supabase.from('settings').select('qualified_pa').eq('id', 1).single(),
  ])

  const playerList = players ?? []
  const allBStats = battingStats ?? []
  const allPStats = pitchingStats ?? []

  // 利用可能な年度一覧
  const years = [...new Set([
    ...allBStats.map(s => (s.games as { date?: string } | null)?.date?.slice(0, 4)),
    ...allPStats.map(s => (s.games as { date?: string } | null)?.date?.slice(0, 4)),
  ].filter(Boolean))].sort().reverse() as string[]

  // 期間／年度フィルター
  const bStats = allBStats.filter(s => matchesPeriod((s.games as { date?: string } | null)?.date))
  const pStats = allPStats.filter(s => matchesPeriod((s.games as { date?: string } | null)?.date))

  // フィルター期間内の総試合数と規定打席閾値
  const filteredGames = (allGames ?? []).filter(g => matchesPeriod(g.date))
  const qualifiedPaRate = settings?.qualified_pa ?? 3.1
  type GameRow = { id: string; date: string; game_type?: string | null }
  const qualifiedPaThreshold = filteredGames.length * qualifiedPaRate
  const qualifiedPaThresholdOfficial = (filteredGames as GameRow[]).filter(g => g.game_type === 'official').length * qualifiedPaRate
  const qualifiedPaThresholdPractice = (filteredGames as GameRow[]).filter(g => g.game_type === 'practice').length * qualifiedPaRate

  // 打撃通算ヘルパー
  const buildBattingRows = (stats: typeof allBStats) => playerList.map(player => {
    const s = stats.filter(b => b.player_id === player.id)
    const games = s.length
    const pa = s.reduce((sum, b) => sum + (b.pa ?? 0), 0)
    const ab = s.reduce((sum, b) => sum + b.ab, 0)
    const hits = s.reduce((sum, b) => sum + b.hits, 0)
    const doubles = s.reduce((sum, b) => sum + b.doubles, 0)
    const triples = s.reduce((sum, b) => sum + b.triples, 0)
    const hr = s.reduce((sum, b) => sum + b.hr, 0)
    const rbi = s.reduce((sum, b) => sum + b.rbi, 0)
    const runs = s.reduce((sum, b) => sum + b.runs, 0)
    const sb = s.reduce((sum, b) => sum + b.sb, 0)
    const bb = s.reduce((sum, b) => sum + b.bb, 0)
    const hbp = s.reduce((sum, b) => sum + (b.hbp ?? 0), 0)
    const sac_fly = s.reduce((sum, b) => sum + (b.sac_fly ?? 0), 0)
    const sac_bunt = s.reduce((sum, b) => sum + (b.sac_bunt ?? 0), 0)
    const k = s.reduce((sum, b) => sum + b.k, 0)
    const gidp = s.reduce((sum, b) => sum + (b.gidp ?? 0), 0)
    const reach_on_error = s.reduce((sum, b) => sum + (b.reach_on_error ?? 0), 0)
    const errors = s.reduce((sum, b) => sum + (b.errors ?? 0), 0)
    const cs = s.reduce((sum, b) => sum + (b.cs ?? 0), 0)
    const risp_ab = s.reduce((sum, b) => sum + (b.risp_ab ?? 0), 0)
    const risp_hits = s.reduce((sum, b) => sum + (b.risp_hits ?? 0), 0)
    const tb = hits + doubles + 2 * triples + 3 * hr
    const obpDenom = ab + bb + hbp + sac_fly
    const obpNum = hits + bb + hbp
    const obp = obpDenom > 0 ? obpNum / obpDenom : null
    const slg = ab > 0 ? tb / ab : null
    return {
      player, games, pa, ab, hits, doubles, triples, hr, rbi, runs, sb,
      bb, hbp, sac_fly, sac_bunt, k, gidp, reach_on_error, errors, cs,
      risp_ab, risp_hits, tb,
      avg: fmt(hits, ab),
      obp: obpDenom > 0 ? fmt(obpNum, obpDenom) : '-',
      slg: ab > 0 ? fmt(tb, ab) : '-',
      ops: fmtOps(obp, slg),
      risp_avg: fmt(risp_hits, risp_ab),
    }
  })

  type BStatWithGameType = { date?: string; game_type?: string | null } | null
  const battingRows = buildBattingRows(bStats)
  const battingRowsOfficial = buildBattingRows(
    bStats.filter(s => (s.games as BStatWithGameType)?.game_type === 'official')
  ).filter(r => r.pa > 0)
  const battingRowsPractice = buildBattingRows(
    bStats.filter(s => (s.games as BStatWithGameType)?.game_type === 'practice')
  ).filter(r => r.pa > 0)

  // 投手通算（登板ありの選手のみ）
  const pitcherIds = [...new Set(pStats.map(p => p.player_id))]
  const pitchingRows = pitcherIds.map(pid => {
    const player = playerList.find(pl => pl.id === pid)
    const s = pStats.filter(p => p.player_id === pid)
    const appearances = s.length
    const wins = s.filter(p => p.is_win).length
    const holds = s.filter(p => (p as { is_hold?: boolean }).is_hold).length
    const saves = s.filter(p => (p as { is_save?: boolean }).is_save).length
    const losses = s.filter(p => p.is_loss).length
    const { display: ipDisplay, outs: totalOuts } = sumIp(s.map(p => p.ip ?? 0))
    const pitch_count = s.reduce((sum, p) => sum + ((p as { pitch_count?: number }).pitch_count ?? 0), 0)
    const runs = s.reduce((sum, p) => sum + ((p as { runs?: number }).runs ?? 0), 0)
    const er = s.reduce((sum, p) => sum + (p.er ?? 0), 0)
    const cg = s.filter(p => (p as { is_cg?: boolean }).is_cg).length
    const sho = s.filter(p => (p as { is_sho?: boolean }).is_sho).length
    const hits_allowed = s.reduce((sum, p) => sum + (p.hits_allowed ?? 0), 0)
    const hr_allowed = s.reduce((sum, p) => sum + (p.hr_allowed ?? 0), 0)
    const k = s.reduce((sum, p) => sum + (p.k ?? 0), 0)
    const bb = s.reduce((sum, p) => sum + (p.bb ?? 0), 0)
    const hbp = s.reduce((sum, p) => sum + ((p as { hbp?: number }).hbp ?? 0), 0)
    const balk = s.reduce((sum, p) => sum + ((p as { balk?: number }).balk ?? 0), 0)
    const wp = s.reduce((sum, p) => sum + ((p as { wp?: number }).wp ?? 0), 0)
    const wl = wins + losses
    return {
      player, appearances, wins, holds, saves, losses,
      winPct: wl > 0 ? (wins / wl).toFixed(3).replace(/^0/, '') : '-',
      era: fmtEra(er, totalOuts),
      ip: ipDisplay,
      pitch_count, runs, er, cg, sho,
      hits_allowed, hr_allowed, k, bb, hbp, balk, wp,
    }
  }).filter(r => r.player)

  // URLビルダー（tab・year・期間を組み合わせる）
  const buildUrl = (params: { tab?: string; year?: string; from?: string; to?: string }) => {
    const p = new URLSearchParams()
    if (params.tab) p.set('tab', params.tab)
    if (params.year) p.set('year', params.year)
    if (params.from) p.set('from', params.from)
    if (params.to) p.set('to', params.to)
    const s = p.toString()
    return s ? `/players?${s}` : '/players'
  }

  const chipCls = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm transition-all ${
      active
        ? 'bg-blue-950 text-white font-medium shadow'
        : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300'
    }`

  const tabCls = (active: boolean) =>
    `px-6 py-2 rounded-lg text-sm transition-all ${
      active
        ? 'bg-white text-blue-950 font-bold shadow'
        : 'text-gray-500 font-medium hover:text-gray-800'
    }`

  return (
    <div>
      <h1 className="mb-5 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-blue-700 to-blue-950" />
        選手成績
      </h1>

      {/* 年度フィルター */}
      {years.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-gray-500">年度：</span>
          <Link href={buildUrl({ tab: tab })} className={chipCls(!year && !hasRange)}>
            通算
          </Link>
          {years.map(y => (
            <Link key={y} href={buildUrl({ tab: tab, year: y })} className={chipCls(year === y && !hasRange)}>
              {y}
            </Link>
          ))}
        </div>
      )}

      {/* 期間指定フィルター */}
      <DateRangeFilter tab={tab} from={from} to={to} />

      {/* タブ */}
      <div className="mb-5 inline-flex rounded-xl bg-gray-200/70 p-1">
        <Link href={buildUrl({ year, from, to })} className={tabCls(!showPitching)}>
          打撃成績
        </Link>
        <Link href={buildUrl({ tab: 'pitching', year, from, to })} className={tabCls(showPitching)}>
          投手成績
        </Link>
      </div>

      {!showPitching ? (
        playerList.length === 0
          ? <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">選手データがありません</div>
          : <BattingTable
              rows={battingRows}
              rowsOfficial={battingRowsOfficial}
              rowsPractice={battingRowsPractice}
              qualifiedPaThreshold={qualifiedPaThreshold}
              qualifiedPaThresholdOfficial={qualifiedPaThresholdOfficial}
              qualifiedPaThresholdPractice={qualifiedPaThresholdPractice}
            />
      ) : (
        pitchingRows.length === 0
          ? <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">投手成績データがありません</div>
          : <PitchingTable rows={pitchingRows} />
      )}
    </div>
  )
}
