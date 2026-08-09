'use client'

import { useState } from 'react'
import Link from 'next/link'
import RankBadge from '@/components/RankBadge'
import type { RankMap } from '@/lib/ranking'

type Player = { id: string; name: string; number: number | null }

export type BattingRow = {
  player: Player
  games: number
  pa: number; ab: number; hits: number; doubles: number; triples: number; hr: number
  rbi: number; runs: number; sb: number; bb: number; hbp: number
  sac_fly: number; sac_bunt: number; k: number; gidp: number
  reach_on_error: number; errors: number; cs: number; tb: number
  avg: string; obp: string; slg: string; ops: string; risp_avg: string
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
type ColDef = { key: string; label: string; rankKey: string; getValue: (r: BattingRow) => number | string; bold?: boolean }

const COLS: ColDef[] = [
  { key: '試合数',    label: '試合数', rankKey: 'games',    getValue: r => r.games },
  { key: '打率',      label: '打率', rankKey: 'avg',      getValue: r => r.avg,       bold: true },
  { key: '打席',      label: '打席', rankKey: 'pa',      getValue: r => r.pa },
  { key: '打数',      label: '打数', rankKey: 'ab',      getValue: r => r.ab },
  { key: '安打',      label: '安打', rankKey: 'hits',      getValue: r => r.hits },
  { key: '本塁打',    label: '本塁打', rankKey: 'hr',    getValue: r => r.hr },
  { key: '打点',      label: '打点', rankKey: 'rbi',      getValue: r => r.rbi },
  { key: '得点',      label: '得点', rankKey: 'runs',      getValue: r => r.runs },
  { key: '盗塁',      label: '盗塁', rankKey: 'sb',      getValue: r => r.sb },
  { key: '出塁率',    label: '出塁率', rankKey: 'obp',    getValue: r => r.obp },
  { key: '長打率',    label: '長打率', rankKey: 'slg',    getValue: r => r.slg },
  { key: '得点圏打率',label: '得点圏打率', rankKey: 'risp_avg',getValue: r => r.risp_avg },
  { key: 'OPS',       label: 'OPS', rankKey: 'ops',       getValue: r => r.ops,       bold: true },
  { key: '二塁打',    label: '二塁打', rankKey: 'doubles',    getValue: r => r.doubles },
  { key: '三塁打',    label: '三塁打', rankKey: 'triples',    getValue: r => r.triples },
  { key: '塁打数',    label: '塁打数', rankKey: 'tb',    getValue: r => r.tb },
  { key: '三振',      label: '三振', rankKey: 'k',      getValue: r => r.k },
  { key: '四球',      label: '四球', rankKey: 'bb',      getValue: r => r.bb },
  { key: '死球',      label: '死球', rankKey: 'hbp',      getValue: r => r.hbp },
  { key: '犠打',      label: '犠打', rankKey: 'sac_bunt',      getValue: r => r.sac_bunt },
  { key: '犠飛',      label: '犠飛', rankKey: 'sac_fly',      getValue: r => r.sac_fly },
  { key: '併殺打',    label: '併殺打', rankKey: 'gidp',    getValue: r => r.gidp },
  { key: '敵失',      label: '敵失', rankKey: 'reach_on_error',      getValue: r => r.reach_on_error },
  { key: '失策',      label: '失策', rankKey: 'errors',      getValue: r => r.errors },
  { key: '盗塁阻止',  label: '盗塁阻止', rankKey: 'cs',  getValue: r => r.cs },
]

type Props = {
  rows: BattingRow[]
}

export default function BattingTable({ rows }: Props) {
  const [sort, setSort] = useState<SortState>(null)

  const sorted = sort
    ? [...rows].sort((a, b) => {
        if (sort.col === '#') {
          const va = a.player.number ?? -Infinity
          const vb = b.player.number ?? -Infinity
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
            <tr key={row.player.id} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
              <td className="px-2 py-3 whitespace-nowrap sticky left-0 z-10 bg-inherit">
                <Link href={`/players/${row.player.id}`} className="flex items-baseline gap-1.5 hover:text-blue-700 transition-colors">
                  <span className="text-xs font-bold italic tabular-nums text-gray-400">{row.player.number ?? '-'}</span>
                  <span className="font-bold text-gray-900">{row.player.name}</span>
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
