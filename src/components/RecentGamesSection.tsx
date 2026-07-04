'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Game } from '@/types'

const DOW_JA = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    // ゼロ埋めで桁数を固定し、後ろに続く（曜日）の位置が縦に揃うようにする
    label: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`,
    dow: DOW_JA[d.getDay()],
    isSat: d.getDay() === 6,
    isSun: d.getDay() === 0,
  }
}

// Postgres の time 型（"13:00:00"）を "13:00" 表記にする
function formatTime(time: string | null) {
  return time ? time.slice(0, 5) : null
}

const GAME_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  official: { label: '公式戦', cls: 'bg-emerald-600' },
  practice: { label: '練習試合', cls: 'bg-sky-500' },
  other: { label: 'その他', cls: 'bg-gray-500' },
}

function ResultBadge({ result }: { result: Game['result'] }) {
  const base = 'inline-flex w-16 justify-center rounded-md py-1 text-xs font-bold text-white'
  if (result === 'W') return <span className={`${base} bg-red-600`}>勝ち</span>
  if (result === 'L') return <span className={`${base} bg-blue-600`}>負け</span>
  if (result === 'D') return <span className={`${base} bg-gray-500`}>引分け</span>
  return <span className={`${base} bg-gray-300 text-gray-600`}>-</span>
}

export default function RecentGamesSection({ games }: { games: Game[] }) {
  const router = useRouter()

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

  const thCls = 'px-4 py-3 text-xs font-semibold text-white whitespace-nowrap'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-gray-900">
            <span className="inline-block h-5 w-1.5 rounded-full bg-band" />
            試合結果
          </h2>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={e => handleYearChange(e.target.value)}
              aria-label="年度で絞り込む"
              className="cursor-pointer appearance-none rounded-full border border-gray-200 bg-white py-1.5 pl-4 pr-9 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="all">全年度</option>
              {years.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      {pagedGames.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">試合データがありません</div>
      ) : (
        <>
          {/* モバイル: 2段組のコンパクト表示 */}
          <div className="sm:hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
            <div className="flex items-center justify-between bg-band px-4 py-2.5 text-xs font-semibold text-white">
              <span>試合日・対戦チーム</span>
              <span>スコア・勝敗</span>
            </div>
            <div className="divide-y divide-gray-100">
              {pagedGames.map(game => {
                const d = formatDate(game.date)
                const badge = game.game_type ? GAME_TYPE_BADGE[game.game_type] : null
                return (
                  <div
                    key={game.id}
                    onClick={() => router.push(`/games/${game.id}`)}
                    className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 transition-colors active:bg-blue-50"
                  >
                    <div className="min-w-0">
                      <p className="font-bold tabular-nums text-gray-900">
                        {d.label}
                        <span className={`ml-1 text-xs ${d.isSun ? 'text-red-500' : d.isSat ? 'text-blue-500' : 'text-gray-400'}`}>
                          （{d.dow}）
                        </span>
                        {formatTime(game.start_time) && (
                          <span className="ml-1 text-xs font-medium text-gray-500">{formatTime(game.start_time)}〜</span>
                        )}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {badge && (
                          <span className={`inline-flex shrink-0 rounded px-2 py-0.5 text-xs font-bold text-white ${badge.cls}`}>
                            {badge.label}
                          </span>
                        )}
                        <span className="truncate font-bold text-gray-900">{game.opponent}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <div className="text-center">
                        <p className="text-lg font-extrabold tabular-nums text-blue-950">
                          {game.result ? `${game.score_us} - ${game.score_them}` : '-'}
                        </p>
                        <div className="mt-1">
                          <ResultBadge result={game.result} />
                        </div>
                      </div>
                      <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* PC: テーブル表示 */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-band">
                <tr>
                  <th className={`${thCls} w-px text-left`}>試合日</th>
                  <th className={`${thCls} w-px text-left`}>開始時間</th>
                  <th className={`${thCls} w-px text-left`}>種別</th>
                  <th className={`${thCls} text-left`}>対戦チーム</th>
                  <th className={`${thCls} w-px text-right`}>スコア</th>
                  <th className={`${thCls} w-px text-right`}>勝敗</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedGames.map(game => {
                  const d = formatDate(game.date)
                  const badge = game.game_type ? GAME_TYPE_BADGE[game.game_type] : null
                  return (
                    <tr
                      key={game.id}
                      onClick={() => router.push(`/games/${game.id}`)}
                      className="cursor-pointer odd:bg-white even:bg-slate-50/70 hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap font-bold tabular-nums text-gray-800">
                        {d.label}
                        <span className={`text-xs ${d.isSun ? 'text-red-500' : d.isSat ? 'text-blue-500' : 'text-gray-400'}`}>
                          （{d.dow}）
                        </span>
                      </td>
                      <td className="px-4 py-4 text-left whitespace-nowrap tabular-nums text-gray-600">
                        {formatTime(game.start_time) ?? <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-4 text-left whitespace-nowrap">
                        {badge ? (
                          <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold text-white ${badge.cls}`}>
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-900">
                        {game.opponent}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap text-base font-extrabold tabular-nums text-blue-950">
                        {game.result ? `${game.score_us} - ${game.score_them}` : '-'}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <ResultBadge result={game.result} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                      ? 'bg-band text-white shadow'
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
