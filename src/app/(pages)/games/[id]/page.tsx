import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Game } from '@/types'
import DeleteGameButton from './DeleteGameButton'

function ResultBadge({ result }: { result: Game['result'] }) {
  if (result === 'W') return <span className="rounded-full bg-red-600 px-3.5 py-1 text-sm font-bold text-white shadow-sm">勝利</span>
  if (result === 'L') return <span className="rounded-full bg-blue-600 px-3.5 py-1 text-sm font-bold text-white shadow-sm">敗戦</span>
  if (result === 'D') return <span className="rounded-full bg-gray-500 px-3.5 py-1 text-sm font-bold text-white shadow-sm">引分</span>
  return null
}

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

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const thCls = 'px-1 sm:px-2 py-3 font-semibold text-white text-center whitespace-nowrap text-xs'
  const tdCls = 'px-1 sm:px-2 py-3 text-center'
  const rowCls = 'odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/70 transition-colors'

  return (
    <div className="space-y-8">
      {/* スコアボード */}
      <div className="relative overflow-hidden rounded-3xl bg-band text-white shadow-xl shadow-blue-950/20">
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <p className="text-sm text-white/80">
              {game.date}{game.venue && `・${game.venue}`}
              {game.game_type && (
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/85">
                  {({ official: '公式戦', practice: '練習試合', other: 'その他' } as Record<string, string>)[game.game_type]}
                </span>
              )}
            </p>
            <div className="flex items-center gap-3">
              <ResultBadge result={game.result} />
              {user && (
                <>
                  <Link href={`/admin/games/${id}/edit`}
                    className="rounded-lg px-3 py-1 text-sm text-white ring-1 ring-white/40 transition-colors hover:bg-white/10">
                    編集
                  </Link>
                  <DeleteGameButton gameId={id} />
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
        const len = Math.max(us.length, them.length, 9)
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
            <table className="border-collapse text-sm">
              <thead className="bg-band">
                <tr>
                  {['打順', '選手', '打席', '打数', '安打', '本塁打', '打点', '得点', '盗塁', '二塁打', '三塁打', '得点圏打数', '得点圏安打', '三振', '四球', '死球', '犠打', '犠飛', '併殺打', '敵失', '失策', '盗塁阻止'].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {battingData.map(stat => (
                  <tr key={stat.id} className={rowCls}>
                    <td className={`${tdCls} text-gray-500`}>{stat.batting_order ?? '-'}</td>
                    <td className="whitespace-nowrap px-1.5 sm:px-2 py-3 font-bold text-gray-900">{(stat.players as { name?: string } | null)?.name ?? '-'}</td>
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
            <table className="border-collapse text-sm">
              <thead className="bg-band">
                <tr>
                  {['選手', '勝', 'H', 'S', '敗', '投球回', '投球数', '失点', '自責点', '完投', '完封', '被安打', '被本塁打', '奪三振', '与四球', '与死球', 'ボーク', '暴投'].map(h => (
                    <th key={h} className={`${thCls} first:px-1.5 sm:first:px-3 first:text-left`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pitchingData.map(stat => (
                  <tr key={stat.id} className={rowCls}>
                    <td className="whitespace-nowrap px-1.5 sm:px-3 py-3 font-bold text-gray-900">{(stat.players as { name?: string } | null)?.name ?? '-'}</td>
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
  )
}
