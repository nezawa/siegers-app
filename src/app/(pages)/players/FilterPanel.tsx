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

const PARAM_KEYS = ['year', 'from', 'to', 'gtype', 'q', 'tournament', 'opponent'] as const

// 成績ページの絞り込みパネル。
// 1行目: 年度・試合種別・対戦相手・大会名のプルダウン（選択で即反映）
// 2行目: 期間指定（適用ボタンで反映）と規定のチェックボックス
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
  const [fromDate, setFromDate] = useState(from ?? '')
  const [toDate, setToDate] = useState(to ?? '')
  const qualifiedOnly = q === '1'

  const push = (over: Partial<Params>) => {
    const merged: Params = { year, from, to, gtype, q, tournament, opponent, ...over }
    const p = new URLSearchParams()
    if (tab) p.set('tab', tab)
    PARAM_KEYS.forEach(k => {
      if (merged[k]) p.set(k, merged[k]!)
    })
    const s = p.toString()
    router.push(s ? `/players?${s}` : '/players')
  }

  // 年度と期間は排他（年度を選んだら期間はクリア）
  const changeYear = (value: string) => {
    setFromDate('')
    setToDate('')
    push({ year: value || undefined, from: undefined, to: undefined })
  }

  const applyRange = () => {
    if (!fromDate && !toDate) return
    push({ from: fromDate || undefined, to: toDate || undefined, year: undefined })
  }

  const clearRange = () => {
    setFromDate('')
    setToDate('')
    push({ from: undefined, to: undefined })
  }

  const selectCls =
    'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
  const dateCls =
    'min-w-0 flex-1 sm:flex-none rounded-lg border border-gray-200 bg-white px-1.5 sm:px-2.5 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
      {/* 年度・試合種別・対戦相手・大会名 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select value={year ?? ''} onChange={e => changeYear(e.target.value)} className={selectCls} aria-label="年度で絞り込み">
          <option value="">通算</option>
          {years.map(y => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
        <select
          value={gtype ?? ''}
          onChange={e => push({ gtype: e.target.value || undefined })}
          className={selectCls}
          aria-label="試合種別で絞り込み"
        >
          <option value="">試合種別</option>
          <option value="official">公式戦</option>
          <option value="practice">練習試合</option>
        </select>
        <select
          value={opponent ?? ''}
          onChange={e => push({ opponent: e.target.value || undefined })}
          className={selectCls}
          aria-label="対戦相手で絞り込み"
        >
          <option value="">対戦相手</option>
          {opponents.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          value={tournament ?? ''}
          onChange={e => push({ tournament: e.target.value || undefined })}
          className={selectCls}
          aria-label="大会名で絞り込み"
        >
          <option value="">大会名</option>
          {tournaments.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* 期間・規定 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-3">
        <div className="flex w-full min-w-0 items-center gap-1.5 sm:w-auto sm:gap-2">
          <span className="shrink-0 text-sm text-gray-500">期間：</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className={dateCls}
            aria-label="開始日"
          />
          <span className="shrink-0 text-sm text-gray-400">〜</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className={dateCls}
            aria-label="終了日"
          />
          <button
            onClick={applyRange}
            className="shrink-0 rounded-full bg-band px-2.5 sm:px-3.5 py-1.5 text-sm font-medium text-white shadow transition-colors hover:bg-band/80"
          >
            適用
          </button>
          {Boolean(from || to) && (
            <button
              onClick={clearRange}
              aria-label="期間指定をクリア"
              className="shrink-0 rounded-full bg-white px-2.5 sm:px-3.5 py-1.5 text-sm text-gray-600 ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:ring-gray-300"
            >
              <span className="sm:hidden">✕</span>
              <span className="hidden sm:inline">クリア</span>
            </button>
          )}
        </div>
        {qualifiedLabel && (
          <label className="mx-auto flex cursor-pointer select-none items-center gap-2 text-sm text-gray-600 sm:mx-0">
            <input
              type="checkbox"
              checked={qualifiedOnly}
              onChange={() => push({ q: qualifiedOnly ? undefined : '1' })}
              className="h-4 w-4 rounded border-gray-300 accent-band"
            />
            {qualifiedLabel}
          </label>
        )}
      </div>
    </div>
  )
}
