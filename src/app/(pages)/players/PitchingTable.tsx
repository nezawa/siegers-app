'use client'

import { useState } from 'react'
import Link from 'next/link'
import RankBadge from '@/components/RankBadge'
import type { RankMap } from '@/lib/ranking'

type Player = { id: string; name: string; number: number | null }

export type PitchingRow = {
  player: Player | undefined
  appearances: number
  wins: number; holds: number; saves: number; losses: number
  winPct: string; era: string; ip: string
  totalOuts: number
  pitch_count: number; runs: number; er: number
  cg: number; sho: number
  hits_allowed: number; hr_allowed: number
  k: number; bb: number; hbp: number; balk: number; wp: number
  ranks: RankMap
}

type SortState = { col: string; dir: 'desc' | 'asc' } | null

function toNum(val: string | number): number {
  if (typeof val === 'number') return val
  if (val === '-') return -Infinity
  const n = parseFloat(val)
  return isNaN(n) ? -Infinity : n
}

function nextSort(state: SortState, col: string): SortState {
  if (!state || state.col !== col) return { col, dir: 'desc' }
  if (state.dir === 'desc') return { col, dir: 'asc' }
  return null
}

// rankKey は lib/ranking.ts の指標キー。順位バッジの紐付けに使う
type ColDef = { key: string; label: string; rankKey: string; getValue: (r: PitchingRow) => number | string; bold?: boolean }

const COLS: ColDef[] = [
  { key: '登板',    label: '登板', rankKey: 'appearances',    getValue: r => r.appearances },
  { key: '勝',      label: '勝', rankKey: 'wins',      getValue: r => r.wins },
  { key: 'H',       label: 'H', rankKey: 'holds',       getValue: r => r.holds },
  { key: 'S',       label: 'S', rankKey: 'saves',       getValue: r => r.saves },
  { key: '敗',      label: '敗', rankKey: 'losses',      getValue: r => r.losses },
  { key: '勝率',    label: '勝率', rankKey: 'winPct',    getValue: r => r.winPct, bold: true },
  { key: '防御率',  label: '防御率', rankKey: 'era',  getValue: r => r.era,    bold: true },
  { key: '投球回',  label: '投球回', rankKey: 'ip',  getValue: r => r.ip },
  { key: '投球数',  label: '投球数', rankKey: 'pitch_count',  getValue: r => r.pitch_count },
  { key: '失点',    label: '失点', rankKey: 'runs',    getValue: r => r.runs },
  { key: '自責点',  label: '自責点', rankKey: 'er',  getValue: r => r.er },
  { key: '完投',    label: '完投', rankKey: 'cg',    getValue: r => r.cg },
  { key: '完封',    label: '完封', rankKey: 'sho',    getValue: r => r.sho },
  { key: '被安打',  label: '被安打', rankKey: 'hits_allowed',  getValue: r => r.hits_allowed },
  { key: '被本塁打',label: '被本塁打', rankKey: 'hr_allowed',getValue: r => r.hr_allowed },
  { key: '奪三振',  label: '奪三振', rankKey: 'k',  getValue: r => r.k },
  { key: '与四球',  label: '与四球', rankKey: 'bb',  getValue: r => r.bb },
  { key: '与死球',  label: '与死球', rankKey: 'hbp',  getValue: r => r.hbp },
  { key: 'ボーク',  label: 'ボーク', rankKey: 'balk',  getValue: r => r.balk },
  { key: '暴投',    label: '暴投', rankKey: 'wp',    getValue: r => r.wp },
]

type Props = {
  rows: PitchingRow[]
}

export default function PitchingTable({ rows }: Props) {
  const [sort, setSort] = useState<SortState>(null)

  const sorted = sort
    ? [...rows].sort((a, b) => {
        if (sort.col === '#') {
          const va = a.player?.number ?? -Infinity
          const vb = b.player?.number ?? -Infinity
          return sort.dir === 'desc' ? vb - va : va - vb
        }
        const col = COLS.find(c => c.key === sort.col)!
        const va = toNum(col.getValue(a))
        const vb = toNum(col.getValue(b))
        return sort.dir === 'desc' ? vb - va : va - vb
      })
    : rows

  const thData = 'px-2.5 py-2 align-bottom font-semibold text-white select-none sticky top-0 z-20 bg-band cursor-pointer hover:bg-[#5e90bc] transition-colors'
  // relative は順位バッジ（セル右端に絶対配置）の基準
  const tdCls = 'relative px-2.5 py-3 text-center text-sm tabular-nums'
  const arrow = (dir: 'desc' | 'asc' | null) => (dir === 'desc' ? '▼' : dir === 'asc' ? '▲' : '')

  return (
    <div className="bg-white rounded-b-2xl shadow-sm ring-1 ring-gray-900/5 overflow-auto max-h-[calc(100vh-13rem)]">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-band">
          <tr>
            <th
              onClick={() => setSort(nextSort(sort, '#'))}
              className={`px-2 py-2 font-semibold text-white text-left whitespace-nowrap select-none sticky top-0 left-0 z-30 bg-band cursor-pointer hover:bg-[#5e90bc] transition-colors ${sort?.col === '#' ? 'text-amber-300' : ''}`}
            >
              背番号
              <span className="inline-block w-3 text-[10px]">{sort?.col === '#' ? arrow(sort.dir) : ''}</span>
            </th>
            {COLS.map(col => {
              const dir = sort?.col === col.key ? sort.dir : null
              return (
                <th
                  key={col.key}
                  onClick={() => setSort(nextSort(sort, col.key))}
                  className={`${thData} ${sort?.col === col.key ? 'text-amber-300' : ''}`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="[writing-mode:vertical-rl] [text-orientation:upright] tracking-tight text-xs leading-none">{col.label}</span>
                    <span className="h-2.5 text-[9px] leading-none">{arrow(dir)}</span>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map(row => (
            <tr key={row.player!.id} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
              <td className="px-2 py-3 whitespace-nowrap sticky left-0 z-10 bg-inherit">
                <Link href={`/players/${row.player!.id}`} className="flex items-baseline gap-1.5 hover:text-blue-700 transition-colors">
                  <span className="text-xs font-bold italic tabular-nums text-gray-400">{row.player!.number ?? '-'}</span>
                  <span className="font-bold text-gray-900">{row.player!.name}</span>
                </Link>
              </td>
              {COLS.map(col => {
                const rank = row.ranks[col.rankKey]
                return (
                  <td key={col.key} className={`${tdCls}${col.bold ? ' font-medium' : ''}`}>
                    {col.getValue(row)}
                    {rank && <RankBadge rank={rank} />}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sticky left-0 border-t border-gray-100 px-3 py-2 text-xs text-gray-400">
        ※ 左右にスクロールすると全ての項目を確認できます
      </p>
    </div>
  )
}
