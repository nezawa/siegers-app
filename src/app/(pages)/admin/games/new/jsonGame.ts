import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { validateBatting, validatePitching, mergeIssues } from '@/lib/validateStats'
import type { Player, TournamentOption } from '@/types'

// JSON入力・JSONファイル入力で共通の、試合JSONの検証と保存処理

export const EXAMPLE = `{
  "date": "2025-05-01",
  "start_time": "09:00",       // 開始時間（"HH:MM" 形式。省略可）
  "opponent": "対戦相手名",
  "tournament": "〇〇リーグ",     // 大会名（省略可）
  "game_type": "official",     // "official"=公式戦 / "practice"=練習試合 / "other"=その他（省略可）
  "venue": "球場名",
  "result": "W",               // "W"=勝ち / "L"=負け / "D"=引き分け / "O"=その他（イニング別スコアがあれば省略可）
  "score_us": 5,
  "score_them": 2,
  "notes": "",
  "is_home": false,            // false=先攻 / true=後攻（省略時は先攻）
  "innings_us":   [0, 2, 0, 1, 0, 0, 2, 0, 0],
  "innings_them": [0, 0, 1, 0, 1, 0, 0, 0, 0],
  "batting": [
    { "number": 1,  "batting_order": 1, "pa": 4, "ab": 3, "hits": 1, "doubles": 0, "triples": 0, "hr": 0, "rbi": 0, "runs": 1, "sb": 0, "k": 1, "bb": 1, "hbp": 0, "sac_bunt": 0, "sac_fly": 0, "gidp": 0, "reach_on_error": 0, "errors": 0, "cs": 0, "risp_ab": 0, "risp_hits": 0 },
    { "number": 2,  "batting_order": 2, "pa": 4, "ab": 4, "hits": 2, "doubles": 1, "triples": 0, "hr": 0, "rbi": 1, "runs": 0, "sb": 0, "k": 0, "bb": 0, "hbp": 0, "sac_bunt": 0, "sac_fly": 0, "gidp": 0, "reach_on_error": 0, "errors": 0, "cs": 0, "risp_ab": 2, "risp_hits": 1 },
    { "number": 3,  "batting_order": 3, "pa": 3, "ab": 3, "hits": 0, "doubles": 0, "triples": 0, "hr": 0, "rbi": 0, "runs": 0, "sb": 0, "k": 2, "bb": 0, "hbp": 0, "sac_bunt": 0, "sac_fly": 0, "gidp": 0, "reach_on_error": 0, "errors": 0, "cs": 0, "risp_ab": 0, "risp_hits": 0 },
    { "number": 4,  "batting_order": 4, "pa": 4, "ab": 3, "hits": 1, "doubles": 0, "triples": 0, "hr": 1, "rbi": 2, "runs": 1, "sb": 0, "k": 1, "bb": 1, "hbp": 0, "sac_bunt": 0, "sac_fly": 0, "gidp": 0, "reach_on_error": 0, "errors": 0, "cs": 0, "risp_ab": 2, "risp_hits": 1 },
    { "number": 5,  "batting_order": 5, "pa": 3, "ab": 3, "hits": 0, "doubles": 0, "triples": 0, "hr": 0, "rbi": 0, "runs": 0, "sb": 0, "k": 1, "bb": 0, "hbp": 0, "sac_bunt": 0, "sac_fly": 0, "gidp": 1, "reach_on_error": 0, "errors": 0, "cs": 0, "risp_ab": 1, "risp_hits": 0 },
    { "number": 6,  "batting_order": 6, "pa": 4, "ab": 3, "hits": 1, "doubles": 0, "triples": 0, "hr": 0, "rbi": 1, "runs": 0, "sb": 0, "k": 0, "bb": 0, "hbp": 1, "sac_bunt": 0, "sac_fly": 0, "gidp": 0, "reach_on_error": 0, "errors": 1, "cs": 0, "risp_ab": 1, "risp_hits": 1 },
    { "number": 7,  "batting_order": 7, "pa": 3, "ab": 2, "hits": 0, "doubles": 0, "triples": 0, "hr": 0, "rbi": 0, "runs": 0, "sb": 0, "k": 0, "bb": 0, "hbp": 0, "sac_bunt": 1, "sac_fly": 0, "gidp": 0, "reach_on_error": 0, "errors": 0, "cs": 0, "risp_ab": 0, "risp_hits": 0 },
    { "number": 8,  "batting_order": 8, "pa": 3, "ab": 3, "hits": 1, "doubles": 0, "triples": 0, "hr": 0, "rbi": 1, "runs": 1, "sb": 1, "k": 0, "bb": 0, "hbp": 0, "sac_bunt": 0, "sac_fly": 0, "gidp": 0, "reach_on_error": 0, "errors": 0, "cs": 0, "risp_ab": 1, "risp_hits": 1 },
    { "number": 18, "batting_order": 9, "pa": 2, "ab": 2, "hits": 0, "doubles": 0, "triples": 0, "hr": 0, "rbi": 0, "runs": 0, "sb": 0, "k": 1, "bb": 0, "hbp": 0, "sac_bunt": 0, "sac_fly": 0, "gidp": 0, "reach_on_error": 0, "errors": 0, "cs": 0, "risp_ab": 0, "risp_hits": 0 }
  ],
  "pitching": [
    { "number": 18, "is_win": true,  "is_hold": false, "is_save": false, "is_loss": false, "is_cg": false, "is_sho": false, "ip": 6.0, "pitch_count": 85, "runs": 2, "er": 2, "hits_allowed": 5, "hr_allowed": 0, "k": 6, "bb": 2, "hbp": 0, "balk": 0, "wp": 0 },
    { "number": 9,  "is_win": false, "is_hold": false, "is_save": true,  "is_loss": false, "is_cg": false, "is_sho": false, "ip": 3.0, "pitch_count": 38, "runs": 0, "er": 0, "hits_allowed": 1, "hr_allowed": 0, "k": 3, "bb": 0, "hbp": 0, "balk": 0, "wp": 0 }
  ]
}`

// 個数系スタッツ（省略可・0以上の整数）
const stat = z.number({ error: '0以上の整数で入力してください' }).int('整数で入力してください').min(0, '0以上で入力してください').optional()

// 打撃行。定義外のキー（タイプミス）は「不明な項目」としてエラーにする
const battingRowSchema = z.strictObject({
  number: z.number({ error: 'number（背番号）が必要です' }),
  batting_order: stat,
  pa: stat, ab: stat, hits: stat, doubles: stat, triples: stat, hr: stat,
  rbi: stat, runs: stat, sb: stat, k: stat, bb: stat, hbp: stat,
  sac_bunt: stat, sac_fly: stat, gidp: stat, reach_on_error: stat,
  errors: stat, cs: stat, risp_ab: stat, risp_hits: stat,
})

const pitchingRowSchema = z.strictObject({
  number: z.number({ error: 'number（背番号）が必要です' }),
  is_win: z.boolean().optional(), is_hold: z.boolean().optional(),
  is_save: z.boolean().optional(), is_loss: z.boolean().optional(),
  is_cg: z.boolean().optional(), is_sho: z.boolean().optional(),
  ip: z.number({ error: '数値で入力してください（1/3回は .1、2/3回は .2）' }).min(0).optional(),
  pitch_count: stat, runs: stat, er: stat,
  hits_allowed: stat, hr_allowed: stat,
  k: stat, bb: stat, hbp: stat, balk: stat, wp: stat,
})

const jsonGameSchema = z.strictObject({
  date: z
    .string({ error: 'date が必要です（例: "2025-05-01"）' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, '"YYYY-MM-DD" 形式で入力してください（例: "2025-05-01"）'),
  start_time: z
    .string()
    .regex(/^\d{1,2}:\d{2}(:\d{2})?$/, '"HH:MM" 形式で入力してください（例: "09:00"）')
    .optional()
    .or(z.literal('')),
  opponent: z.string({ error: 'opponent が必要です' }).min(1, 'opponent が必要です'),
  tournament: z.string().optional(),
  game_type: z
    .enum(['official', 'practice', 'other'], { error: '"official"（公式戦） / "practice"（練習試合） / "other" のいずれかです' })
    .optional()
    .or(z.literal('')),
  venue: z.string().optional(),
  result: z
    .enum(['W', 'L', 'D', 'O'], { error: '"W" / "L" / "D" / "O" のいずれかです' })
    .optional()
    .or(z.literal('')),
  score_us: z.number({ error: '数値で入力してください' }).int().min(0).optional(),
  score_them: z.number({ error: '数値で入力してください' }).int().min(0).optional(),
  notes: z.string().optional(),
  is_home: z.boolean({ error: 'true（後攻）か false（先攻）で入力してください' }).optional(),
  innings_us: z.array(z.number().int().min(0).nullable()).optional(),
  innings_them: z.array(z.number().int().min(0).nullable()).optional(),
  batting: z.array(battingRowSchema).optional(),
  pitching: z.array(pitchingRowSchema).optional(),
})

export type JsonInput = z.infer<typeof jsonGameSchema> & {
  score_us: number
  score_them: number
  result: 'W' | 'L' | 'D' | 'O'
}

// ZodError を「項目名: メッセージ」の日本語一覧へ整形
function zodIssues(error: z.ZodError): string[] {
  return error.issues.map(issue => {
    const at = issue.path.length ? `${issue.path.join('.')}: ` : ''
    if (issue.code === 'unrecognized_keys') {
      return `${at}不明な項目があります: ${issue.keys.join(', ')}（項目名を確認してください）`
    }
    return `${at}${issue.message}`
  })
}

// 入力例のコメント（// 〜）を残したまま貼り付けても動くように、パース前に除去する。
// 文字列リテラル内の "//"（URL など）はコメント扱いしない
export function stripLineComments(src: string): string {
  let out = ''
  let inString = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inString) {
      out += c
      if (c === '\\' && i + 1 < src.length) {
        out += src[++i]
      } else if (c === '"') {
        inString = false
      }
    } else if (c === '"') {
      inString = true
      out += c
    } else if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++
      out += '\n'
    } else {
      out += c
    }
  }
  return out
}

// JSONテキストを試合データの配列へ。1件だけでも配列（[{...}]）でも受け付ける
export function parseGamesText(text: string): { games: unknown[]; error: string | null } {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripLineComments(text))
  } catch {
    return { games: [], error: 'JSONの形式が正しくありません' }
  }
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return { games: [], error: '試合データが空の配列です' }
    return { games: parsed, error: null }
  }
  return { games: [parsed], error: null }
}

export type ValidationResult = {
  input: JsonInput | null
  errors: string[]
  warnings: string[]
}

export function validateJsonGame(
  data: unknown,
  players: Player[],
  tournaments: TournamentOption[] = [],
): ValidationResult {
  const findPlayer = (num: unknown): Player | undefined =>
    players.find(p => p.number === Number(num))
  const numberToId = (num: unknown): string | null => findPlayer(num)?.id ?? null

  // 形式・型のチェックはスキーマに任せる（不正な型はここで全て弾かれる）
  const parsed = jsonGameSchema.safeParse(data)
  if (!parsed.success) return { input: null, errors: zodIssues(parsed.error), warnings: [] }

  const d = parsed.data
  const errs: string[] = []
  const warns: string[] = []

  // イニング別スコアがある場合、スコア・結果はその合計と統一する
  const sumInnings = (arr: (number | null)[] | undefined): number | null =>
    arr ? arr.reduce<number>((s, v) => s + (v ?? 0), 0) : null
  const usSum = sumInnings(d.innings_us)
  const themSum = sumInnings(d.innings_them)

  let score_us = d.score_us
  if (usSum !== null) {
    if (score_us !== undefined && score_us !== usSum) {
      errs.push(`score_us (${score_us}) が innings_us の合計 (${usSum}) と一致しません`)
    }
    score_us = usSum
  } else if (score_us === undefined) {
    errs.push('score_us（自チームスコア）が必要です')
  }

  let score_them = d.score_them
  if (themSum !== null) {
    if (score_them !== undefined && score_them !== themSum) {
      errs.push(`score_them (${score_them}) が innings_them の合計 (${themSum}) と一致しません`)
    }
    score_them = themSum
  } else if (score_them === undefined) {
    errs.push('score_them（相手スコア）が必要です')
  }

  // 結果はスコアから自動判定する。
  // ただし "O"（その他：中止・没収試合など）はスコアと一致しないのが前提なので、明示指定を尊重する
  let result = d.result || undefined
  if (result === 'O') {
    // 何もしない（指定された "O" をそのまま使う）
  } else if (score_us !== undefined && score_them !== undefined) {
    const derived = score_us > score_them ? 'W' : score_us < score_them ? 'L' : 'D'
    if (result && result !== derived) {
      errs.push(
        `result ("${result}") がスコアから判定した結果 ("${derived}") と一致しません` +
        `（勝敗に数えない試合なら "O" を指定してください）`
      )
    }
    result = derived
  } else if (!result) {
    errs.push('result は "W" / "L" / "D" / "O" のいずれかです')
  }

  // 背番号が実在する選手か（number の必須・型チェックはスキーマ側で済んでいる）
  d.batting?.forEach((r, i) => {
    if (!numberToId(r.number)) errs.push(`batting[${i}]: 背番号 ${r.number} の選手が見つかりません`)
  })
  d.pitching?.forEach((r, i) => {
    const player = findPlayer(r.number)
    if (!player) {
      errs.push(`pitching[${i}]: 背番号 ${r.number} の選手が見つかりません`)
    } else if (!player.is_pitcher) {
      // 野手の緊急登板は普通にあるのでエラーにはしない。背番号の打ち間違いに気づくための警告
      warns.push(
        `pitching[${i}]: 背番号 ${r.number}（${player.name}）は投手として登録されていません。` +
        `背番号が正しければ、このまま保存できます`
      )
    }
  })

  // 成績の整合性（打率・塁打数などの計算が狂う入力ミスを保存前に止める）。省略された項目は 0 扱い
  const n0 = (v: number | undefined) => v ?? 0
  const statIssues = mergeIssues(
    validateBatting((d.batting ?? []).map((r, i) => ({
      label: `batting[${i}]（背番号 ${r.number}）`,
      pa: n0(r.pa), ab: n0(r.ab), hits: n0(r.hits),
      doubles: n0(r.doubles), triples: n0(r.triples), hr: n0(r.hr),
      bb: n0(r.bb), hbp: n0(r.hbp), sac_bunt: n0(r.sac_bunt), sac_fly: n0(r.sac_fly),
      k: n0(r.k), gidp: n0(r.gidp), reach_on_error: n0(r.reach_on_error),
      risp_ab: n0(r.risp_ab), risp_hits: n0(r.risp_hits),
    }))),
    validatePitching((d.pitching ?? []).map((r, i) => ({
      label: `pitching[${i}]（背番号 ${r.number}）`,
      is_win: r.is_win ?? false, is_loss: r.is_loss ?? false, is_sho: r.is_sho ?? false,
      ip: n0(r.ip), runs: n0(r.runs), er: n0(r.er),
      hits_allowed: n0(r.hits_allowed), hr_allowed: n0(r.hr_allowed),
    }))),
  )
  errs.push(...statIssues.errors)

  // 試合種別が省略されていれば、大会マスタに設定された属性を使う。
  // JSON に明示指定があればそちらを優先する（フォーム入力で手動選択が優先されるのと同じ扱い）
  const game_type = d.game_type
    || (d.tournament ? tournaments.find(t => t.name === d.tournament)?.game_type ?? undefined : undefined)
    || undefined

  return {
    input: {
      ...d,
      game_type,
      score_us: score_us ?? 0,
      score_them: score_them ?? 0,
      result: result as 'W' | 'L' | 'D' | 'O',
    },
    errors: errs,
    warnings: [...warns, ...statIssues.warnings],
  }
}

export type SavedGame = { id: string; title: string }

export const gameTitle = (input: JsonInput) => `${input.date} vs ${input.opponent}`

export async function saveJsonGame(input: JsonInput, players: Player[]): Promise<SavedGame> {
  const numberToId = (num: unknown): string | null =>
    players.find(p => p.number === Number(num))?.id ?? null

  const supabase = createClient()

  const hasInnings = Array.isArray(input.innings_us) || Array.isArray(input.innings_them)

  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      date: input.date,
      start_time: input.start_time || null,
      opponent: input.opponent,
      tournament: input.tournament || null,
      game_type: input.game_type || null,
      venue: input.venue || null,
      score_us: input.score_us,
      score_them: input.score_them,
      result: input.result,
      notes: input.notes || null,
      is_home: input.is_home === true,
      innings_us: hasInnings ? (input.innings_us ?? null) : null,
      innings_them: hasInnings ? (input.innings_them ?? null) : null,
    })
    .select()
    .single()

  if (gameError) throw gameError

  const n = (v: unknown, def = 0) => typeof v === 'number' ? v : def
  const b = (v: unknown, def = false) => typeof v === 'boolean' ? v : def

  if (Array.isArray(input.batting) && input.batting.length > 0) {
    const { error } = await supabase.from('batting_stats').insert(
      input.batting.map(r => ({
        game_id: game.id,
        player_id: numberToId(r.number)!,
        batting_order: r.batting_order != null ? Number(r.batting_order) : null,
        pa: n(r.pa), ab: n(r.ab), hits: n(r.hits),
        doubles: n(r.doubles), triples: n(r.triples), hr: n(r.hr),
        rbi: n(r.rbi), runs: n(r.runs), sb: n(r.sb),
        risp_ab: n(r.risp_ab), risp_hits: n(r.risp_hits),
        k: n(r.k), bb: n(r.bb), hbp: n(r.hbp),
        sac_bunt: n(r.sac_bunt), sac_fly: n(r.sac_fly),
        gidp: n(r.gidp), reach_on_error: n(r.reach_on_error),
        errors: n(r.errors), cs: n(r.cs),
      }))
    )
    if (error) throw error
  }

  if (Array.isArray(input.pitching) && input.pitching.length > 0) {
    const { error } = await supabase.from('pitching_stats').insert(
      input.pitching.map(r => ({
        game_id: game.id,
        player_id: numberToId(r.number)!,
        is_win: b(r.is_win), is_hold: b(r.is_hold),
        is_save: b(r.is_save), is_loss: b(r.is_loss),
        is_cg: b(r.is_cg), is_sho: b(r.is_sho),
        ip: n(r.ip), pitch_count: n(r.pitch_count),
        runs: n(r.runs), er: n(r.er),
        hits_allowed: n(r.hits_allowed), hr_allowed: n(r.hr_allowed),
        k: n(r.k), bb: n(r.bb), hbp: n(r.hbp),
        balk: n(r.balk), wp: n(r.wp),
      }))
    )
    if (error) throw error
  }

  // 対戦相手・大会名をマスタへ自動登録（次回から候補に出す）。失敗しても保存処理は止めない
  if (input.opponent) {
    await supabase.from('opponents').upsert({ name: input.opponent }, { onConflict: 'name', ignoreDuplicates: true })
  }
  if (input.tournament) {
    await supabase.from('tournaments').upsert({ name: input.tournament }, { onConflict: 'name', ignoreDuplicates: true })
  }

  return { id: game.id as string, title: gameTitle(input) }
}
