'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { errorMessage } from '@/lib/errorMessage'
import { ALL, type GameType } from '@/app/(pages)/players/filterDefaults'

type Props = {
  defaultYear: string | null
  defaultGtype: GameType | null
  years: string[]
}

// 成績ページ(/players)を開いた直後に適用される絞り込みの既定値。
// DB では null が「絞り込まない」なので、画面上の 'all' と相互変換する。
export default function StatsDefaultsForm({ defaultYear, defaultGtype, years }: Props) {
  const [yearSel, setYearSel] = useState(defaultYear ?? ALL)
  const [gtypeSel, setGtypeSel] = useState<string>(defaultGtype ?? ALL)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('settings').upsert({
        id: 1,
        default_stats_year: yearSel === ALL ? null : yearSel,
        default_stats_game_type: gtypeSel === ALL ? null : gtypeSel,
      })
      if (err) throw err
      setSaved(true)
    } catch (err: unknown) {
      setError(`保存に失敗しました: ${errorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const selectCls =
    'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <h2 className="mb-1 border-l-4 border-band pl-2.5 font-bold text-gray-900">成績ページの既定表示</h2>
        <p className="mb-5 pl-3.5 text-xs text-gray-400">
          成績ページを開いたときに最初から選ばれている条件です。閲覧者は画面上で変更できます
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="default-year" className="mb-2 block text-sm font-medium text-gray-700">年度</label>
            <select
              id="default-year"
              value={yearSel}
              onChange={e => setYearSel(e.target.value)}
              className={selectCls}
            >
              <option value={ALL}>通算</option>
              {years.map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="default-gtype" className="mb-2 block text-sm font-medium text-gray-700">試合種別</label>
            <select
              id="default-gtype"
              value={gtypeSel}
              onChange={e => setGtypeSel(e.target.value)}
              className={selectCls}
            >
              <option value={ALL}>全試合</option>
              <option value="official">公式戦</option>
              <option value="practice">練習試合</option>
            </select>
          </div>
        </div>

        {/* 操作ボタンは、対象の設定と同じカード内に置く */}
        <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          {saved && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">保存しました</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-band py-3 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50">
            {loading ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </form>
  )
}
