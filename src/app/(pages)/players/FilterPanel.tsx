'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Params = {
  year?: string
  from?: string
  to?: string
  gtype?: string
  q?: string
  tournament?: string
  opponent?: string
}

// 成績ページの絞り込みパネル。
// 1行目: 年度・試合種別・対戦相手・大会名のプルダウン
// 2行目: 期間指定と規定のチェックボックス（中央揃え）
// 3行目: 「絞り込む」ボタン
//
// 全ての条件はローカル state に溜めておき、「絞り込む」を押したときだけ URL に反映する。
// 呼び出し側（players/page.tsx）が適用済みパラメータを key に渡しているため、
// 画面遷移・ブラウザバックのたびに再マウントされ、入力欄は必ず URL の内容に戻る。
export default function FilterPanel({
  tab,
  year,
  from,
  to,
  gtype,
  q,
  tournament,
  opponent,
  years,
  tournaments,
  opponents,
  qualifiedLabel,
}: Params & {
  tab?: string
  years: string[]
  tournaments: string[]
  opponents: string[]
  qualifiedLabel?: string // 未指定なら規定チェックボックスを出さない（チーム成績タブ）
}) {
  const router = useRouter()
  const [yearSel, setYearSel] = useState(year ?? '')
  const [gtypeSel, setGtypeSel] = useState(gtype ?? '')
  const [opponentSel, setOpponentSel] = useState(opponent ?? '')
  const [tournamentSel, setTournamentSel] = useState(tournament ?? '')
  const [fromDate, setFromDate] = useState(from ?? '')
  const [toDate, setToDate] = useState(to ?? '')
  // 既定でONなので、URL に q が無い状態＝チェック済み（q=0 のときだけ外す）
  const [qualifiedOnly, setQualifiedOnly] = useState(q !== '0')

  const hasRange = Boolean(fromDate || toDate)

  // 年度と期間は排他。どちらかを触ったらもう一方の入力を空にして、選択中の条件を1つに保つ
  const changeYear = (value: string) => {
    setYearSel(value)
    if (value) {
      setFromDate('')
      setToDate('')
    }
  }

  const changeRange = (which: 'from' | 'to', value: string) => {
    if (value) setYearSel('')
    if (which === 'from') setFromDate(value)
    else setToDate(value)
  }

  const clearRange = () => {
    setFromDate('')
    setToDate('')
  }

  const applyFilters = () => {
    const p = new URLSearchParams()
    if (tab) p.set('tab', tab)
    if (yearSel && !hasRange) p.set('year', yearSel)
    if (fromDate) p.set('from', fromDate)
    if (toDate) p.set('to', toDate)
    if (gtypeSel) p.set('gtype', gtypeSel)
    if (opponentSel) p.set('opponent', opponentSel)
    if (tournamentSel) p.set('tournament', tournamentSel)
    if (!qualifiedOnly) p.set('q', '0')
    const s = p.toString()
    router.push(s ? `/players?${s}` : '/players')
  }

  const selectCls =
    'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
  const dateCls =
    'min-w-0 flex-1 sm:flex-none rounded-lg border border-gray-200 bg-white px-1.5 sm:px-2.5 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
      {/* 年度・試合種別・対戦相手・大会名 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select value={yearSel} onChange={e => changeYear(e.target.value)} className={selectCls} aria-label="年度で絞り込み">
          <option value="">通算</option>
          {years.map(y => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
        <select
          value={gtypeSel}
          onChange={e => setGtypeSel(e.target.value)}
          className={selectCls}
          aria-label="試合種別で絞り込み"
        >
          <option value="">試合種別</option>
          <option value="official">公式戦</option>
          <option value="practice">練習試合</option>
        </select>
        <select
          value={opponentSel}
          onChange={e => setOpponentSel(e.target.value)}
          className={selectCls}
          aria-label="対戦相手で絞り込み"
        >
          <option value="">対戦相手</option>
          {opponents.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          value={tournamentSel}
          onChange={e => setTournamentSel(e.target.value)}
          className={selectCls}
          aria-label="大会名で絞り込み"
        >
          <option value="">大会名</option>
          {tournaments.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* 期間・規定（中央揃え） */}
      <div className="flex flex-col items-center gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:justify-center sm:gap-6">
        <div className="flex w-full min-w-0 items-center gap-1.5 sm:w-auto sm:gap-2">
          <span className="shrink-0 text-sm text-gray-500">期間：</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => changeRange('from', e.target.value)}
            className={dateCls}
            aria-label="開始日"
          />
          <span className="shrink-0 text-sm text-gray-400">〜</span>
          <input
            type="date"
            value={toDate}
            onChange={e => changeRange('to', e.target.value)}
            className={dateCls}
            aria-label="終了日"
          />
        </div>
        {qualifiedLabel && (
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={qualifiedOnly}
              onChange={e => setQualifiedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-band"
            />
            {qualifiedLabel}
          </label>
        )}
      </div>

      {/* 絞り込む */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-xl bg-band px-10 py-2 text-sm font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg"
        >
          絞り込む
        </button>
        {hasRange && (
          <button
            type="button"
            onClick={clearRange}
            className="rounded-xl bg-white px-4 py-2 text-sm text-gray-600 ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:ring-gray-300"
          >
            期間クリア
          </button>
        )}
      </div>
    </div>
  )
}
