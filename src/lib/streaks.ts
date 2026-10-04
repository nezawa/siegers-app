// 連続試合記録（公式戦のみ）。通算記録室で使う。
//
// 数え方:
//   - 出場・登板: チームの公式戦（結果が入った試合）を順に見て、続けて出場・登板した試合数。
//     欠場した試合があれば途切れる
//   - それ以外: その選手が出場した公式戦だけを順に見て、続けて記録した試合数。
//     欠場した試合は飛ばす（途切れない）。勝利は登板した試合だけを見る
//   - 試合の並びは日付 → 試合ID（同日2試合は登録順）
//   - 2試合以上続いたものだけを記録とし、同じ長さの1位は全員並べる

type StatRow = Record<string, unknown>
type Game = { id: string; date: string }

export type StreakHolder = {
  playerId: string
  from: string // 開始日
  to: string // 終了日
  ongoing: boolean // 直近の試合まで続いている
}

export type StreakRecord = {
  key: string
  label: string
  length: number | null // 記録なしは null
  holders: StreakHolder[]
}

const MIN_STREAK = 2

const num = (row: StatRow, key: string) => (row[key] as number) ?? 0
const dateOf = (row: StatRow) => (row.games as { date?: string } | null)?.date ?? ''
const isOfficial = (row: StatRow) => (row.games as { game_type?: string } | null)?.game_type === 'official'
const byGameOrder = (a: Game, b: Game) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)

// 並んだ試合のうち、条件を満たし続けた最長区間（同じ長さが複数あれば全部）
function longestRuns(games: Game[], hit: (g: Game) => boolean) {
  const runs: { length: number; from: string; to: string; ongoing: boolean }[] = []
  let start = -1
  games.forEach((g, i) => {
    if (hit(g)) {
      if (start < 0) start = i
      const last = i === games.length - 1 || !hit(games[i + 1])
      if (last) {
        runs.push({ length: i - start + 1, from: games[start].date, to: g.date, ongoing: i === games.length - 1 })
        start = -1
      }
    }
  })
  const best = Math.max(0, ...runs.map(r => r.length))
  return runs.filter(r => r.length === best)
}

type Def = {
  key: string
  label: string
  // 選手ごとに「見る試合の並び」と「その試合で記録したか」を返す
  sequence: (p: { batting: StatRow[]; pitching: StatRow[]; teamGames: Game[] }) => { games: Game[]; hit: (g: Game) => boolean }
}

const ownGames = (rows: StatRow[]) =>
  rows.map(r => ({ id: String(r.game_id), date: dateOf(r) })).sort(byGameOrder)

// 自分の出場試合だけを並べ、行ごとの条件で判定する
const own = (side: 'batting' | 'pitching', pred: (row: StatRow) => boolean): Def['sequence'] => p => {
  const rows = p[side]
  const byGame = new Map(rows.map(r => [String(r.game_id), r]))
  return { games: ownGames(rows), hit: g => pred(byGame.get(g.id)!) }
}

// チームの公式戦を並べ、出場（登板）したかで判定する
const team = (pick: (p: { batting: StatRow[]; pitching: StatRow[] }) => StatRow[]): Def['sequence'] => p => {
  const played = new Set(pick(p).map(r => String(r.game_id)))
  return { games: p.teamGames, hit: g => played.has(g.id) }
}

const DEFS: Def[] = [
  { key: 'appear', label: '出場', sequence: team(p => [...p.batting, ...p.pitching]) },
  { key: 'hits', label: '安打', sequence: own('batting', r => num(r, 'hits') > 0) },
  { key: 'onbase', label: '出塁', sequence: own('batting', r => num(r, 'hits') + num(r, 'bb') + num(r, 'hbp') > 0) },
  { key: 'sb', label: '盗塁', sequence: own('batting', r => num(r, 'sb') > 0) },
  { key: 'rbi', label: '打点', sequence: own('batting', r => num(r, 'rbi') > 0) },
  { key: 'runs', label: '得点', sequence: own('batting', r => num(r, 'runs') > 0) },
  { key: 'errors', label: '失策', sequence: own('batting', r => num(r, 'errors') > 0) },
  { key: 'k', label: '三振', sequence: own('batting', r => num(r, 'k') > 0) },
  { key: 'pitch', label: '登板', sequence: team(p => p.pitching) },
  { key: 'wins', label: '勝利', sequence: own('pitching', r => Boolean(r.is_win)) },
]

export function buildStreakRecords(
  battingRows: StatRow[],
  pitchingRows: StatRow[],
  officialPlayedGames: Game[], // チームの公式戦（結果が入った試合）
): StreakRecord[] {
  const teamGames = [...officialPlayedGames].sort(byGameOrder)
  const bOfficial = battingRows.filter(isOfficial)
  const pOfficial = pitchingRows.filter(isOfficial)
  const playerIds = [...new Set([...bOfficial, ...pOfficial].map(r => String(r.player_id)))]
  const players = playerIds.map(id => ({
    id,
    batting: bOfficial.filter(r => String(r.player_id) === id),
    pitching: pOfficial.filter(r => String(r.player_id) === id),
  }))

  return DEFS.map(def => {
    const candidates = players.flatMap(p => {
      const { games, hit } = def.sequence({ ...p, teamGames })
      return longestRuns(games, hit).map(r => ({ ...r, playerId: p.id }))
    })
    const best = Math.max(0, ...candidates.map(c => c.length))
    if (best < MIN_STREAK) return { key: def.key, label: def.label, length: null, holders: [] }
    return {
      key: def.key,
      label: def.label,
      length: best,
      holders: candidates
        .filter(c => c.length === best)
        .sort((a, b) => a.from.localeCompare(b.from))
        .map(({ playerId, from, to, ongoing }) => ({ playerId, from, to, ongoing })),
    }
  })
}
