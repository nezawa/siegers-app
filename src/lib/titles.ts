import { buildSeasonRecords } from '@/lib/seasonRecords'

// 獲得タイトル（各年度の公式戦でのチーム内1位）。選手詳細で使う。
//
// 判定は歴代シーズン記録（lib/seasonRecords.ts）を年度ごとに当てたもの:
//   - 首位打者・最高出塁率はその年の規定打席、最優秀防御率は規定投球回に届いた選手だけ
//   - 最高勝率は5勝以上の選手だけ
//   - 記録0は対象外。同率1位は全員が獲得

type StatRow = Record<string, unknown>

const BATTING_TITLES = [
  { key: 'avg', label: '首位打者' },
  { key: 'hr', label: '本塁打王' },
  { key: 'rbi', label: '打点王' },
  { key: 'hits', label: '最多安打' },
  { key: 'obp', label: '最高出塁率' },
  { key: 'sb', label: '盗塁王' },
]

const PITCHING_TITLES = [
  { key: 'wins', label: '最多勝利' },
  { key: 'era', label: '最優秀防御率' },
  { key: 'k', label: '最多奪三振' },
  { key: 'winPct', label: '最高勝率' },
  { key: 'saves', label: '最多セーブ' },
]

export type Title = { key: string; label: string; years: string[] }

const yearOf = (row: StatRow) => ((row.games as { date?: string } | null)?.date ?? '').slice(0, 4)

// タイトルごとに獲得年度（古い順）をまとめる。並びは上の定義順（打撃→投手）
export function buildPlayerTitles(
  battingRows: StatRow[],
  pitchingRows: StatRow[],
  playerId: string,
  officialGamesInYear: (year: string) => number,
  qualifiedPaRate: number,
  qualifiedIpRate: number,
): Title[] {
  const years = [...new Set([...battingRows, ...pitchingRows].map(yearOf).filter(Boolean))].sort()
  const titles: Title[] = [...BATTING_TITLES, ...PITCHING_TITLES].map(def => ({ ...def, years: [] }))

  for (const year of years) {
    const records = buildSeasonRecords(
      battingRows.filter(r => yearOf(r) === year),
      pitchingRows.filter(r => yearOf(r) === year),
      officialGamesInYear,
      qualifiedPaRate,
      qualifiedIpRate,
    )
    for (const title of titles) {
      const rec = [...records.batting, ...records.pitching].find(r => r.key === title.key)
      if (rec?.value && rec.holders.some(h => h.playerId === playerId)) title.years.push(year)
    }
  }

  return titles.filter(t => t.years.length > 0)
}

// 獲得年度の表示。下2桁にして、3年以上連続した年度は範囲にまとめる
//   例: ['2009', '2012', '2018', '2019', '2020', '2021'] → '09年、12年、18年〜21年'
export function formatTitleYears(years: string[]): string {
  const short = (y: number) => `${String(y % 100).padStart(2, '0')}年`
  const nums = years.map(Number)
  const parts: string[] = []
  for (let i = 0; i < nums.length; ) {
    let j = i
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++
    if (j - i >= 2) parts.push(`${short(nums[i])}〜${short(nums[j])}`)
    else parts.push(...nums.slice(i, j + 1).map(short))
    i = j + 1
  }
  return parts.join('、')
}
