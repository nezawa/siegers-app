'use client'

import { useRouter } from 'next/navigation'

// 通算記録室「達成済みの記録」の年度プルダウン。選んだ時点で URL（ryear）に反映する
export default function AchievedYearSelect({ years, selected }: { years: string[]; selected: string | null }) {
  const router = useRouter()

  return (
    <select
      value={selected ?? 'all'}
      onChange={e => router.push(`/players?tab=records&ryear=${e.target.value}`, { scroll: false })}
      className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      aria-label="達成済みの記録の年度"
    >
      {years.map(y => (
        <option key={y} value={y}>{y}年</option>
      ))}
      <option value="all">全年度</option>
    </select>
  )
}
