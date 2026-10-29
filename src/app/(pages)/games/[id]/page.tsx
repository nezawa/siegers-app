import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Game } from '@/types'
import DeleteGameButton from './DeleteGameButton'
import GameStatsTabs from './GameStatsTabs'

const TEAM_NAME = '小雀シーガーズ'

const GAME_TYPE_LABEL: Record<string, string> = { official: '公式戦', practice: '練習試合', other: 'その他' }
const DOW_JA = ['日', '月', '火', '水', '木', '金', '土']

// "2026-10-03" → "2026/10/03(土)"
function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${dateStr.replace(/-/g, '/')}(${DOW_JA[d.getDay()]})`
}

// 入力フォームは 9 回分の欄を保存するため、配列の後ろに未入力（null）の回が残る。
// 表示する回数は「最後に点が入力された回」までとし、最低 7 回（草野球の規定回数）は出す
function inningCount(...rows: ((number | null)[] | null)[]) {
  let last = 0
  rows.forEach(arr => arr?.forEach((v, i) => { if (v != null) last = Math.max(last, i + 1) }))
  return Math.max(last, 7)
}

function ResultBadge({ result }: { result: Game['result'] }) {
  if (result === 'W') return <span className="rounded-full bg-red-600 px-3.5 py-1 text-sm font-bold text-white shadow-sm">勝利</span>
  if (result === 'L') return <span className="rounded-full bg-blue-600 px-3.5 py-1 text-sm font-bold text-white shadow-sm">敗戦</span>
  if (result === 'D') return <span className="rounded-full bg-gray-500 px-3.5 py-1 text-sm font-bold text-white shadow-sm">引分</span>
  if (result === 'O') return <span className="rounded-full bg-slate-400 px-3.5 py-1 text-sm font-bold text-white shadow-sm">その他</span>
  return null
}

// 列名は 4 文字以上なら "\n" で 2 行に折り返す（列幅を広げないため）
const BATTING_HEADS = [
  '打順', '選手', '打席', '打数', '安打', '本塁打', '打点', '得点', '盗塁', '二塁打', '三塁打',
  '得点圏\n打数', '得点圏\n安打', '三振', '四球', '死球', '犠打', '犠飛', '併殺打', '敵失', '失策', '盗塁\n阻止',
]

const PITCHING_HEADS = [
  '選手', '勝', 'H', 'S', '敗', '投球回', '投球数', '失点', '自責点', '完投', '完封',
  '被安打', '被本\n塁打', '奪三振', '与四球', '与死球', 'ボーク', '暴投',
]

function SectionHeading({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-gray-900">
      <span className="inline-block h-5 w-1.5 rounded-full bg-band" />
      {href ? (
        <Link href={href} className="group inline-flex items-center gap-1 transition-colors hover:text-blue-700">
          {children}
          <span className="text-gray-400 transition-colors group-hover:text-blue-700">›</span>
        </Link>
      ) : (
        children
      )}
    </h2>
  )
}

// 選手名セル。選手が紐づいていれば成績詳細ページへのリンクにする
function PlayerName({ player }: { player: unknown }) {
  const p = player as { id?: string; name?: string } | null
  if (!p?.id) return <>{p?.name ?? '-'}</>
  return (
    <Link href={`/players/${p.id}`} className="transition-colors hover:text-blue-700 hover:underline">
      {p.name ?? '-'}
    </Link>
  )
}

// タブに「小雀シーガーズ | 2025/05/03 vs レッドスターズ」のように試合の概要を出す。
// 表示用に必要な列だけを取る軽いクエリにしている
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: game } = await supabase
    .from('games')
    .select('date, opponent, score_us, score_them, result')
    .eq('id', id)
    .single()

  if (!game) return { title: '試合結果' }

  const date = game.date.replace(/-/g, '/')
  const score = game.result ? ` ${game.score_us}-${game.score_them}` : ''
  return { title: `${date} vs ${game.opponent}${score}` }
}

export default async function GameDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ year?: string; opponent?: string; page?: string }>
}) {
  const { id } = await params
  // 一覧から渡された表示状態（年度・対戦相手・ページ）。戻る・編集・削除で持ち回り、見ていたページへ帰れるようにする
  const { year, opponent, page } = await searchParams
  const listQuery = new URLSearchParams()
  if (year) listQuery.set('year', year)
  if (opponent) listQuery.set('opponent', opponent)
  if (page) listQuery.set('page', page)
  const query = listQuery.toString()
  const backHref = query ? `/games?${query}` : '/games'
  const editHref = query ? `/admin/games/${id}/edit?${query}` : `/admin/games/${id}/edit`

  const supabase = await createClient()

  const [{ data: game }, { data: batting }, { data: pitching }, { data: { user } }] = await Promise.all([
    supabase.from('games').select('*').eq('id', id).single(),
    supabase.from('batting_stats').select('*, players(*)').eq('game_id', id).order('batting_order'),
    supabase.from('pitching_stats').select('*, players(*)').eq('game_id', id),
    supabase.auth.getUser(),
  ])

  if (!game) notFound()

  const battingData = batting ?? []
  const pitchingData = pitching ?? []

  const thCls = 'px-1 py-2.5 font-semibold text-white text-center whitespace-pre leading-tight text-xs align-middle'
  const tdCls = 'px-1 sm:px-2 py-3 text-center tabular-nums'
  const rowCls = 'odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/70 transition-colors'

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        {/* News 詳細の「‹ News」と同じ見た目。スコアより目立たせない */}
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          試合結果
        </Link>
        {/* スマホはバナーの外（上）に編集・削除を置く。PC はバナー内 */}
        {user && (
          <div className="flex items-center gap-2 sm:hidden">
            <Link href={editHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-gray-50">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              編集
            </Link>
            <DeleteGameButton gameId={id} backHref={backHref}
              className="rounded-lg bg-white px-3 py-1 text-sm font-medium text-red-600 shadow-sm ring-1 ring-red-300 transition-colors hover:bg-red-50 disabled:opacity-50" />
          </div>
        )}
      </div>

      {/* スマホ: スポーツ速報サイト風（バナー内にイニングスコア、成績はタブ切り替え） */}
      <div className="space-y-6 sm:hidden">
        {/* スコアボード（先攻 vs 後攻・試合情報・イニングスコア） */}
        {(() => {
          const us = game.innings_us ?? []
          const them = game.innings_them ?? []
          // 延長したときだけ 8 回以降の列が増える
          const len = inningCount(us, them)
          const innings = Array.from({ length: len }, (_, i) => i)

          // 安打・失策はシーガーズの成績から出す。相手の安打は投手の被安打の合計、相手の失策は記録がないので「-」
          const hasBatting = battingData.length > 0
          const hasPitching = pitchingData.length > 0
          const sum = (rows: Record<string, unknown>[], key: string) =>
            rows.reduce((n, r) => n + (Number(r[key]) || 0), 0)

          // 先攻（away）が上段、後攻（home）が下段
          const isHome = game.is_home ?? false
          const usRow = {
            label: TEAM_NAME, scores: us, total: game.score_us, isUs: true,
            hits: hasBatting ? sum(battingData, 'hits') : null,
            errors: hasBatting ? sum(battingData, 'errors') : null,
          }
          const themRow = {
            label: game.opponent, scores: them, total: game.score_them, isUs: false,
            hits: hasPitching ? sum(pitchingData, 'hits_allowed') : null,
            errors: null,
          }
          const awayRow = isHome ? themRow : usRow
          const homeRow = isHome ? usRow : themRow

          // 後攻（home）の最終回マーカーを算出
          const lastIdx = (arr: (number | null)[]) => {
            let last = -1
            arr.forEach((v, i) => { if (v != null) last = i })
            return last
          }
          const finalIdx = Math.max(lastIdx(awayRow.scores), lastIdx(homeRow.scores))
          const homeWon = homeRow.total > awayRow.total
          // crossIdx: 後攻が最終回裏に攻撃不要だった回（×）、walkoffIdx: サヨナラの回（得点+x）
          let crossIdx = -1
          let walkoffIdx = -1
          if (homeWon && finalIdx >= 0) {
            if (homeRow.scores[finalIdx] == null) crossIdx = finalIdx
            else walkoffIdx = finalIdx
          }

          const cell = (scores: (number | null)[], i: number, isHomeRow: boolean): string => {
            if (isHomeRow && i === crossIdx) return '×'
            const v = scores[i]
            if (v == null) return ''
            if (isHomeRow && i === walkoffIdx) return `${v}x`
            return String(v)
          }

          const rows = [
            { ...awayRow, isHomeRow: false },
            { ...homeRow, isHomeRow: true },
          ]
          const hasInnings = us.length > 0 || them.length > 0
          const boxCls = 'rounded bg-white/15 py-1.5 text-center tabular-nums'

          return (
            <div className="relative overflow-hidden rounded-3xl bg-band text-white shadow-xl shadow-blue-950/20">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[18px] border-white/10" />
              <div className="relative p-4">
                <div className="text-center">
                  <h1 className="text-lg font-bold sm:text-2xl">
                    <span className={awayRow.isUs ? 'text-amber-300' : ''}>{awayRow.label}</span>
                    <span className="mx-2 text-sm font-medium text-white/70 sm:text-base">vs</span>
                    <span className={homeRow.isUs ? 'text-amber-300' : ''}>{homeRow.label}</span>
                  </h1>
                  {(game.game_type || game.tournament) && (
                    <p className="mt-1 text-xs text-white/85">
                      [{[game.game_type && GAME_TYPE_LABEL[game.game_type], game.tournament].filter(Boolean).join('・')}]
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-white/85">
                    {formatDate(game.date)}
                    {game.start_time && ` ${game.start_time.slice(0, 5)}`}
                    {game.venue && ` ${game.venue}`}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-center gap-4">
                  <span className="text-4xl font-extrabold tabular-nums sm:text-5xl">{awayRow.total}</span>
                  <span className="text-2xl text-white/60">-</span>
                  <span className="text-4xl font-extrabold tabular-nums sm:text-5xl">{homeRow.total}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                  <ResultBadge result={game.result} />
                </div>

                {hasInnings && (
                  // 7回 + 計・安・失 は画面幅に収め、延長（8回以降）があるときだけ横スクロールになる。
                  // チーム名は頭文字 1 文字にして、スクロール中も見えるよう左端に固定する
                  <div className="-mx-1 mt-6 overflow-x-auto">
                    <table className="w-full min-w-max border-separate border-spacing-[3px] text-sm">
                      <thead>
                        <tr className="text-xs font-semibold text-white/80">
                          <th className="sticky left-0 z-10 bg-band"></th>
                          {innings.map(i => <th key={i} className="min-w-6">{i + 1}</th>)}
                          <th className="min-w-6 text-amber-300">計</th>
                          <th className="min-w-6">安</th>
                          <th className="min-w-6">失</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(row => (
                          <tr key={row.label}>
                            <td className={`sticky left-0 z-10 w-6 bg-band text-center font-bold ${row.isUs ? 'text-amber-300' : ''}`}>
                              {Array.from(String(row.label))[0]}
                            </td>
                            {innings.map(i => (
                              <td key={i} className={boxCls}>{cell(row.scores, i, row.isHomeRow)}</td>
                            ))}
                            <td className={`${boxCls} font-extrabold text-amber-300`}>{row.total}</td>
                            <td className={boxCls}>{row.hits ?? '-'}</td>
                            <td className={boxCls}>{row.errors ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {game.notes && <p className="mt-6 border-t border-white/10 pt-4 text-sm text-white/85">{game.notes}</p>}
              </div>
            </div>
          )
        })()}

        <GameStatsTabs batting={battingData} pitching={pitchingData} />
      </div>

      {/* PC: 従来の表示 */}
      <div className="hidden space-y-8 sm:block">
        {/* スコアボード */}
        <div className="relative overflow-hidden rounded-3xl bg-band text-white shadow-xl shadow-blue-950/20">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <p className="text-sm text-white/80">
                {game.date}
                {game.start_time && ` ${game.start_time.slice(0, 5)}〜`}
                {game.venue && `・${game.venue}`}
                {game.game_type && (
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/85">
                    {({ official: '公式戦', practice: '練習試合', other: 'その他' } as Record<string, string>)[game.game_type]}
                  </span>
                )}
                {game.tournament && (
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/85">
                    {game.tournament}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-3">
                <ResultBadge result={game.result} />
                {user && (
                  <>
                    <Link href={editHref}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm ring-1 ring-white/40 transition-all hover:bg-white/25">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      編集
                    </Link>
                    <DeleteGameButton gameId={id} backHref={backHref} />
                  </>
                )}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6 text-center">
              <div className="justify-self-end text-right">
                <p className="text-sm sm:text-lg font-bold text-amber-300">小雀シーガーズ</p>
              </div>
              <div className="text-4xl sm:text-6xl font-extrabold tabular-nums">
                {game.score_us}
                <span className="mx-2 sm:mx-4 text-2xl sm:text-4xl text-white/60">-</span>
                {game.score_them}
              </div>
              <div className="justify-self-start text-left">
                <p className="text-sm sm:text-lg font-bold">{game.opponent}</p>
              </div>
            </div>
            {game.notes && <p className="mt-6 border-t border-white/10 pt-4 text-sm text-white/85">{game.notes}</p>}
          </div>
        </div>

        {(game.innings_us || game.innings_them) && (() => {
          const us = game.innings_us ?? []
          const them = game.innings_them ?? []
          const len = inningCount(us, them)
          const innings = Array.from({ length: len }, (_, i) => i)

          // 先攻（away）が上段、後攻（home）が下段
          const isHome = game.is_home ?? false
          const usRow = { label: '小雀シーガーズ', scores: us, total: game.score_us }
          const themRow = { label: game.opponent, scores: them, total: game.score_them }
          const awayRow = isHome ? themRow : usRow
          const homeRow = isHome ? usRow : themRow

          // 後攻（home）の最終回マーカーを算出
          const lastIdx = (arr: (number | null)[]) => {
            let last = -1
            arr.forEach((v, i) => { if (v != null) last = i })
            return last
          }
          const finalIdx = Math.max(lastIdx(awayRow.scores), lastIdx(homeRow.scores))
          const homeWon = homeRow.total > awayRow.total
          // crossIdx: 後攻が最終回裏に攻撃不要だった回（×）、walkoffIdx: サヨナラの回（得点+x）
          let crossIdx = -1
          let walkoffIdx = -1
          if (homeWon && finalIdx >= 0) {
            if (homeRow.scores[finalIdx] == null) crossIdx = finalIdx
            else walkoffIdx = finalIdx
          }

          const cell = (scores: (number | null)[], i: number, isHomeRow: boolean): string => {
            if (isHomeRow && i === crossIdx) return '×'
            const v = scores[i]
            if (v == null) return ''
            if (isHomeRow && i === walkoffIdx) return `${v}x`
            return String(v)
          }

          const rows = [
            { ...awayRow, isHomeRow: false },
            { ...homeRow, isHomeRow: true },
          ]

          return (
            <div className="mx-auto w-fit max-w-full overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
              <table className="border-collapse text-sm sm:text-base">
                <thead className="bg-band text-white">
                  <tr className="text-center">
                    <th className="px-4 py-2.5 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white"></th>
                    {innings.map(i => (
                      <th key={i} className="w-8 px-2 py-2.5 sm:w-12 sm:px-3 sm:py-4 text-xs sm:text-sm font-semibold text-white">{i + 1}</th>
                    ))}
                    <th className="px-3 py-2.5 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-amber-300">R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(row => (
                    <tr key={row.label} className="text-center odd:bg-white even:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-2.5 sm:px-6 sm:py-4 text-left text-xs sm:text-base font-semibold text-gray-700">{row.label}</td>
                      {innings.map(i => (
                        <td key={i} className="px-2 py-2.5 sm:px-3 sm:py-4 text-sm sm:text-lg tabular-nums">
                          {cell(row.scores, i, row.isHomeRow)}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 sm:px-5 sm:py-4 text-sm sm:text-xl font-extrabold tabular-nums text-blue-950">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}

        {battingData.length > 0 && (
          <div>
            <SectionHeading href="/players">打撃成績</SectionHeading>
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
              <table className="w-full min-w-max table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-10" />
                  <col className="w-24" />
                  {BATTING_HEADS.slice(2).map(h => <col key={h} className="w-12" />)}
                </colgroup>
                <thead className="bg-band">
                  <tr>
                    {BATTING_HEADS.map((h, i) => (
                      <th key={h} className={`${thCls} ${i === 1 ? 'px-1.5 sm:px-2 text-left' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {battingData.map(stat => (
                    <tr key={stat.id} className={rowCls}>
                      <td className={`${tdCls} text-gray-500`}>{stat.batting_order ?? '-'}</td>
                      <td className="whitespace-nowrap px-1.5 sm:px-2 py-3 font-bold text-gray-900"><PlayerName player={stat.players} /></td>
                      <td className={tdCls}>{stat.pa}</td>
                      <td className={tdCls}>{stat.ab}</td>
                      <td className={tdCls}>{stat.hits}</td>
                      <td className={tdCls}>{stat.hr}</td>
                      <td className={tdCls}>{stat.rbi}</td>
                      <td className={tdCls}>{stat.runs}</td>
                      <td className={tdCls}>{stat.sb}</td>
                      <td className={tdCls}>{stat.doubles}</td>
                      <td className={tdCls}>{stat.triples}</td>
                      <td className={tdCls}>{stat.risp_ab}</td>
                      <td className={tdCls}>{stat.risp_hits}</td>
                      <td className={tdCls}>{stat.k}</td>
                      <td className={tdCls}>{stat.bb}</td>
                      <td className={tdCls}>{stat.hbp}</td>
                      <td className={tdCls}>{stat.sac_bunt}</td>
                      <td className={tdCls}>{stat.sac_fly}</td>
                      <td className={tdCls}>{stat.gidp}</td>
                      <td className={tdCls}>{stat.reach_on_error}</td>
                      <td className={tdCls}>{stat.errors}</td>
                      <td className={tdCls}>{stat.cs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pitchingData.length > 0 && (
          <div>
            <SectionHeading href="/players?tab=pitching">投手成績</SectionHeading>
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
              <table className="w-full min-w-max table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-24" />
                  {PITCHING_HEADS.slice(1).map(h => <col key={h} className="w-12" />)}
                </colgroup>
                <thead className="bg-band">
                  <tr>
                    {PITCHING_HEADS.map(h => (
                      <th key={h} className={`${thCls} first:px-1.5 sm:first:px-3 first:text-left`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pitchingData.map(stat => (
                    <tr key={stat.id} className={rowCls}>
                      <td className="whitespace-nowrap px-1.5 sm:px-3 py-3 font-bold text-gray-900"><PlayerName player={stat.players} /></td>
                      <td className={tdCls}>{stat.is_win ? <span className="font-bold text-green-600">○</span> : '-'}</td>
                      <td className={tdCls}>{(stat as { is_hold?: boolean }).is_hold ? <span className="font-bold text-blue-600">○</span> : '-'}</td>
                      <td className={tdCls}>{(stat as { is_save?: boolean }).is_save ? <span className="font-bold text-purple-600">○</span> : '-'}</td>
                      <td className={tdCls}>{stat.is_loss ? <span className="font-bold text-red-600">○</span> : '-'}</td>
                      <td className={tdCls}>{stat.ip}</td>
                      <td className={tdCls}>{(stat as { pitch_count?: number }).pitch_count ?? '-'}</td>
                      <td className={tdCls}>{(stat as { runs?: number }).runs ?? '-'}</td>
                      <td className={tdCls}>{stat.er}</td>
                      <td className={tdCls}>{(stat as { is_cg?: boolean }).is_cg ? <span className="font-bold">○</span> : '-'}</td>
                      <td className={tdCls}>{(stat as { is_sho?: boolean }).is_sho ? <span className="font-bold">○</span> : '-'}</td>
                      <td className={tdCls}>{stat.hits_allowed}</td>
                      <td className={tdCls}>{stat.hr_allowed}</td>
                      <td className={tdCls}>{stat.k}</td>
                      <td className={tdCls}>{stat.bb}</td>
                      <td className={tdCls}>{(stat as { hbp?: number }).hbp ?? '-'}</td>
                      <td className={tdCls}>{(stat as { balk?: number }).balk ?? '-'}</td>
                      <td className={tdCls}>{(stat as { wp?: number }).wp ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
