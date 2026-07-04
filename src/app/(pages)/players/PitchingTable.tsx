'use client'

import { useState } from 'react'
import Link from 'next/link'

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

type ColDef = { key: string; label: string; getValue: (r: PitchingRow) => number | string; bold?: boolean }

const COLS: ColDef[] = [
  { key: '登板',    label: '登板',    getValue: r => r.appearances },
  { key: '勝',      label: '勝',      getValue: r => r.wins },
  { key: 'H',       label: 'H',       getValue: r => r.holds },
  { key: 'S',       label: 'S',       getValue: r => r.saves },
  { key: '敗',      label: '敗',      getValue: r => r.losses },
  { key: '勝率',    label: '勝率',    getValue: r => r.winPct, bold: true },
  { key: '防御率',  label: '防御率',  getValue: r => r.era,    bold: true },
  { key: '投球回',  label: '投球回',  getValue: r => r.ip },
  { key: '投球数',  label: '投球数',  getValue: r => r.pitch_count },
  { key: '失点',    label: '失点',    getValue: r => r.runs },
  { key: '自責点',  label: '自責点',  getValue: r => r.er },
  { key: '完投',    label: '完投',    getValue: r => r.cg },
  { key: '完封',    label: '完封',    getValue: r => r.sho },
  { key: '被安打',  label: '被安打',  getValue: r => r.hits_allowed },
  { key: '被本塁打',label: '被本塁打',getValue: r => r.hr_allowed },
  { key: '奪三振',  label: '奪三振',  getValue: r => r.k },
  { key: '与四球',  label: '与四球',  getValue: r => r.bb },
  { key: '与死球',  label: '与死球',  getValue: r => r.hbp },
  { key: 'ボーク',  label: 'ボーク',  getValue: r => r.balk },
  { key: '暴投',    label: '暴投',    getValue: r => r.wp },
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

  const thData = 'px-2.5 py-2 align-bottom font-semibold text-white select-none sticky top-0 z-20 bg-band cursor-pointer hover:bg-band/80 transition-colors'
  const tdCls = 'px-2.5 py-3 text-center text-sm tabular-nums'
  const arrow = (dir: 'desc' | 'asc' | null) => (dir === 'desc' ? '▼' : dir === 'asc' ? '▲' : '')

  return (
    <div className="bg-white rounded-b-2xl shadow-sm ring-1 ring-gray-900/5 overflow-auto max-h-[calc(100vh-13rem)]">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-band">
          <tr>
            <th
              onClick={() => setSort(nextSort(sort, '#'))}
              className={`px-2 py-2 font-semibold text-white text-left whitespace-nowrap select-none sticky top-0 left-0 z-30 bg-band cursor-pointer hover:bg-band/80 transition-colors ${sort?.col === '#' ? 'text-amber-300' : ''}`}
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
          {sorted.map(({ player, appearances, wins, holds, saves, losses, winPct, era, ip, pitch_count, runs, er, cg, sho, hits_allowed, hr_allowed, k, bb, hbp, balk, wp }) => (
            <tr key={player!.id} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
              <td className="px-2 py-3 whitespace-nowrap sticky left-0 z-10 bg-inherit">
                <Link href={`/players/${player!.id}`} className="flex items-baseline gap-1.5 hover:text-blue-700 transition-colors">
                  <span className="text-xs font-bold italic tabular-nums text-gray-400">{player!.number ?? '-'}</span>
                  <span className="font-bold text-gray-900">{player!.name}</span>
                </Link>
              </td>
              <td className={tdCls}>{appearances}</td>
              <td className={tdCls}>{wins}</td>
              <td className={tdCls}>{holds}</td>
              <td className={tdCls}>{saves}</td>
              <td className={tdCls}>{losses}</td>
              <td className={`${tdCls} font-medium`}>{winPct}</td>
              <td className={`${tdCls} font-medium`}>{era}</td>
              <td className={tdCls}>{ip}</td>
              <td className={tdCls}>{pitch_count}</td>
              <td className={tdCls}>{runs}</td>
              <td className={tdCls}>{er}</td>
              <td className={tdCls}>{cg}</td>
              <td className={tdCls}>{sho}</td>
              <td className={tdCls}>{hits_allowed}</td>
              <td className={tdCls}>{hr_allowed}</td>
              <td className={tdCls}>{k}</td>
              <td className={tdCls}>{bb}</td>
              <td className={tdCls}>{hbp}</td>
              <td className={tdCls}>{balk}</td>
              <td className={tdCls}>{wp}</td>
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
