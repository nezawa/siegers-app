import { computeBatting, computePitching, outsToIp, type BattingTotals, type PitchingTotals } from '@/lib/stats'

// 歴代シーズン記録（各項目の1シーズン最高記録）。通算記録室で使う。
//
// ルール:
//   - 公式戦のみで集計する
//   - 打率・出塁率・長打率・OPS・得点圏打率は、その年の規定打席に届いた選手だけで比較する
//   - 防御率はその年の規定投球回に届いた選手だけ。小さいほど上位
//   - 勝率は5勝以上の選手だけで比較する
//   - それ以外は多いほど上位（三振・失策などのマイナス記録も「最多」を記録とする）
//   - 記録が0のときは記録なし（防御率は 0.00 が最高なので対象外）
//   - 比較は表示の桁数に丸めてから行い、同じ値なら全員を1位として並べる

type StatRow = Record<string, unknown>

type Item<T> = {
  key: string
  label: string
  get: (t: T) => number | null // 比較用の数値
  show: (t: T) => string // 表示用
  digits?: number
  lowerIsBetter?: boolean
  qualify?: (t: T, year: string) => boolean
}

export const WIN_PCT_MIN_WINS = 5

export type SeasonRecordHolder = { playerId: string; year: string }

export type SeasonRecord = {
  key: string
  label: string
  value: string | null // 記録なしは null
  holders: SeasonRecordHolder[]
}

type Entry<T> = { playerId: string; year: string; totals: T }

const round = (v: number, digits: number) => Math.round(v * 10 ** digits) / 10 ** digits

function bestOf<T>(entries: Entry<T>[], items: Item<T>[]): SeasonRecord[] {
  return items.map(item => {
    const pool = item.qualify ? entries.filter(e => item.qualify!(e.totals, e.year)) : entries
    let values = pool
      .map(e => ({ e, v: item.get(e.totals) }))
      .filter((x): x is { e: Entry<T>; v: number } => x.v !== null && Number.isFinite(x.v))
      .map(x => ({ e: x.e, v: round(x.v, item.digits ?? 0) }))
    if (!item.lowerIsBetter) values = values.filter(x => x.v > 0)
    if (values.length === 0) return { key: item.key, label: item.label, value: null, holders: [] }

    const best = item.lowerIsBetter ? Math.min(...values.map(x => x.v)) : Math.max(...values.map(x => x.v))
    const top = values
      .filter(x => x.v === best)
      .sort((a, b) => a.e.year.localeCompare(b.e.year)) // 同率は古い年から
    return {
      key: item.key,
      label: item.label,
      value: item.show(top[0].e.totals),
      holders: top.map(x => ({ playerId: x.e.playerId, year: x.e.year })),
    }
  })
}

const yearOf = (row: StatRow) => ((row.games as { date?: string } | null)?.date ?? '').slice(0, 4)
const isOfficial = (row: StatRow) => (row.games as { game_type?: string } | null)?.game_type === 'official'

// 選手×年度ごとに集計する
function entriesOf<T>(rows: StatRow[], compute: (rows: StatRow[]) => T): Entry<T>[] {
  const groups = new Map<string, StatRow[]>()
  for (const row of rows.filter(isOfficial)) {
    const year = yearOf(row)
    if (!year) continue
    const id = `${row.player_id}|${year}`
    groups.set(id, [...(groups.get(id) ?? []), row])
  }
  return [...groups].map(([id, rs]) => {
    const [playerId, year] = id.split('|')
    return { playerId, year, totals: compute(rs) }
  })
}

export function buildSeasonRecords(
  battingRows: StatRow[],
  pitchingRows: StatRow[],
  officialGamesInYear: (year: string) => number,
  qualifiedPaRate: number,
  qualifiedIpRate: number,
): { batting: SeasonRecord[]; pitching: SeasonRecord[] } {
  const paOk = (t: BattingTotals, year: string) => t.pa >= officialGamesInYear(year) * qualifiedPaRate
  const ipOk = (t: PitchingTotals, year: string) => t.totalOuts >= officialGamesInYear(year) * qualifiedIpRate * 3

  const count = (key: keyof BattingTotals, label: string): Item<BattingTotals> =>
    ({ key, label, get: t => t[key] as number, show: t => String(t[key]) })
  const rate = (key: keyof BattingTotals, label: string, value: (t: BattingTotals) => number | null): Item<BattingTotals> =>
    ({ key, label, get: value, show: t => String(t[key]), digits: 3, qualify: paOk })

  const batting: Item<BattingTotals>[] = [
    count('games', '試合数'),
    rate('avg', '打率', t => t.avgValue),
    count('pa', '打席'),
    count('ab', '打数'),
    count('hits', '安打'),
    count('hr', '本塁打'),
    count('rbi', '打点'),
    count('runs', '得点'),
    count('sb', '盗塁'),
    rate('obp', '出塁率', t => t.obpValue),
    rate('slg', '長打率', t => t.slgValue),
    rate('risp_avg', '得点圏打率', t => t.rispAvgValue),
    rate('ops', 'OPS', t => t.opsValue),
    count('doubles', '二塁打'),
    count('triples', '三塁打'),
    count('tb', '塁打数'),
    count('k', '三振'),
    count('bb', '四球'),
    count('hbp', '死球'),
    count('sac_bunt', '犠打'),
    count('sac_fly', '犠飛'),
    count('gidp', '併殺打'),
    count('reach_on_error', '敵失'),
    count('errors', '失策'),
    count('cs', '盗塁阻止'),
  ]

  const pcount = (key: keyof PitchingTotals, label: string): Item<PitchingTotals> =>
    ({ key, label, get: t => t[key] as number, show: t => String(t[key]) })

  const pitching: Item<PitchingTotals>[] = [
    pcount('appearances', '登板'),
    pcount('wins', '勝利'),
    pcount('holds', 'ホールド'),
    pcount('saves', 'セーブ'),
    pcount('losses', '敗戦'),
    { key: 'winPct', label: '勝率', get: t => t.winPctValue, show: t => t.winPct, digits: 3, qualify: t => t.wins >= WIN_PCT_MIN_WINS },
    { key: 'era', label: '防御率', get: t => t.eraValue, show: t => t.era, digits: 2, lowerIsBetter: true, qualify: ipOk },
    { key: 'ip', label: '投球回', get: t => t.totalOuts, show: t => outsToIp(t.totalOuts) },
    pcount('pitch_count', '投球数'),
    pcount('runs', '失点'),
    pcount('er', '自責点'),
    pcount('cg', '完投'),
    pcount('sho', '完封'),
    pcount('hits_allowed', '被安打'),
    pcount('hr_allowed', '被本塁打'),
    pcount('k', '奪三振'),
    pcount('bb', '与四球'),
    pcount('hbp', '与死球'),
    pcount('balk', 'ボーク'),
    pcount('wp', '暴投'),
  ]

  return {
    batting: bestOf(entriesOf(battingRows, computeBatting), batting),
    pitching: bestOf(entriesOf(pitchingRows, computePitching), pitching),
  }
}
