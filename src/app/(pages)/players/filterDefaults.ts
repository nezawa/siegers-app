// 成績ページの絞り込み既定値。
//
// 既定値は settings テーブル（default_stats_year / default_stats_game_type）に持ち、
// 管理画面の設定ページから変更できる。DB では null が「絞り込まない」を意味する。
//
// URL では null を表現できないので、「通算」「全試合」を選んだときだけ 'all' を載せる。
// URL に year / gtype が無い ＝ 既定値を適用、という関係になる
// （既定でONの規定打席チェックが q=0 のときだけ外れるのと同じ考え方）。

export const ALL = 'all'

export type GameType = 'official' | 'practice' | 'other'

// settings が未取得・列未追加のときに使うフォールバック（従来どおり絞り込まない）
export const FALLBACK_YEAR: string | null = null
export const FALLBACK_GTYPE: GameType | null = null

export const isGameType = (v: unknown): v is GameType =>
  v === 'official' || v === 'practice' || v === 'other'

// URL の year を実際に適用する年度へ。null なら年度で絞らない（通算）
export const resolveYear = (year: string | undefined, defaultYear: string | null): string | null => {
  if (year === ALL) return null
  if (year) return year
  return defaultYear
}

// URL の gtype を実際に適用する試合種別へ。null なら種別で絞らない（全試合）
export const resolveGtype = (
  gtype: string | undefined,
  defaultGtype: GameType | null
): GameType | null => {
  if (gtype === ALL) return null
  if (isGameType(gtype)) return gtype
  return defaultGtype
}

// プルダウンの初期選択値。null（絞り込まない）は 'all' として表示する
export const toSelectValue = (
  param: string | undefined,
  fallback: string | null
): string => param ?? fallback ?? ALL
