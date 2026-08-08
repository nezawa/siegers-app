import { computeBatting, computePitching, type BattingTotals, type PitchingTotals } from '@/lib/stats'

// 各指標の「チーム内1〜3位」を判定する。個人成績ページの順位バッジ表示に使う。
//
// ルール（実装の前提）:
//   - 率系（打率・出塁率・長打率・OPS・得点圏打率・勝率・防御率）は規定到達者だけで比較する
//     （数打席しか出ていない選手が打率1位になるのを防ぐため）
//   - 防御率は小さいほど上位。それ以外は大きいほど上位（三振・失策などのネガティブ指標も最多が上位）
//   - 値が0の記録は順位を付けない（0本塁打で2位、のような表示を避ける）。
//     ただし防御率は 0.00 が最高成績なので対象外
//   - 同順位は全員に同じ順位を出し、次の順位は人数分飛ばす（競技順位。1位が2人なら次は3位）
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

// 指標キー → 順位(1〜3)。3位までに入らなかった指標は含まれない
export type RankMap = Map<string, number>

const TOP_N = 3

function rankMap<T>(
  entries: { playerId: string; totals: T; qualifies: boolean }[],
  metrics: Metric<T>[],
  playerId: string
): RankMap {
  const ranks: RankMap = new Map()

  for (const m of metrics) {
    const pool = m.qualified ? entries.filter(e => e.qualifies) : entries
    let values = pool
      .map(e => ({ id: e.playerId, v: m.get(e.totals) }))
      .filter((x): x is { id: string; v: number } => x.v !== null && Number.isFinite(x.v))
      .map(x => ({ id: x.id, v: round(x.v, m.digits ?? 0) }))

    // 記録0は順位付けの対象外（防御率は 0.00 が最高成績なので除外しない）
    if (!m.lowerIsBetter) values = values.filter(x => x.v > 0)

    const mine = values.find(x => x.id === playerId)
    if (!mine) continue

    // 競技順位: 自分より上の人数 + 1（同順位が複数いればその分だけ次の順位が飛ぶ）
    const better = values.filter(x => (m.lowerIsBetter ? x.v < mine.v : x.v > mine.v)).length
    const rank = better + 1
    if (rank <= TOP_N) ranks.set(m.key, rank)
  }

  return ranks
}

const playerIdOf = (row: StatRow) => String(row.player_id ?? '')

// 指定した集合（年度別ならその年の行、通算なら全行）における、その選手の指標別順位を返す
export function battingRanks(rows: StatRow[], playerId: string, paThreshold: number): RankMap {
  const ids = [...new Set(rows.map(playerIdOf))]
  const entries = ids.map(pid => {
    const totals = computeBatting(rows.filter(r => playerIdOf(r) === pid))
    return { playerId: pid, totals, qualifies: totals.pa >= paThreshold }
  })
  return rankMap(entries, BATTING_METRICS, playerId)
}

export function pitchingRanks(rows: StatRow[], playerId: string, outsThreshold: number): RankMap {
  const ids = [...new Set(rows.map(playerIdOf))]
  const entries = ids.map(pid => {
    const totals = computePitching(rows.filter(r => playerIdOf(r) === pid))
    return { playerId: pid, totals, qualifies: totals.totalOuts >= outsThreshold }
  })
  return rankMap(entries, PITCHING_METRICS, playerId)
}
