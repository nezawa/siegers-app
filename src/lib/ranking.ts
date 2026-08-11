import { computeBatting, computePitching, type BattingTotals, type PitchingTotals } from '@/lib/stats'

// 各指標の「チーム内1位」を判定する。成績表のセル背景色に使う。
//
// ルール（実装の前提）:
//   - 率系（打率・出塁率・長打率・OPS・得点圏打率・勝率・防御率）は規定到達者だけで比較する
//     （数打席しか出ていない選手が打率1位になるのを防ぐため）
//   - 防御率は小さいほど上位。それ以外は大きいほど上位（三振・失策などのネガティブ指標も最多が1位）
//   - 記録が0のときは1位にしない（全員0本の本塁打で色が付く、といった表示を避ける）。
//     ただし防御率は 0.00 が最高成績なので対象外
//   - 同率1位は全員に色を付ける
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

// 指標キー → 順位。1位でない指標は含まれない。
// クライアントコンポーネントへ props で渡すのでプレーンなオブジェクトにしておく
export type RankMap = Record<string, number>

// 選手ID → 指標別の順位
function rankAll<T>(
  entries: { playerId: string; totals: T; qualifies: boolean }[],
  metrics: Metric<T>[]
): Record<string, RankMap> {
  const result: Record<string, RankMap> = {}
  for (const e of entries) result[e.playerId] = {}

  for (const m of metrics) {
    const pool = m.qualified ? entries.filter(e => e.qualifies) : entries
    let values = pool
      .map(e => ({ id: e.playerId, v: m.get(e.totals) }))
      .filter((x): x is { id: string; v: number } => x.v !== null && Number.isFinite(x.v))
      .map(x => ({ id: x.id, v: round(x.v, m.digits ?? 0) }))

    // 記録0は1位の対象外（防御率は 0.00 が最高成績なので除外しない）
    if (!m.lowerIsBetter) values = values.filter(x => x.v > 0)
    if (values.length === 0) continue

    const best = m.lowerIsBetter
      ? Math.min(...values.map(x => x.v))
      : Math.max(...values.map(x => x.v))

    for (const mine of values) {
      if (mine.v === best) result[mine.id][m.key] = 1
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
