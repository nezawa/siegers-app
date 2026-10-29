'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Game } from '@/types'
import OpponentSearch from './OpponentSearch'

const TEAM_NAME = '小雀シーガーズ'

// スマホの試合一覧で、シーガーズのチーム名のスコア側に添えるロゴ（相手チームのロゴは持っていない）。
// width/height は表示サイズ（高さ 32px）に合わせる。元画像の 1125px を渡すと、その大きさの画像が配信されてしまう
const teamLogo = (
  <Image src="/logo1.png" alt="" width={34} height={32} className="h-8 w-auto shrink-0" />
)

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
  if (result === 'O') return <span className={`${base} bg-slate-400`}>その他</span>
  return <span className={`${base} bg-gray-300 text-gray-600`}>-</span>
}

// 一覧の表示状態（年度・対戦相手・ページ）はURLに持たせる。
// 試合詳細から「一覧へ戻る」ときに、見ていたページへそのまま戻れるようにするため
export function gamesListQuery(year: string, opponent: string, page: number): string {
  const params = new URLSearchParams()
  if (year && year !== 'all') params.set('year', year)
  if (opponent) params.set('opponent', opponent)
  if (page > 1) params.set('page', String(page))
  return params.toString()
}

const withQuery = (path: string, query: string) => (query ? `${path}?${query}` : path)

// lastUpdated: 成績データの最終更新日時。取れない環境では null が渡り、表示を省く
export default function RecentGamesSection({ games, lastUpdated }: { games: Game[]; lastUpdated: string | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const years = useMemo(() => {
    const set = new Set(games.map(g => g.date.slice(0, 4)))
    return Array.from(set).sort((a, b) => Number(b) - Number(a))
  }, [games])

  // 年度を切り替えても選択が消えないよう、対戦相手の候補は全試合から作る
  const opponents = useMemo(
    () => [...new Set(games.map(g => g.opponent).filter(Boolean))].sort(),
    [games]
  )

  const selectedYear = searchParams.get('year') ?? 'all'
  const selectedOpponent = searchParams.get('opponent') ?? ''
  const PER_PAGE = 20

  const filteredGames = useMemo(
    () => games.filter(g =>
      (selectedYear === 'all' || g.date.startsWith(selectedYear)) &&
      (!selectedOpponent || g.opponent === selectedOpponent)
    ),
    [games, selectedYear, selectedOpponent]
  )

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / PER_PAGE))
  // 試合を削除した後などで、URLのページ番号が実際の総ページ数を超えることがある
  const page = Math.min(Math.max(1, Number(searchParams.get('page')) || 1), totalPages)

  const pagedGames = useMemo(
    () => filteredGames.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filteredGames, page]
  )

  // 年度・対戦相手・ページの切り替えは URL だけ差し替える。
  // router.replace と違いサーバーへの再取得が走らないので、一覧の操作は今までどおり即座に切り替わる
  // （History API は Next のルーターと連携していて useSearchParams にも反映される）
  const showList = (year: string, opponent: string, nextPage: number) =>
    window.history.replaceState(null, '', withQuery('/games', gamesListQuery(year, opponent, nextPage)))

  const openGame = (id: string) =>
    router.push(withQuery(`/games/${id}`, gamesListQuery(selectedYear, selectedOpponent, page)))

  const thCls = 'px-4 py-3 text-xs font-semibold text-white whitespace-nowrap'
  const selectCls = 'cursor-pointer appearance-none rounded-full border border-gray-200 bg-white py-1.5 pl-4 pr-9 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
  const selectChevron = (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-gray-900">
            <span className="inline-block h-5 w-1.5 rounded-full bg-band" />
            試合結果
          </h2>
          {/* スマホでは見出しの下の段で 2 つを横並びにし、対戦相手が残り幅を使う */}
          <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
            <div className="relative shrink-0">
              <select
                value={selectedYear}
                onChange={e => showList(e.target.value, selectedOpponent, 1)}
                aria-label="年度で絞り込む"
                className={selectCls}
              >
                <option value="all">全年度</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
              {selectChevron}
            </div>
            <OpponentSearch
              options={opponents}
              value={selectedOpponent}
              onChange={name => showList(selectedYear, name, 1)}
              className="min-w-0 flex-1 sm:w-56 sm:flex-none"
            />
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-400">成績データ更新：{lastUpdated}</p>
        )}
      </div>
      {pagedGames.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">試合データがありません</div>
      ) : (
        <>
          {/* モバイル: 先攻を左・後攻を右に置き、間に球場・スコア・勝敗を出す */}
          <div className="sm:hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
            {/* pr は行側の「>」アイコン幅 + 間隔ぶん。列の位置を行と揃える */}
            <div className="grid grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)] gap-2 bg-band py-2.5 pl-4 pr-[38px] text-center text-xs font-semibold text-white">
              <span>先攻</span>
              <span>スコア・勝敗</span>
              <span>後攻</span>
            </div>
            <div className="divide-y divide-gray-100">
              {pagedGames.map(game => {
                const d = formatDate(game.date)
                const badge = game.game_type ? GAME_TYPE_BADGE[game.game_type] : null
                const us = { name: TEAM_NAME, score: game.score_us, isUs: true }
                const them = { name: game.opponent, score: game.score_them, isUs: false }
                const [away, home] = game.is_home ? [them, us] : [us, them]
                const teamCls = (isUs: boolean) =>
                  `break-words text-sm font-bold leading-snug ${isUs ? 'text-blue-800' : 'text-gray-900'}`
                return (
                  <div
                    key={game.id}
                    onClick={() => openGame(game.id)}
                    className="cursor-pointer px-4 py-3 transition-colors active:bg-blue-50"
                  >
                    <div className="flex items-center gap-2">
                      {badge && (
                        <span className={`inline-flex shrink-0 rounded px-2 py-0.5 text-xs font-bold text-white ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                      <p className="text-sm font-bold tabular-nums text-gray-900">
                        {d.label}
                        <span className={`ml-0.5 text-xs ${d.isSun ? 'text-red-500' : d.isSat ? 'text-blue-500' : 'text-gray-400'}`}>
                          （{d.dow}）
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)] items-center gap-2">
                        <div className="flex min-w-0 items-center justify-end gap-1.5">
                          <p className={`${teamCls(away.isUs)} min-w-0 text-right`}>{away.name}</p>
                          {away.isUs && teamLogo}
                        </div>
                        <div className="text-center">
                          {game.venue && <p className="truncate text-[11px] text-gray-500">{game.venue}</p>}
                          <p className="text-lg font-extrabold tabular-nums text-blue-950">
                            {game.result ? `${away.score} - ${home.score}` : '-'}
                          </p>
                          <div className="mt-0.5">
                            <ResultBadge result={game.result} />
                          </div>
                        </div>
                        <div className="flex min-w-0 items-center justify-start gap-1.5">
                          {home.isUs && teamLogo}
                          <p className={`${teamCls(home.isUs)} min-w-0 text-left`}>{home.name}</p>
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
                  <th className={`${thCls} w-px text-center`}>試合日</th>
                  <th className={`${thCls} w-px text-center`}>開始時間</th>
                  <th className={`${thCls} w-px text-center`}>種別</th>
                  <th className={`${thCls} text-left`}>対戦チーム</th>
                  <th className={`${thCls} w-px text-right`}>スコア</th>
                  <th className={`${thCls} w-px text-center`}>勝敗</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedGames.map(game => {
                  const d = formatDate(game.date)
                  const badge = game.game_type ? GAME_TYPE_BADGE[game.game_type] : null
                  return (
                    <tr
                      key={game.id}
                      onClick={() => openGame(game.id)}
                      className="cursor-pointer odd:bg-white even:bg-slate-50/70 hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-center whitespace-nowrap font-bold tabular-nums text-gray-800">
                        {d.label}
                        <span className={`text-xs ${d.isSun ? 'text-red-500' : d.isSat ? 'text-blue-500' : 'text-gray-400'}`}>
                          （{d.dow}）
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap tabular-nums text-gray-600">
                        {formatTime(game.start_time) ?? <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
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
                onClick={() => showList(selectedYear, selectedOpponent, page - 1)}
                disabled={page === 1}
                className="h-8 w-8 rounded-full text-sm text-gray-600 transition-colors hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => showList(selectedYear, selectedOpponent, p)}
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
                onClick={() => showList(selectedYear, selectedOpponent, page + 1)}
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
