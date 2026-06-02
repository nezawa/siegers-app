'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Player } from '@/types'

const EXAMPLE = `{
  "date": "2025-05-01",
  "opponent": "対戦相手名",
  "venue": "球場名",
  "result": "W",
  "score_us": 5,
  "score_them": 2,
  "notes": "",
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

type JsonInput = {
  date: string
  opponent: string
  venue?: string
  result: 'W' | 'L' | 'D'
  score_us: number
  score_them: number
  notes?: string
  innings_us?: (number | null)[]
  innings_them?: (number | null)[]
  batting?: Record<string, unknown>[]
  pitching?: Record<string, unknown>[]
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

  const validate = (data: unknown): { input: JsonInput; errors: string[] } => {
    const errs: string[] = []
    const d = data as Record<string, unknown>

    if (!d.date || typeof d.date !== 'string') errs.push('date が必要です（例: "2025-05-01"）')
    if (!d.opponent || typeof d.opponent !== 'string') errs.push('opponent が必要です')
    if (!['W', 'L', 'D'].includes(d.result as string)) errs.push('result は "W" / "L" / "D" のいずれかです')
    if (typeof d.score_us !== 'number') errs.push('score_us（自チームスコア）が必要です')
    if (typeof d.score_them !== 'number') errs.push('score_them（相手スコア）が必要です')

    // batting の選手番号チェック
    if (Array.isArray(d.batting)) {
      d.batting.forEach((row, i) => {
        const r = row as Record<string, unknown>
        if (r.number === undefined) {
          errs.push(`batting[${i}]: number（背番号）が必要です`)
        } else if (!numberToId(r.number)) {
          errs.push(`batting[${i}]: 背番号 ${r.number} の選手が見つかりません`)
        }
      })
    }

    // pitching の選手番号チェック
    if (Array.isArray(d.pitching)) {
      d.pitching.forEach((row, i) => {
        const r = row as Record<string, unknown>
        if (r.number === undefined) {
          errs.push(`pitching[${i}]: number（背番号）が必要です`)
        } else if (!numberToId(r.number)) {
          errs.push(`pitching[${i}]: 背番号 ${r.number} の選手が見つかりません`)
        }
      })
    }

    return { input: d as unknown as JsonInput, errors: errs }
  }

  const handleSubmit = async () => {
    setErrors([])
    setLoading(true)

    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      setErrors(['JSONの形式が正しくありません'])
      setLoading(false)
      return
    }

    const { input, errors: validationErrors } = validate(parsed)
    if (validationErrors.length > 0) {
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
          opponent: input.opponent,
          venue: input.venue || null,
          score_us: input.score_us,
          score_them: input.score_them,
          result: input.result,
          notes: input.notes || null,
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

      router.push(`/games/${game.id}`)
    } catch (err: unknown) {
      setErrors([err instanceof Error ? err.message : '保存に失敗しました'])
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-sm text-gray-500 mb-3">
          以下の形式で JSON を貼り付けてください。<code className="bg-gray-100 px-1 rounded">number</code> は背番号です。
          省略した数値フィールドは 0 として扱われます。
        </p>
        <textarea
          value={json}
          onChange={e => setJson(e.target.value)}
          placeholder={EXAMPLE}
          rows={28}
          className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          spellCheck={false}
        />
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-600">{e}</p>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || json.trim() === ''}
        className="w-full bg-blue-900 text-white py-3 rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
      >
        {loading ? '保存中...' : '試合結果を保存'}
      </button>
    </div>
  )
}
