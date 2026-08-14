'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { errorMessage } from '@/lib/errorMessage'
import {
  EXAMPLE,
  parseGamesText,
  validateJsonGame,
  saveJsonGame,
  type JsonInput,
  type SavedGame,
} from './jsonGame'
import type { Player, TournamentOption } from '@/types'

// 複数試合（配列）を貼り付けたときのメッセージ用ラベル
const withLabel = (label: string, message: string) => (label ? `${label}: ${message}` : message)

export default function JsonGameForm({ players, tournaments }: { players: Player[]; tournaments: TournamentOption[] }) {
  const router = useRouter()
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [saved, setSaved] = useState<SavedGame[]>([])
  const [errors, setErrors] = useState<string[]>([])
  // 成績の整合性チェックの警告。2回目の送信で承知のうえ保存できる
  const [warnings, setWarnings] = useState<string[]>([])
  const [warningsAcked, setWarningsAcked] = useState(false)

  const handleSubmit = async () => {
    setErrors([])
    setWarnings([])
    setSaved([])
    setLoading(true)

    const { games, error: parseError } = parseGamesText(json)
    if (parseError) {
      setErrors([parseError])
      setLoading(false)
      return
    }

    // 1件でも問題があれば、保存は一切行わずに全件分のエラーをまとめて出す
    const multi = games.length > 1
    const allErrors: string[] = []
    const allWarnings: string[] = []
    const targets: { label: string; input: JsonInput }[] = []
    games.forEach((game, i) => {
      const label = multi ? `[${i}]` : ''
      const { input, errors: gameErrors, warnings: gameWarnings } = validateJsonGame(game, players, tournaments)
      allErrors.push(...gameErrors.map(m => withLabel(label, m)))
      allWarnings.push(...gameWarnings.map(m => withLabel(label, m)))
      if (input) targets.push({ label, input })
    })

    if (allErrors.length > 0) {
      setErrors(allErrors)
      setWarnings(allWarnings)
      setLoading(false)
      return
    }
    if (allWarnings.length > 0 && !warningsAcked) {
      setWarnings(allWarnings)
      setWarningsAcked(true)
      setLoading(false)
      return
    }

    // 1件ずつ保存する（トランザクションではないので、途中で失敗したら保存済みの件数を明示する）
    const done: SavedGame[] = []
    for (const [i, target] of targets.entries()) {
      setProgress({ done: i, total: targets.length })
      try {
        done.push(await saveJsonGame(target.input, players))
      } catch (err: unknown) {
        setErrors([
          `${target.label ? `${target.label}の` : ''}保存に失敗しました: ${errorMessage(err)}`,
          ...(done.length > 0 ? [`${done.length}件は保存済みです（保存できた分は入力から取り除いてください）`] : []),
        ])
        setSaved(done)
        setProgress(null)
        setLoading(false)
        router.refresh()
        return
      }
    }
    setProgress(null)

    if (done.length === 1) {
      router.push(`/games/${done[0].id}`)
      return
    }
    // 複数件はどこへ飛ぶべきか決められないので、一覧を出して選んでもらう
    setSaved(done)
    setJson('')
    setWarnings([])
    setWarningsAcked(false)
    setLoading(false)
    router.refresh()
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
          <code className="bg-gray-100 px-1 rounded">game_type</code>（&quot;official&quot; / &quot;practice&quot; / &quot;other&quot;）は任意で、
          省略した場合は大会管理で設定した大会の試合属性が使われます。
          <code className="bg-gray-100 px-1 rounded">{'//'}</code> 以降はコメントとして無視されるので、入力例をそのまま貼り付けても動きます。
          <code className="bg-gray-100 px-1 rounded">[ &#123;試合1&#125;, &#123;試合2&#125; ]</code> のように配列で書けば複数試合をまとめて登録できます。
          <br />
          <span className="font-medium text-gray-600">
            記録の流儀: <code className="bg-gray-100 px-1 rounded">hits</code>（安打）は二塁打・三塁打・本塁打を含めた総安打数、
            <code className="bg-gray-100 px-1 rounded">risp_ab</code>（得点圏打数）は打数ベース（四球・死球・犠打・犠飛は除く）、
            敵失での出塁も <code className="bg-gray-100 px-1 rounded">ab</code>（打数）に含めます。
            塁打数・長打率・OPS・得点圏打率はこの前提で計算されます。
          </span>
        </p>
        <textarea
          value={json}
          onChange={e => { setJson(e.target.value); setWarningsAcked(false); setSaved([]) }}
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

      {errors.length === 0 && warnings.length > 0 && (
        <div className="space-y-1 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
          <p className="text-sm font-bold text-amber-800">入力漏れの可能性があります</p>
          {warnings.map((w, i) => <p key={i} className="text-sm text-amber-700">{w}</p>)}
          {warningsAcked && (
            <p className="pt-1 text-sm font-medium text-amber-800">
              このまま保存する場合は、もう一度「試合結果を保存」を押してください
            </p>
          )}
        </div>
      )}

      {saved.length > 0 && (
        <div className="space-y-1.5 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
          <p className="text-sm font-bold text-emerald-800">{saved.length}件の試合を保存しました</p>
          {saved.map(s => (
            <Link key={s.id} href={`/games/${s.id}`} className="block text-sm text-emerald-700 underline hover:opacity-70">
              {s.title}
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || json.trim() === ''}
        className="w-full rounded-xl bg-band py-3 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50"
      >
        {loading
          ? (progress && progress.total > 1 ? `保存中... (${progress.done + 1}/${progress.total})` : '保存中...')
          : '試合結果を保存'}
      </button>
    </div>
  )
}
