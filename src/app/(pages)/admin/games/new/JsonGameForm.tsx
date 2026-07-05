'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { errorMessage } from '@/lib/errorMessage'
import type { Player } from '@/types'

const EXAMPLE = `{
  "date": "2025-05-01",
  "start_time": "09:00",       // 開始時間（"HH:MM" 形式。省略可）
  "opponent": "対戦相手名",
  "tournament": "〇〇リーグ",     // 大会名（省略可）
  "game_type": "official",     // "official"=公式戦 / "practice"=練習試合 / "other"=その他（省略可）
  "venue": "球場名",
  "result": "W",               // "W"=勝ち / "L"=負け / "D"=引き分け（イニング別スコアがあれば省略可）
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
    .enum(['W', 'L', 'D'], { error: '"W" / "L" / "D" のいずれかです' })
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

type JsonInput = z.infer<typeof jsonGameSchema> & {
  score_us: number
  score_them: number
  result: 'W' | 'L' | 'D'
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
function stripLineComments(src: string): string {
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

export default function JsonGameForm({ players }: { players: Player[] }) {
  const router = useRouter()
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const numberToId = (num: unknown): string | null => {
    const player = players.find(p => p.number === Number(num))
    return player?.id ?? null
  }

  const validate = (data: unknown): { input: JsonInput | null; errors: string[] } => {
    // 形式・型のチェックはスキーマに任せる（不正な型はここで全て弾かれる）
    const parsed = jsonGameSchema.safeParse(data)
    if (!parsed.success) return { input: null, errors: zodIssues(parsed.error) }

    const d = parsed.data
    const errs: string[] = []

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

    // 結果はスコアから自動判定する
    let result = d.result || undefined
    if (score_us !== undefined && score_them !== undefined) {
      const derived = score_us > score_them ? 'W' : score_us < score_them ? 'L' : 'D'
      if (result && result !== derived) {
        errs.push(`result ("${result}") がスコアから判定した結果 ("${derived}") と一致しません`)
      }
      result = derived
    } else if (!result) {
      errs.push('result は "W" / "L" / "D" のいずれかです')
    }

    // 背番号が実在する選手か（number の必須・型チェックはスキーマ側で済んでいる）
    d.batting?.forEach((r, i) => {
      if (!numberToId(r.number)) errs.push(`batting[${i}]: 背番号 ${r.number} の選手が見つかりません`)
    })
    d.pitching?.forEach((r, i) => {
      if (!numberToId(r.number)) errs.push(`pitching[${i}]: 背番号 ${r.number} の選手が見つかりません`)
    })

    return {
      input: { ...d, score_us: score_us ?? 0, score_them: score_them ?? 0, result: result as 'W' | 'L' | 'D' },
      errors: errs,
    }
  }

  const handleSubmit = async () => {
    setErrors([])
    setLoading(true)

    let parsed: unknown
    try {
      parsed = JSON.parse(stripLineComments(json))
    } catch {
      setErrors(['JSONの形式が正しくありません'])
      setLoading(false)
      return
    }

    const { input, errors: validationErrors } = validate(parsed)
    if (!input || validationErrors.length > 0) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
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

      router.push(`/games/${game.id}`)
    } catch (err: unknown) {
      setErrors([`保存に失敗しました: ${errorMessage(err)}`])
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-sm text-gray-500 mb-3">
          以下の形式で JSON を貼り付けてください。<code className="bg-gray-100 px-1 rounded">number</code> は背番号です。
          省略した数値フィールドは 0 として扱われます。
          <code className="bg-gray-100 px-1 rounded">innings_us</code> / <code className="bg-gray-100 px-1 rounded">innings_them</code> がある場合、
          スコアと結果はその合計から自動判定されます（矛盾する値が指定されているとエラーになります）。
          <code className="bg-gray-100 px-1 rounded">is_home</code> は後攻なら <code className="bg-gray-100 px-1 rounded">true</code>（省略時は先攻）。
          後攻の最終回裏が不要なら「×」、サヨナラ勝ちは「得点+x」で表示されます。
          <code className="bg-gray-100 px-1 rounded">start_time</code>（開始時間 &quot;HH:MM&quot;）・
          <code className="bg-gray-100 px-1 rounded">tournament</code>（大会名）・
          <code className="bg-gray-100 px-1 rounded">game_type</code>（&quot;official&quot; / &quot;practice&quot; / &quot;other&quot;）は任意です。
          <code className="bg-gray-100 px-1 rounded">{'//'}</code> 以降はコメントとして無視されるので、入力例をそのまま貼り付けても動きます。
        </p>
        <textarea
          value={json}
          onChange={e => setJson(e.target.value)}
          placeholder={EXAMPLE}
          rows={28}
          className="w-full rounded-xl border border-gray-300 bg-slate-50 px-3.5 py-2.5 text-sm font-mono shadow-inner transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y"
          spellCheck={false}
        />
      </div>

      {errors.length > 0 && (
        <div className="space-y-1 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-600">{e}</p>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || json.trim() === ''}
        className="w-full rounded-xl bg-band py-3 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50"
      >
        {loading ? '保存中...' : '試合結果を保存'}
      </button>
    </div>
  )
}
