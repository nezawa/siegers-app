import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import Link from 'next/link'
import BattingTable from './BattingTable'
import PitchingTable from './PitchingTable'
import TeamTable from './TeamTable'
import FilterPanel from './FilterPanel'

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

function outsToIp(outs: number): string {
  const inn = Math.floor(outs / 3)
  const rem = outs % 3
  return rem === 0 ? `${inn}` : `${inn}.${rem}`
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; year?: string; from?: string; to?: string; gtype?: string; q?: string; tournament?: string; opponent?: string }>
}) {
  const { tab, year, from, to, gtype, q, tournament, opponent } = await searchParams
  const showPitching = tab === 'pitching'
  const showTeam = tab === 'team'
  const hasRange = Boolean(from || to)
  const gtypeFilter = gtype === 'official' || gtype === 'practice' ? gtype : null
  const tournamentFilter = tournament || null
  const opponentFilter = opponent || null
  const qualifiedOnly = q === '1'

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

  const [{ data: players }, allBStats, allPStats, allGames, { data: settings }] = await Promise.all([
    supabase.from('players').select('*').order('number'),
    fetchAllRows((from, to) => supabase.from('batting_stats').select('*, games(date, game_type, tournament, opponent)').order('id').range(from, to)),
    fetchAllRows((from, to) => supabase.from('pitching_stats').select('*, games(date, game_type, tournament, opponent)').order('id').range(from, to)),
    fetchAllRows((from, to) => supabase.from('games').select('id, date, game_type, tournament, opponent, score_us, score_them, result').order('id').range(from, to)),
    supabase.from('settings').select('qualified_pa, qualified_ip').eq('id', 1).single(),
  ])

  const playerList = players ?? []

  // 利用可能な年度一覧
  const years = [...new Set([
    ...allBStats.map(s => (s.games as { date?: string } | null)?.date?.slice(0, 4)),
    ...allPStats.map(s => (s.games as { date?: string } | null)?.date?.slice(0, 4)),
  ].filter(Boolean))].sort().reverse() as string[]

  // 期間／年度フィルター
  const bStats = allBStats.filter(s => matchesPeriod((s.games as { date?: string } | null)?.date))
  const pStats = allPStats.filter(s => matchesPeriod((s.games as { date?: string } | null)?.date))

  // 試合の属性（種別・大会名・対戦相手）による絞り込み
  type GameAttrs = { game_type?: string | null; tournament?: string | null; opponent?: string | null } | null
  const matchesGameAttrs = (g: GameAttrs): boolean =>
    (!gtypeFilter || g?.game_type === gtypeFilter) &&
    (!tournamentFilter || g?.tournament === tournamentFilter) &&
    (!opponentFilter || g?.opponent === opponentFilter)
  const attrFilterActive = Boolean(gtypeFilter || tournamentFilter || opponentFilter)

  // 絞り込みの選択肢（実際に試合があるものだけ）
  const tournaments = [...new Set(allGames.map(g => g.tournament).filter(Boolean))].sort() as string[]
  const opponents = [...new Set(allGames.map(g => g.opponent).filter(Boolean))].sort() as string[]

  // フィルター（期間＋試合属性）適用後の試合数と規定値の閾値
  const filteredGames = allGames.filter(g => matchesPeriod(g.date))
  type GameRow = { id: string; date: string; game_type?: string | null; tournament?: string | null; opponent?: string | null }
  const activeGames = attrFilterActive
    ? (filteredGames as GameRow[]).filter(g => matchesGameAttrs(g))
    : filteredGames
  const qualifiedPaRate = settings?.qualified_pa ?? 3.1
  const qualifiedPaThreshold = activeGames.length * qualifiedPaRate

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

  const bStatsActive = attrFilterActive
    ? bStats.filter(s => matchesGameAttrs(s.games as GameAttrs))
    : bStats
  let battingRows = buildBattingRows(bStatsActive)
  if (attrFilterActive) battingRows = battingRows.filter(r => r.pa > 0)
  if (qualifiedOnly) battingRows = battingRows.filter(r => r.pa >= qualifiedPaThreshold)

  // 投球回の規定値（アウト換算）
  const qualifiedIpRate = settings?.qualified_ip ?? 1.0
  const qualifiedIpThresholdOuts = activeGames.length * qualifiedIpRate * 3

  // 投手通算ヘルパー
  const buildPitchingRows = (stats: typeof allPStats) => {
    const ids = [...new Set(stats.map(p => p.player_id))]
    return ids.map(pid => {
      const player = playerList.find(pl => pl.id === pid)
      const s = stats.filter(p => p.player_id === pid)
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
        player, appearances, wins, holds, saves, losses, totalOuts,
        winPct: wl > 0 ? (wins / wl).toFixed(3).replace(/^0/, '') : '-',
        era: fmtEra(er, totalOuts),
        ip: ipDisplay,
        pitch_count, runs, er, cg, sho,
        hits_allowed, hr_allowed, k, bb, hbp, balk, wp,
      }
    }).filter(r => r.player)
  }

  const pStatsActive = attrFilterActive
    ? pStats.filter(s => matchesGameAttrs(s.games as GameAttrs))
    : pStats
  let pitchingRows = buildPitchingRows(pStatsActive)
  if (qualifiedOnly) pitchingRows = pitchingRows.filter(r => r.totalOuts >= qualifiedIpThresholdOuts)

  // チーム成績（年度別＋通算）。結果未確定の試合（未消化のスケジュール登録）は除外
  type PlayedGame = GameRow & { score_us: number; score_them: number; result: string | null }
  const playedGames = (allGames as PlayedGame[]).filter(g => g.result != null)

  const makeTeamRow = (label: string, gs: PlayedGame[]) => {
    const ids = new Set(gs.map(g => g.id))
    const bs = allBStats.filter(s => ids.has(s.game_id))
    const ps = allPStats.filter(s => ids.has(s.game_id))
    const w = gs.filter(g => g.result === 'W').length
    const l = gs.filter(g => g.result === 'L').length
    const d = gs.filter(g => g.result === 'D').length
    const hits = bs.reduce((sum, b) => sum + (b.hits ?? 0), 0)
    const ab = bs.reduce((sum, b) => sum + (b.ab ?? 0), 0)
    const er = ps.reduce((sum, p) => sum + (p.er ?? 0), 0)
    return {
      label,
      games: gs.length, w, l, d,
      winPct: fmt(w, w + l),
      runsFor: gs.reduce((sum, g) => sum + (g.score_us ?? 0), 0),
      runsAgainst: gs.reduce((sum, g) => sum + (g.score_them ?? 0), 0),
      avg: fmt(hits, ab),
      hr: bs.reduce((sum, b) => sum + (b.hr ?? 0), 0),
      sb: bs.reduce((sum, b) => sum + (b.sb ?? 0), 0),
      era: fmtEra(er, sumIp(ps.map(p => p.ip ?? 0)).outs),
    }
  }

  const buildTeamDataset = (gs: PlayedGame[]) => {
    const ys = [...new Set(gs.map(g => g.date.slice(0, 4)))].sort().reverse()
    return {
      rows: ys.map(y => makeTeamRow(y, gs.filter(g => g.date.startsWith(y)))),
      total: gs.length > 0 ? makeTeamRow('通算', gs) : null,
    }
  }

  const teamData = buildTeamDataset(
    playedGames.filter(g => matchesPeriod(g.date) && matchesGameAttrs(g))
  )

  // URLビルダー（tab・year・期間・絞り込みを組み合わせる）
  const buildUrl = (params: { tab?: string; year?: string; from?: string; to?: string; gtype?: string | null; q?: string; tournament?: string | null; opponent?: string | null }) => {
    const p = new URLSearchParams()
    if (params.tab) p.set('tab', params.tab)
    if (params.year) p.set('year', params.year)
    if (params.from) p.set('from', params.from)
    if (params.to) p.set('to', params.to)
    if (params.gtype) p.set('gtype', params.gtype)
    if (params.q) p.set('q', params.q)
    if (params.tournament) p.set('tournament', params.tournament)
    if (params.opponent) p.set('opponent', params.opponent)
    const s = p.toString()
    return s ? `/players?${s}` : '/players'
  }

  const tabCls = (active: boolean) =>
    `block py-3 text-center text-sm sm:text-base font-bold transition-colors ${
      active
        ? 'bg-band text-white'
        : 'bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 hover:text-gray-800'
    }`

  return (
    <div>
      <h1 className="mb-5 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
        成績
      </h1>

      {/* フィルター（タブの上に配置） */}
      <div className="mb-5 space-y-2">
        <FilterPanel
          tab={tab} year={year} from={from} to={to} gtype={gtype} q={q}
          tournament={tournament} opponent={opponent}
          years={years} tournaments={tournaments} opponents={opponents}
          qualifiedLabel={showTeam ? undefined : showPitching ? '規定投球回のみ' : '規定打席のみ'}
        />
        {qualifiedOnly && !showTeam && (
          <p className="pl-1 text-xs text-gray-400">
            {showPitching
              ? `${outsToIp(Math.ceil(qualifiedIpThresholdOuts))}回以上`
              : `${Math.ceil(qualifiedPaThreshold)}打席以上`}
          </p>
        )}
      </div>

      {/* タブ（成績表と一体のデザイン） */}
      <div className="grid grid-cols-3 gap-1 border-b-4 border-band">
        <Link href={buildUrl({ tab: 'team', year, from, to, gtype, q, tournament, opponent })} className={tabCls(showTeam)}>
          チーム成績
        </Link>
        <Link href={buildUrl({ year, from, to, gtype, q, tournament, opponent })} className={tabCls(!showPitching && !showTeam)}>
          打撃成績
        </Link>
        <Link href={buildUrl({ tab: 'pitching', year, from, to, gtype, q, tournament, opponent })} className={tabCls(showPitching)}>
          投手成績
        </Link>
      </div>

      {showTeam ? (
        <TeamTable data={teamData} />
      ) : !showPitching ? (
        playerList.length === 0
          ? <div className="rounded-b-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">選手データがありません</div>
          : <BattingTable rows={battingRows} />
      ) : (
        pitchingRows.length === 0
          ? <div className="rounded-b-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">投手成績データがありません</div>
          : <PitchingTable rows={pitchingRows} />
      )}
    </div>
  )
}
