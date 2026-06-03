'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Game } from '@/types'

function ResultBadge({ result }: { result: Game['result'] }) {
  if (result === 'W') return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-sm font-medium">勝</span>
  if (result === 'L') return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-sm font-medium">負</span>
  if (result === 'D') return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm font-medium">分</span>
  return null
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
          <h2 className="text-lg font-bold text-gray-900">最近の試合</h2>
          <select
            value={selectedYear}
            onChange={e => handleYearChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全年度</option>
            {years.map(year => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>
        </div>
      </div>
      {pagedGames.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl shadow-sm">試合データがありません</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {pagedGames.map(game => (
              <Link key={game.id} href={`/games/${game.id}`} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ResultBadge result={game.result} />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">vs {game.opponent}</div>
                    <div className="text-xs sm:text-sm text-gray-400 truncate">{game.date}{game.venue && `・${game.venue}`}</div>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 shrink-0">{game.score_us} - {game.score_them}</div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${p === page ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
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
