import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import { fmt, fmtEra, sumIp, outsToIp, computeBatting, computePitching } from '@/lib/stats'
import { fetchLastUpdated } from '@/lib/lastUpdated'
import { battingRanksAll, pitchingRanksAll } from '@/lib/ranking'
import { buildMilestones, findAchievements, MILESTONE_ORDER } from '@/lib/milestones'
import { buildSeasonRecords } from '@/lib/seasonRecords'
import { buildStreakRecords } from '@/lib/streaks'
import Link from 'next/link'
import BattingTable from './BattingTable'
import PitchingTable from './PitchingTable'
import TeamTable from './TeamTable'
import RecordsRoom, { type RecordSection, type AchievedRow, type SeasonRecordRow, type StreakRow } from './RecordsRoom'
import FilterPanel from './FilterPanel'
import { resolveYear, resolveGtype, isGameType, FALLBACK_YEAR, FALLBACK_GTYPE } from './filterDefaults'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '選手成績' }

// 通算記録室に載せる「達成まで残り◯以内」の閾値（投球回はイニング数）
const RECORD_WITHIN = 15
// 通算記録室の1カードに出す人数（閾値外の人も、同じ記録を目指す近い順に埋める）
const RECORD_CARD_SIZE = 3

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; year?: string; from?: string; to?: string; gtype?: string; q?: string; tournament?: string; opponent?: string; ryear?: string }>
}) {
  const { tab, year, from, to, gtype, q, tournament, opponent, ryear } = await searchParams
  const showPitching = tab === 'pitching'
  const showTeam = tab === 'team'
  const showRecords = tab === 'records'
  const hasRange = Boolean(from || to)
  const tournamentFilter = tournament || null
  const opponentFilter = opponent || null
  // 規定打席・規定投球回での絞り込みは既定でON。外したときだけ URL に q=0 が付く
  const qualifiedOnly = q !== '0'

  const supabase = await createClient()

  const [{ data: players }, allBStats, allPStats, allGames, { data: settings }, lastUpdated] = await Promise.all([
    supabase.from('players').select('*').order('number'),
    fetchAllRows((from, to) => supabase.from('batting_stats').select('*, games(date, game_type, tournament, opponent)').order('id').range(from, to)),
    fetchAllRows((from, to) => supabase.from('pitching_stats').select('*, games(date, game_type, tournament, opponent)').order('id').range(from, to)),
    fetchAllRows((from, to) => supabase.from('games').select('id, date, game_type, tournament, opponent, score_us, score_them, result').order('id').range(from, to)),
    supabase.from('settings').select('*').eq('id', 1).single(),
    fetchLastUpdated(),
  ])

  const playerList = players ?? []

  // 絞り込みの既定値（管理画面の設定 → settings テーブル）。
  // add_settings_stats_defaults.sql が未実行なら列が無いので、従来どおり通算・全試合になる
  const settingsYear: string | null =
    typeof settings?.default_stats_year === 'string' ? settings.default_stats_year : FALLBACK_YEAR
  // チーム成績は年度別の行を並べて比べる表なので、既定では年度で絞らず全年を出す
  const defaultYear = showTeam ? null : settingsYear
  const defaultGtype = isGameType(settings?.default_stats_game_type)
    ? settings.default_stats_game_type
    : FALLBACK_GTYPE

  // URL に year / gtype が無いときは既定値を適用する。'all' を載せたときだけ解除
  const yearFilter = resolveYear(year, defaultYear)
  const gtypeFilter = resolveGtype(gtype, defaultGtype)

  // 期間指定（from/to）が優先、なければ年度フィルター
  const matchesPeriod = (date?: string): boolean => {
    if (hasRange) {
      if (!date) return false
      if (from && date < from) return false
      if (to && date > to) return false
      return true
    }
    if (yearFilter) return Boolean(date?.startsWith(yearFilter))
    return true
  }

  // 利用可能な年度一覧。既定年度はまだ成績が無くても選択肢に残す
  // （選択肢に無いとプルダウンの表示が空になるため）
  const years = [...new Set([
    settingsYear,
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

  // 打撃通算ヘルパー。順位は「いま表示している絞り込み結果の中での順位」
  const buildBattingRows = (stats: typeof allBStats, ranks: Record<string, Record<string, number>>) =>
    playerList.map(player => ({
      player,
      ...computeBatting(stats.filter(b => b.player_id === player.id)),
      ranks: ranks[player.id] ?? {},
    }))

  const bStatsActive = attrFilterActive
    ? bStats.filter(s => matchesGameAttrs(s.games as GameAttrs))
    : bStats
  let battingRows = buildBattingRows(bStatsActive, battingRanksAll(bStatsActive, qualifiedPaThreshold))
  if (attrFilterActive) battingRows = battingRows.filter(r => r.pa > 0)
  if (qualifiedOnly) battingRows = battingRows.filter(r => r.pa >= qualifiedPaThreshold)

  // 投球回の規定値（アウト換算）
  const qualifiedIpRate = settings?.qualified_ip ?? 1.0
  const qualifiedIpThresholdOuts = activeGames.length * qualifiedIpRate * 3

  // 投手通算ヘルパー。順位は「いま表示している絞り込み結果の中での順位」
  const buildPitchingRows = (stats: typeof allPStats) => {
    const ranks = pitchingRanksAll(stats, qualifiedIpThresholdOuts)
    // 登板のある選手だけを、打撃成績と同じ背番号順（playerList の並び）で出す
    const pitched = new Set(stats.map(p => p.player_id))
    return playerList
      .filter(player => pitched.has(player.id))
      .map(player => ({
        player,
        ...computePitching(stats.filter(p => p.player_id === player.id)),
        ranks: ranks[player.id] ?? {},
      }))
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
    // その他（中止・没収など）。試合数には含めるが勝敗・勝率には数えない
    const o = gs.filter(g => g.result === 'O').length
    const hits = bs.reduce((sum, b) => sum + (b.hits ?? 0), 0)
    const ab = bs.reduce((sum, b) => sum + (b.ab ?? 0), 0)
    const er = ps.reduce((sum, p) => sum + (p.er ?? 0), 0)
    return {
      label,
      games: gs.length, w, l, d, o,
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

  // 通算記録室。通算の記録なので絞り込み条件は使わず、全試合の成績から計算する
  const buildRecordSections = (): RecordSection[] => {
    const perPlayer = playerList.map(player => {
      const bs = allBStats.filter(s => s.player_id === player.id)
      const ps = allPStats.filter(s => s.player_id === player.id)
      return {
        player,
        milestones: buildMilestones(
          bs.length > 0 ? computeBatting(bs) : null,
          ps.length > 0 ? computePitching(ps) : null,
        ),
      }
    })

    // 同じ記録でも目標が違えば（50安打と100安打など）別のカードにする。
    // ここでは閾値で絞らず全員を集め、最後に「閾値以内の人がいるカード」だけを残す
    const map = new Map<string, RecordSection & { order: number; targetValue: number }>()
    for (const { player, milestones } of perPlayer) {
      for (const m of milestones) {
        const id = `${m.key}-${m.targetValue}`
        let sec = map.get(id)
        if (!sec) {
          sec = {
            key: id,
            title: m.title,
            achievedCount: perPlayer.filter(q =>
              q.milestones.some(x => x.key === m.key && x.value >= m.targetValue)
            ).length,
            candidates: [],
            order: MILESTONE_ORDER.indexOf(m.key),
            targetValue: m.targetValue,
          }
          map.set(id, sec)
        }
        sec.candidates.push({
          playerId: player.id, name: player.name,
          current: m.current, remaining: m.remaining, remainingValue: m.remainingValue, progress: m.progress,
        })
      }
    }

    // 記録の定義順 → 目標の大きい順。各カードの中は残りが少ない順
    return [...map.values()]
      .filter(sec => sec.candidates.some(c => c.remainingValue <= RECORD_WITHIN))
      .sort((a, b) => a.order - b.order || b.targetValue - a.targetValue)
      .map(({ key, title, achievedCount, candidates }) => ({
        key,
        title,
        achievedCount,
        candidates: candidates.sort((a, b) => a.remainingValue - b.remainingValue).slice(0, RECORD_CARD_SIZE),
      }))
  }
  const recordSections = showRecords ? buildRecordSections() : []

  // 達成済みの記録（年度別）。ryear が無いときは最新の年度、'all' なら全年度
  const playerById = new Map(playerList.map(p => [p.id, p]))
  const achievements: AchievedRow[] = showRecords
    ? findAchievements(allBStats, allPStats).flatMap(a => {
        const player = playerById.get(a.playerId)
        return player ? [{ ...a, name: player.name }] : []
      })
    : []
  const achievedYears = [...new Set(achievements.map(a => a.date.slice(0, 4)).filter(Boolean))].sort().reverse()
  const achievedYear = ryear === 'all' ? null : ryear && achievedYears.includes(ryear) ? ryear : achievedYears[0] ?? null
  const achievedRows = achievedYear ? achievements.filter(a => a.date.startsWith(achievedYear)) : achievements

  // 歴代シーズン記録（公式戦のみ）。規定はその年の公式戦の試合数 × 倍率
  const officialGamesInYear = (y: string) =>
    (allGames as GameRow[]).filter(g => g.game_type === 'official' && g.date?.startsWith(y)).length
  const seasonRecords = showRecords
    ? buildSeasonRecords(allBStats, allPStats, officialGamesInYear, qualifiedPaRate, qualifiedIpRate)
    : { batting: [], pitching: [] }
  const withNames = (records: typeof seasonRecords.batting): SeasonRecordRow[] =>
    records.map(r => ({
      ...r,
      holders: r.holders.flatMap(h => {
        const player = playerById.get(h.playerId)
        return player ? [{ ...h, name: player.name }] : []
      }),
    }))

  // 連続試合記録（公式戦のみ）
  const streakRows: StreakRow[] = showRecords
    ? buildStreakRecords(allBStats, allPStats, playedGames.filter(g => g.game_type === 'official')).map(r => ({
        ...r,
        holders: r.holders.flatMap(h => {
          const player = playerById.get(h.playerId)
          return player ? [{ ...h, name: player.name }] : []
        }),
      }))
    : []

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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900">
          <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
          成績
        </h1>
        {lastUpdated && (
          <p className="text-xs text-gray-400">成績データ更新：{lastUpdated}</p>
        )}
      </div>

      {/* フィルター（タブの上に配置）。通算記録室は絞り込みを使わないので出さない */}
      {!showRecords && <div className="mb-5 space-y-2">
        {/* key に適用済みの条件を含めることで、タブ切替やブラウザバックのたびに
            FilterPanel を再マウントし、入力欄を URL の内容へ確実に戻す */}
        <FilterPanel
          key={[tab, year, from, to, gtype, q, tournament, opponent].join('|')}
          tab={tab} year={year} from={from} to={to} gtype={gtype} q={q}
          tournament={tournament} opponent={opponent}
          defaultYear={defaultYear} defaultGtype={defaultGtype}
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
      </div>}

      {/* タブ（成績表と一体のデザイン） */}
      <div className="grid grid-cols-4 gap-1 overflow-hidden rounded-t-2xl border-b-4 border-band">
        <Link href={buildUrl({ tab: 'team', from, to, gtype, q, tournament, opponent })} className={tabCls(showTeam)}>
          チーム成績
        </Link>
        <Link href={buildUrl({ tab: 'records' })} className={tabCls(showRecords)}>
          通算記録室
        </Link>
        <Link href={buildUrl({ year, from, to, gtype, q, tournament, opponent })} className={tabCls(!showPitching && !showTeam && !showRecords)}>
          打撃成績
        </Link>
        <Link href={buildUrl({ tab: 'pitching', year, from, to, gtype, q, tournament, opponent })} className={tabCls(showPitching)}>
          投手成績
        </Link>
      </div>

      {showTeam ? (
        <TeamTable data={teamData} />
      ) : showRecords ? (
        <RecordsRoom
          sections={recordSections} within={RECORD_WITHIN}
          achieved={achievedRows} achievedYears={achievedYears} selectedYear={achievedYear}
          seasonBatting={withNames(seasonRecords.batting)} seasonPitching={withNames(seasonRecords.pitching)}
          streaks={streakRows}
        />
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
