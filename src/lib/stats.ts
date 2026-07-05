// 野球成績の計算・表示ヘルパー。
// 通算成績（/players）と個人成績（/players/[id]）で同じ式を使うための単一の置き場。
// 率系は分母0のとき「-」を返す（NaN/Infinity を画面に出さない）。

export function fmt(numerator: number, denominator: number, digits = 3): string {
  if (denominator === 0) return '-'
  return (numerator / denominator).toFixed(digits).replace(/^0/, '')
}

export function fmtOps(obp: number | null, slg: number | null): string {
  if (obp === null || slg === null) return '-'
  return (obp + slg).toFixed(3)
}

// 投球回は「5.1 = 5回1/3」の野球表記。小数部をそのままアウト数(0〜2)として扱う
export function ipToOuts(ip: number): number {
  const innings = Math.floor(ip)
  const outs = Math.round((ip - innings) * 10)
  return innings * 3 + outs
}

export function sumIp(ips: number[]): { display: string; outs: number } {
  const totalOuts = ips.reduce((sum, ip) => sum + ipToOuts(ip), 0)
  const innings = Math.floor(totalOuts / 3)
  const rem = totalOuts % 3
  return { display: rem === 0 ? `${innings}` : `${innings}.${rem}`, outs: totalOuts }
}

export function outsToIp(outs: number): string {
  const inn = Math.floor(outs / 3)
  const rem = outs % 3
  return rem === 0 ? `${inn}` : `${inn}.${rem}`
}

export function fmtEra(er: number, totalOuts: number): string {
  if (totalOuts === 0) return '-'
  return (er * 27 / totalOuts).toFixed(2)
}

// Supabase から返る成績行。集計に使うキーだけ数値として拾う
type StatRow = Record<string, unknown>

const num = (row: StatRow, key: string): number => (row[key] as number) ?? 0

const sum = (rows: StatRow[], key: string): number =>
  rows.reduce((s, row) => s + num(row, key), 0)

const count = (rows: StatRow[], key: string): number =>
  rows.filter(row => Boolean(row[key])).length

export type BattingTotals = ReturnType<typeof computeBatting>

export function computeBatting(rows: StatRow[]) {
  const games = rows.length
  const pa = sum(rows, 'pa')
  const ab = sum(rows, 'ab')
  const hits = sum(rows, 'hits')
  const doubles = sum(rows, 'doubles')
  const triples = sum(rows, 'triples')
  const hr = sum(rows, 'hr')
  const rbi = sum(rows, 'rbi')
  const runs = sum(rows, 'runs')
  const sb = sum(rows, 'sb')
  const bb = sum(rows, 'bb')
  const hbp = sum(rows, 'hbp')
  const sac_fly = sum(rows, 'sac_fly')
  const sac_bunt = sum(rows, 'sac_bunt')
  const k = sum(rows, 'k')
  const gidp = sum(rows, 'gidp')
  const reach_on_error = sum(rows, 'reach_on_error')
  const errors = sum(rows, 'errors')
  const cs = sum(rows, 'cs')
  const risp_ab = sum(rows, 'risp_ab')
  const risp_hits = sum(rows, 'risp_hits')
  const tb = hits + doubles + 2 * triples + 3 * hr
  const obpDenom = ab + bb + hbp + sac_fly
  const obpNum = hits + bb + hbp
  const obp = obpDenom > 0 ? obpNum / obpDenom : null
  const slg = ab > 0 ? tb / ab : null
  return {
    games, pa, ab, hits, doubles, triples, hr, rbi, runs, sb,
    bb, hbp, sac_fly, sac_bunt, k, gidp, reach_on_error, errors, cs,
    risp_ab, risp_hits, tb,
    avg: fmt(hits, ab),
    obp: obpDenom > 0 ? fmt(obpNum, obpDenom) : '-',
    slg: ab > 0 ? fmt(tb, ab) : '-',
    ops: fmtOps(obp, slg),
    risp_avg: fmt(risp_hits, risp_ab),
  }
}

export type PitchingTotals = ReturnType<typeof computePitching>

export function computePitching(rows: StatRow[]) {
  const appearances = rows.length
  const wins = count(rows, 'is_win')
  const holds = count(rows, 'is_hold')
  const saves = count(rows, 'is_save')
  const losses = count(rows, 'is_loss')
  const { display: ip, outs: totalOuts } = sumIp(rows.map(row => (row.ip as number) ?? 0))
  const er = sum(rows, 'er')
  const wl = wins + losses
  return {
    appearances, wins, holds, saves, losses, totalOuts,
    winPct: wl > 0 ? (wins / wl).toFixed(3).replace(/^0/, '') : '-',
    era: fmtEra(er, totalOuts),
    ip,
    pitch_count: sum(rows, 'pitch_count'),
    runs: sum(rows, 'runs'),
    er,
    cg: count(rows, 'is_cg'),
    sho: count(rows, 'is_sho'),
    hits_allowed: sum(rows, 'hits_allowed'),
    hr_allowed: sum(rows, 'hr_allowed'),
    k: sum(rows, 'k'),
    bb: sum(rows, 'bb'),
    hbp: sum(rows, 'hbp'),
    balk: sum(rows, 'balk'),
    wp: sum(rows, 'wp'),
  }
}
