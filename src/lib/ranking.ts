import { computeBatting, computePitching, type BattingTotals, type PitchingTotals } from '@/lib/stats'

// 各指標でチーム内のどのあたりの位置にいるかを判定する。成績表のセル背景色に使う。
//
// 上位1/3を暖色・中位1/3を無色・下位1/3を寒色とし、各帯の中を3段階の濃淡に分ける。
// 戻り値の tier は  1〜3 が暖色（1が最上位＝最も濃い）、
//                  -1〜-3 が寒色（-3が最下位＝最も濃い）、キー無しが中位（無色）。
//
// ルール（実装の前提）:
//   - 率系（打率・出塁率・長打率・OPS・得点圏打率・勝率・防御率）は規定到達者だけで比較する
//     （数打席しか出ていない選手が打率トップになるのを防ぐため）
//   - 防御率は小さいほど上位。それ以外は大きいほど上位（三振・失策などのネガティブ指標も最多が上位）
//   - 同値は「平均順位」で位置を決める。これにより 0 が大量に並ぶ指標（本塁打など）で
//     0の集団が中位に収まり、記録を持つ選手だけが上位に出る
//   - 記録が0のセルには色を付けない（防御率の 0.00 は最高成績なので例外）。
//     順位計算の母数には含めるので、他の選手の相対位置は変わらない
//   - 比較は「画面に表示される桁数に丸めてから」行う（表示が同じ値なら同順位として扱う）

type StatRow = Record<string, unknown>

type Metric<T> = {
  key: string
  get: (t: T) => number | null
  digits?: number // 表示に合わせた丸め桁数（省略時は整数）
  lowerIsBetter?: boolean
  qualified?: boolean // 規定到達者だけで比較する
}

const BATTING_METRICS: Metric<BattingTotals>[] = [
  { key: 'games', get: t => t.games },
  { key: 'avg', get: t => t.avgValue, digits: 3, qualified: true },
  { key: 'pa', get: t => t.pa },
  { key: 'ab', get: t => t.ab },
  { key: 'hits', get: t => t.hits },
  { key: 'hr', get: t => t.hr },
  { key: 'rbi', get: t => t.rbi },
  { key: 'runs', get: t => t.runs },
  { key: 'sb', get: t => t.sb },
  { key: 'obp', get: t => t.obpValue, digits: 3, qualified: true },
  { key: 'slg', get: t => t.slgValue, digits: 3, qualified: true },
  { key: 'risp_avg', get: t => t.rispAvgValue, digits: 3, qualified: true },
  { key: 'ops', get: t => t.opsValue, digits: 3, qualified: true },
  { key: 'doubles', get: t => t.doubles },
  { key: 'triples', get: t => t.triples },
  { key: 'tb', get: t => t.tb },
  { key: 'k', get: t => t.k },
  { key: 'bb', get: t => t.bb },
  { key: 'hbp', get: t => t.hbp },
  { key: 'sac_bunt', get: t => t.sac_bunt },
  { key: 'sac_fly', get: t => t.sac_fly },
  { key: 'gidp', get: t => t.gidp },
  { key: 'reach_on_error', get: t => t.reach_on_error },
  { key: 'errors', get: t => t.errors },
  { key: 'cs', get: t => t.cs },
]

const PITCHING_METRICS: Metric<PitchingTotals>[] = [
  { key: 'appearances', get: t => t.appearances },
  { key: 'wins', get: t => t.wins },
  { key: 'holds', get: t => t.holds },
  { key: 'saves', get: t => t.saves },
  { key: 'losses', get: t => t.losses },
  { key: 'winPct', get: t => t.winPctValue, digits: 3, qualified: true },
  { key: 'era', get: t => t.eraValue, digits: 2, lowerIsBetter: true, qualified: true },
  { key: 'ip', get: t => t.totalOuts },
  { key: 'pitch_count', get: t => t.pitch_count },
  { key: 'runs', get: t => t.runs },
  { key: 'er', get: t => t.er },
  { key: 'cg', get: t => t.cg },
  { key: 'sho', get: t => t.sho },
  { key: 'hits_allowed', get: t => t.hits_allowed },
  { key: 'hr_allowed', get: t => t.hr_allowed },
  { key: 'k', get: t => t.k },
  { key: 'bb', get: t => t.bb },
  { key: 'hbp', get: t => t.hbp },
  { key: 'balk', get: t => t.balk },
  { key: 'wp', get: t => t.wp },
]

const round = (v: number, digits: number) => Math.round(v * 10 ** digits) / 10 ** digits

// 指標キー → tier（暖色 1〜3 / 寒色 -1〜-3）。中位（無色）の指標は含まれない。
// クライアントコンポーネントへ props で渡すのでプレーンなオブジェクトにしておく
export type RankMap = Record<string, number>

// 帯の境界（上位1/3・下位1/3）と、1つの帯を何段階の濃淡に分けるか
const TOP_BAND = 1 / 3
const BOTTOM_BAND = 2 / 3
const SHADES = 3
// 母数がこれ未満の指標は3分割しても意味がないので色を付けない
const MIN_POOL = 3

// 相対位置 p（0=最上位, 1=最下位）から tier を決める
function tierFor(p: number): number {
  if (p < TOP_BAND) {
    const step = Math.min(SHADES - 1, Math.floor((p / TOP_BAND) * SHADES))
    return step + 1 // 1 が最も濃い暖色
  }
  if (p >= BOTTOM_BAND) {
    const step = Math.min(SHADES - 1, Math.floor(((p - BOTTOM_BAND) / (1 - BOTTOM_BAND)) * SHADES))
    return -(step + 1) // -3 が最も濃い寒色
  }
  return 0 // 中位は無色
}

// 選手ID → 指標別の tier
function rankAll<T>(
  entries: { playerId: string; totals: T; qualifies: boolean }[],
  metrics: Metric<T>[]
): Record<string, RankMap> {
  const result: Record<string, RankMap> = {}
  for (const e of entries) result[e.playerId] = {}

  for (const m of metrics) {
    const pool = m.qualified ? entries.filter(e => e.qualifies) : entries
    const values = pool
      .map(e => ({ id: e.playerId, v: m.get(e.totals) }))
      .filter((x): x is { id: string; v: number } => x.v !== null && Number.isFinite(x.v))
      .map(x => ({ id: x.id, v: round(x.v, m.digits ?? 0) }))

    const n = values.length
    if (n < MIN_POOL) continue

    for (const mine of values) {
      // 記録が0のセルには色を付けない（防御率だけは 0.00 が最高成績なので対象外）。
      // 順位の母数からは外さないので、他の選手の相対位置は変わらない
      if (mine.v === 0 && !m.lowerIsBetter) continue

      const better = values.filter(x => (m.lowerIsBetter ? x.v < mine.v : x.v > mine.v)).length
      const tied = values.filter(x => x.v === mine.v).length
      // 平均順位。同値が並ぶときはその集団の真ん中の順位として扱う
      const meanRank = better + (tied + 1) / 2
      const tier = tierFor((meanRank - 1) / (n - 1))
      if (tier !== 0) result[mine.id][m.key] = tier
    }
  }

  return result
}

const playerIdOf = (row: StatRow) => String(row.player_id ?? '')

// 指定した集合（年度別ならその年の行、通算なら全行、フィルター適用後ならその行）における
// 選手ごとの指標別順位を返す
export function battingRanksAll(rows: StatRow[], paThreshold: number): Record<string, RankMap> {
  const ids = [...new Set(rows.map(playerIdOf))]
  const entries = ids.map(pid => {
    const totals = computeBatting(rows.filter(r => playerIdOf(r) === pid))
    return { playerId: pid, totals, qualifies: totals.pa >= paThreshold }
  })
  return rankAll(entries, BATTING_METRICS)
}

export function pitchingRanksAll(rows: StatRow[], outsThreshold: number): Record<string, RankMap> {
  const ids = [...new Set(rows.map(playerIdOf))]
  const entries = ids.map(pid => {
    const totals = computePitching(rows.filter(r => playerIdOf(r) === pid))
    return { playerId: pid, totals, qualifies: totals.totalOuts >= outsThreshold }
  })
  return rankAll(entries, PITCHING_METRICS)
}

const EMPTY: RankMap = {}

export function battingRanks(rows: StatRow[], playerId: string, paThreshold: number): RankMap {
  return battingRanksAll(rows, paThreshold)[playerId] ?? EMPTY
}

export function pitchingRanks(rows: StatRow[], playerId: string, outsThreshold: number): RankMap {
  return pitchingRanksAll(rows, outsThreshold)[playerId] ?? EMPTY
}
