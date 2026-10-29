'use client'

import { useState } from 'react'
import Link from 'next/link'

type Row = Record<string, unknown> & { id: string }

// 列名は 4 文字以上なら "\n" で 2 行に折り返す（列幅を広げないため）
const BATTING_HEADS = [
  '打順', '選手', '打席', '打数', '安打', '本塁打', '打点', '得点', '盗塁', '二塁打', '三塁打',
  '得点圏\n打数', '得点圏\n安打', '三振', '四球', '死球', '犠打', '犠飛', '併殺打', '敵失', '失策', '盗塁\n阻止',
]
const BATTING_KEYS = [
  'pa', 'ab', 'hits', 'hr', 'rbi', 'runs', 'sb', 'doubles', 'triples',
  'risp_ab', 'risp_hits', 'k', 'bb', 'hbp', 'sac_bunt', 'sac_fly', 'gidp', 'reach_on_error', 'errors', 'cs',
]

const PITCHING_HEADS = [
  '選手', '勝', 'H', 'S', '敗', '投球回', '投球数', '失点', '自責点', '完投', '完封',
  '被安打', '被本\n塁打', '奪三振', '与四球', '与死球', 'ボーク', '暴投',
]

// 普段はスポーツ速報サイトと同じく主要な列だけを出す
const BATTING_SHORT = [
  { head: '打', key: 'ab' }, { head: '安', key: 'hits' }, { head: '点', key: 'rbi' },
  { head: '本', key: 'hr' }, { head: '盗', key: 'sb' },
]
const PITCHING_SHORT = [
  { head: '回', key: 'ip' }, { head: '球', key: 'pitch_count' }, { head: '安', key: 'hits_allowed' },
  { head: '振', key: 'k' }, { head: '四', key: 'bb' }, { head: '死', key: 'hbp' }, { head: '失', key: 'runs' },
]

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

// 投手の勝敗・H・S を名前の横に小さく出す
function PitcherMarks({ stat }: { stat: Row }) {
  const marks = [
    stat.is_win && { label: '勝', cls: 'bg-red-600' },
    stat.is_loss && { label: '敗', cls: 'bg-blue-600' },
    stat.is_hold && { label: 'H', cls: 'bg-emerald-600' },
    stat.is_save && { label: 'S', cls: 'bg-purple-600' },
  ].filter(Boolean) as { label: string; cls: string }[]
  return (
    <>
      {marks.map(m => (
        <span key={m.label} className={`ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold text-white ${m.cls}`}>
          {m.label}
        </span>
      ))}
    </>
  )
}

const val = (stat: Row, key: string) => (stat[key] as number | null | undefined) ?? '-'
const mark = (on: unknown, cls: string) => (on ? <span className={`font-bold ${cls}`}>○</span> : '-')

export default function GameStatsTabs({ teamName, batting, pitching }: { teamName: string; batting: Row[]; pitching: Row[] }) {
  const [tab, setTab] = useState<'batting' | 'pitching'>('batting')
  const [detail, setDetail] = useState(false)

  if (batting.length === 0 && pitching.length === 0) return null

  const thCls = 'px-1 py-2.5 font-semibold text-white text-center whitespace-pre leading-tight text-xs align-middle'
  const tdCls = 'px-1 sm:px-2 py-3 text-center tabular-nums'
  const rowCls = 'odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/70 transition-colors'
  const nameCls = 'whitespace-nowrap px-2 sm:px-3 py-3 font-bold text-gray-900'
  const tabCls = (active: boolean) =>
    `flex-1 py-3 text-sm font-bold transition-colors ${active ? 'bg-band text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`
  const rows = tab === 'batting' ? batting : pitching

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setDetail(d => !d)}
          className="w-full max-w-sm rounded-xl bg-white py-3 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-gray-50"
        >
          {detail ? '主な成績だけ見る' : '詳しい成績を見る'}
        </button>
      </div>

      <div>
        <div className="flex overflow-hidden rounded-t-2xl border-b-4 border-band shadow-sm ring-1 ring-gray-900/5">
          <button type="button" onClick={() => setTab('batting')} className={tabCls(tab === 'batting')}>打者成績</button>
          <button type="button" onClick={() => setTab('pitching')} className={tabCls(tab === 'pitching')}>投手成績</button>
        </div>
        <div className="overflow-hidden rounded-b-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h2 className="border-l-4 border-band pl-2.5 font-bold text-gray-900">{teamName}</h2>
            <Link
              href={tab === 'batting' ? '/players' : '/players?tab=pitching'}
              className="shrink-0 text-xs font-medium text-gray-500 transition-colors hover:text-blue-700"
            >
              通算成績 ›
            </Link>
          </div>

          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              {tab === 'batting' ? '打撃成績がありません' : '投手成績がありません'}
            </p>
          ) : tab === 'batting' ? (
            <div className="overflow-x-auto">
              {detail ? (
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
                    {batting.map(stat => (
                      <tr key={stat.id} className={rowCls}>
                        <td className={`${tdCls} text-gray-500`}>{val(stat, 'batting_order')}</td>
                        <td className="whitespace-nowrap px-1.5 sm:px-2 py-3 font-bold text-gray-900"><PlayerName player={stat.players} /></td>
                        {BATTING_KEYS.map(k => <td key={k} className={tdCls}>{val(stat, k)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-band">
                    <tr>
                      <th className={`${thCls} w-10`}>打順</th>
                      <th className={`${thCls} w-10`}>位置</th>
                      <th className={`${thCls} px-2 sm:px-3 text-left`}>選手名</th>
                      {BATTING_SHORT.map(c => <th key={c.key} className={`${thCls} w-10`}>{c.head}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {batting.map(stat => (
                      <tr key={stat.id} className={rowCls}>
                        <td className={`${tdCls} text-gray-500`}>{val(stat, 'batting_order')}</td>
                        <td className={`${tdCls} whitespace-nowrap text-gray-600`}>{(stat.position as string | null) ?? '-'}</td>
                        <td className={nameCls}><PlayerName player={stat.players} /></td>
                        {BATTING_SHORT.map(c => <td key={c.key} className={tdCls}>{val(stat, c.key)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {detail ? (
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
                    {pitching.map(stat => (
                      <tr key={stat.id} className={rowCls}>
                        <td className="whitespace-nowrap px-1.5 sm:px-3 py-3 font-bold text-gray-900"><PlayerName player={stat.players} /></td>
                        <td className={tdCls}>{mark(stat.is_win, 'text-green-600')}</td>
                        <td className={tdCls}>{mark(stat.is_hold, 'text-blue-600')}</td>
                        <td className={tdCls}>{mark(stat.is_save, 'text-purple-600')}</td>
                        <td className={tdCls}>{mark(stat.is_loss, 'text-red-600')}</td>
                        <td className={tdCls}>{val(stat, 'ip')}</td>
                        <td className={tdCls}>{val(stat, 'pitch_count')}</td>
                        <td className={tdCls}>{val(stat, 'runs')}</td>
                        <td className={tdCls}>{val(stat, 'er')}</td>
                        <td className={tdCls}>{mark(stat.is_cg, '')}</td>
                        <td className={tdCls}>{mark(stat.is_sho, '')}</td>
                        <td className={tdCls}>{val(stat, 'hits_allowed')}</td>
                        <td className={tdCls}>{val(stat, 'hr_allowed')}</td>
                        <td className={tdCls}>{val(stat, 'k')}</td>
                        <td className={tdCls}>{val(stat, 'bb')}</td>
                        <td className={tdCls}>{val(stat, 'hbp')}</td>
                        <td className={tdCls}>{val(stat, 'balk')}</td>
                        <td className={tdCls}>{val(stat, 'wp')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-band">
                    <tr>
                      <th className={`${thCls} px-2 sm:px-3 text-left`}>選手名</th>
                      {PITCHING_SHORT.map(c => <th key={c.key} className={`${thCls} w-9 sm:w-12`}>{c.head}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pitching.map(stat => (
                      <tr key={stat.id} className={rowCls}>
                        <td className={nameCls}><PlayerName player={stat.players} /><PitcherMarks stat={stat} /></td>
                        {PITCHING_SHORT.map(c => <td key={c.key} className={tdCls}>{val(stat, c.key)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {rows.length > 0 && !detail && (
            <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-400">
              {tab === 'batting'
                ? '打＝打数　安＝安打　点＝打点　本＝本塁打　盗＝盗塁'
                : '回＝投球回　球＝投球数　安＝被安打　振＝奪三振　四＝与四球　死＝与死球　失＝失点'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
