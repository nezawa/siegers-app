import { computeBatting, computePitching, outsToIp, type BattingTotals, type PitchingTotals } from '@/lib/stats'

// 通算記録の節目（50刻み）。選手詳細の「もうすぐ達成」と成績ページの「通算記録室」で共用する。
// 対象は積み上げ系のプラス記録のみ（率系・マイナス記録・投球数・打数は対象外）
export const MILESTONE_STEP = 50

type Def<T> = {
  key: string
  label: string // 選手詳細での表示名
  suffix: string // 「100安打」のような記録名の末尾
  get: (t: T) => number
  unit?: number // 投球回はアウト数で数えるので 3（1イニング = 3アウト）
}

const BATTING_DEFS: Def<BattingTotals>[] = [
  { key: 'games', label: '試合数', suffix: '試合出場', get: t => t.games },
  { key: 'pa', label: '打席', suffix: '打席', get: t => t.pa },
  { key: 'hits', label: '安打', suffix: '安打', get: t => t.hits },
  { key: 'hr', label: '本塁打', suffix: '本塁打', get: t => t.hr },
  { key: 'rbi', label: '打点', suffix: '打点', get: t => t.rbi },
  { key: 'runs', label: '得点', suffix: '得点', get: t => t.runs },
  { key: 'sb', label: '盗塁', suffix: '盗塁', get: t => t.sb },
  { key: 'doubles', label: '二塁打', suffix: '二塁打', get: t => t.doubles },
  { key: 'triples', label: '三塁打', suffix: '三塁打', get: t => t.triples },
  { key: 'tb', label: '塁打数', suffix: '塁打', get: t => t.tb },
  { key: 'bb', label: '四球', suffix: '四球', get: t => t.bb },
]

const PITCHING_DEFS: Def<PitchingTotals>[] = [
  { key: 'appearances', label: '登板', suffix: '登板', get: t => t.appearances },
  { key: 'wins', label: '勝利', suffix: '勝', get: t => t.wins },
  { key: 'holds', label: 'ホールド', suffix: 'ホールド', get: t => t.holds },
  { key: 'saves', label: 'セーブ', suffix: 'セーブ', get: t => t.saves },
  { key: 'pk', label: '奪三振', suffix: '奪三振', get: t => t.k },
  { key: 'ip', label: '投球回', suffix: '投球回', get: t => t.totalOuts, unit: 3 },
]

// 記録の並び順（通算記録室のセクション順に使う）
export const MILESTONE_ORDER = [...BATTING_DEFS, ...PITCHING_DEFS].map(d => d.key)

export type Milestone = {
  key: string
  label: string
  title: string // 「100安打」
  value: number // 生の値（投球回はアウト数）。達成済み人数の判定に使う
  current: string
  target: number
  targetValue: number // target を生の値に換算したもの
  remaining: string
  remainingValue: number // 並び替え・絞り込み用（投球回はイニング換算）
  progress: number // 現在の50刻み区間での進み具合 0〜1
}

function toMilestone<T>(def: Def<T>, totals: T): Milestone {
  const unit = def.unit ?? 1
  const step = MILESTONE_STEP * unit
  const value = def.get(totals)
  const targetValue = (Math.floor(value / step) + 1) * step
  const rem = targetValue - value
  const fmt = (v: number) => (unit === 3 ? outsToIp(v) : String(v))
  return {
    key: def.key,
    label: def.label,
    title: `${targetValue / unit}${def.suffix}`,
    value,
    current: fmt(value),
    target: targetValue / unit,
    targetValue,
    remaining: fmt(rem),
    remainingValue: rem / unit,
    progress: (value % step) / step,
  }
}

export type AchievedRecord = {
  id: string
  key: string
  order: number // 記録の定義順（同じ試合で複数達成したときの並びに使う）
  title: string
  playerId: string
  gameId: string
  date: string
  opponent: string | null
  gamesPlayed: number // 達成した試合までの通算出場試合数（打撃記録は野手、投手記録は投手としての出場数）
}

type StatRow = Record<string, unknown>
const rowDate = (row: StatRow) => (row.games as { date?: string } | null)?.date ?? ''

// 成績行を試合順に積み上げ、50刻みの節目をまたいだ試合を「達成」として返す。
// 1試合で2つの節目をまたいだ（例: 49→101打席）ときは両方とも返す
function findAchievementsOf<T>(rows: StatRow[], compute: (rows: StatRow[]) => T, defs: Def<T>[]): AchievedRecord[] {
  const result: AchievedRecord[] = []
  const byPlayer = new Map<string, StatRow[]>()
  for (const row of rows) {
    const pid = row.player_id as string
    byPlayer.set(pid, [...(byPlayer.get(pid) ?? []), row])
  }

  for (const [playerId, playerRows] of byPlayer) {
    // 同じ日に2試合あるときは試合IDの順にする（開始時刻は取得していないため）
    const sorted = [...playerRows].sort((a, b) =>
      rowDate(a).localeCompare(rowDate(b)) || String(a.game_id).localeCompare(String(b.game_id))
    )
    let prev: T | null = null
    sorted.forEach((row, i) => {
      const next = compute(sorted.slice(0, i + 1))
      defs.forEach(def => {
        const unit = def.unit ?? 1
        const step = MILESTONE_STEP * unit
        const before = prev ? def.get(prev) : 0
        const after = def.get(next)
        for (let target = (Math.floor(before / step) + 1) * step; target <= after; target += step) {
          result.push({
            id: `${playerId}-${def.key}-${target}`,
            key: def.key,
            order: MILESTONE_ORDER.indexOf(def.key),
            title: `${target / unit}${def.suffix}`,
            playerId,
            gameId: row.game_id as string,
            date: rowDate(row),
            opponent: (row.games as { opponent?: string | null } | null)?.opponent ?? null,
            gamesPlayed: i + 1,
          })
        }
      })
      prev = next
    })
  }
  return result
}

// 全選手の達成済み記録。新しい順（同じ試合内は記録の定義順）
export function findAchievements(battingRows: StatRow[], pitchingRows: StatRow[]): AchievedRecord[] {
  return [
    ...findAchievementsOf(battingRows, computeBatting, BATTING_DEFS),
    ...findAchievementsOf(pitchingRows, computePitching, PITCHING_DEFS),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order)
}

// 選手1人分の「次の節目」を全記録について返す（打撃・投手の成績が無い側は含めない）
export function buildMilestones(batting: BattingTotals | null, pitching: PitchingTotals | null): Milestone[] {
  return [
    ...(batting ? BATTING_DEFS.map(d => toMilestone(d, batting)) : []),
    ...(pitching ? PITCHING_DEFS.map(d => toMilestone(d, pitching)) : []),
  ]
}
