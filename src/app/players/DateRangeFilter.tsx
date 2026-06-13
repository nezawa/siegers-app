'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DateRangeFilter({
  tab,
  from,
  to,
}: {
  tab?: string
  from?: string
  to?: string
}) {
  const router = useRouter()
  const [fromDate, setFromDate] = useState(from ?? '')
  const [toDate, setToDate] = useState(to ?? '')

  const buildUrl = (params: { from?: string; to?: string }) => {
    const p = new URLSearchParams()
    if (tab) p.set('tab', tab)
    if (params.from) p.set('from', params.from)
    if (params.to) p.set('to', params.to)
    const s = p.toString()
    return s ? `/players?${s}` : '/players'
  }

  const apply = () => {
    if (!fromDate && !toDate) return
    router.push(buildUrl({ from: fromDate || undefined, to: toDate || undefined }))
  }

  const clear = () => {
    setFromDate('')
    setToDate('')
    router.push(buildUrl({}))
  }

  const inputCls =
    'rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

  const active = Boolean(from || to)

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500">期間：</span>
      <input
        type="date"
        value={fromDate}
        onChange={e => setFromDate(e.target.value)}
        className={inputCls}
        aria-label="開始日"
      />
      <span className="text-sm text-gray-400">〜</span>
      <input
        type="date"
        value={toDate}
        onChange={e => setToDate(e.target.value)}
        className={inputCls}
        aria-label="終了日"
      />
      <button
        onClick={apply}
        className="rounded-full bg-blue-950 px-3.5 py-1.5 text-sm font-medium text-white shadow transition-colors hover:bg-blue-900"
      >
        適用
      </button>
      {active && (
        <button
          onClick={clear}
          className="rounded-full bg-white px-3.5 py-1.5 text-sm text-gray-600 ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:ring-gray-300"
        >
          クリア
        </button>
      )}
    </div>
  )
}
