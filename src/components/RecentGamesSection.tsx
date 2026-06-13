'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Game } from '@/types'

function ResultBadge({ result }: { result: Game['result'] }) {
  if (result === 'W') return <span className="inline-flex w-9 justify-center rounded-md bg-red-600 py-1 text-xs font-bold text-white shadow-sm">勝</span>
  if (result === 'L') return <span className="inline-flex w-9 justify-center rounded-md bg-gray-500 py-1 text-xs font-bold text-white shadow-sm">負</span>
  if (result === 'D') return <span className="inline-flex w-9 justify-center rounded-md bg-green-600 py-1 text-xs font-bold text-white shadow-sm">分</span>
  return null
}

const ACCENT: Record<string, string> = {
  W: 'bg-red-500',
  L: 'bg-gray-400',
  D: 'bg-green-500',
}

export default function RecentGamesSection({ games }: { games: Game[] }) {
  const years = useMemo(() => {
    const set = new Set(games.map(g => g.date.slice(0, 4)))
    return Array.from(set).sort((a, b) => Number(b) - Number(a))
  }, [games])

  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  const filteredGames = useMemo(
    () => selectedYear === 'all' ? games : games.filter(g => g.date.startsWith(selectedYear)),
    [games, selectedYear]
  )

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / PER_PAGE))

  const pagedGames = useMemo(
    () => filteredGames.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filteredGames, page]
  )

  function handleYearChange(year: string) {
    setSelectedYear(year)
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-gray-900">
            <span className="inline-block h-5 w-1.5 rounded-full bg-gradient-to-b from-blue-700 to-blue-950" />
            最近の試合
          </h2>
          <select
            value={selectedYear}
            onChange={e => handleYearChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="all">全年度</option>
            {years.map(year => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>
        </div>
      </div>
      {pagedGames.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">試合データがありません</div>
      ) : (
        <>
          <div className="space-y-3">
            {pagedGames.map(game => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group flex items-stretch gap-3 overflow-hidden rounded-2xl bg-white px-4 sm:px-5 py-3.5 sm:py-4 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-900/15"
              >
                <span className={`w-1 shrink-0 self-stretch rounded-full ${ACCENT[game.result ?? ''] ?? 'bg-gray-200'}`} />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ResultBadge result={game.result} />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-gray-900">vs {game.opponent}</div>
                      <div className="truncate text-xs sm:text-sm text-gray-400">{game.date}{game.venue && `・${game.venue}`}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-xl sm:text-2xl font-extrabold tabular-nums text-blue-950">
                      {game.score_us}<span className="mx-1 text-gray-300">-</span>{game.score_them}
                    </div>
                    <svg className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-1.5">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="h-8 w-8 rounded-full text-sm text-gray-600 transition-colors hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-blue-950 text-white shadow'
                      : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="h-8 w-8 rounded-full text-sm text-gray-600 transition-colors hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
