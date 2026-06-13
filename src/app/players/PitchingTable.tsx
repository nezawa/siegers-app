'use client'

import { useState } from 'react'
import Link from 'next/link'

type Player = { id: string; name: string; number: number | null }

export type PitchingRow = {
  player: Player | undefined
  appearances: number
  wins: number; holds: number; saves: number; losses: number
  winPct: string; era: string; ip: string
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

export default function PitchingTable({ rows }: { rows: PitchingRow[] }) {
  const [sort, setSort] = useState<SortState>(null)

  const sorted = sort
    ? [...rows].sort((a, b) => {
        const col = COLS.find(c => c.key === sort.col)!
        const va = toNum(col.getValue(a))
        const vb = toNum(col.getValue(b))
        return sort.dir === 'desc' ? vb - va : va - vb
      })
    : rows

  const thBase = 'px-3 py-2.5 font-semibold text-blue-100 text-center whitespace-nowrap text-xs select-none'
  const tdCls = 'px-3 py-3 text-center text-sm tabular-nums'

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-x-auto">
      <table className="text-sm border-collapse">
        <thead className="bg-blue-950">
          <tr>
            <th className={`${thBase} sticky left-0 bg-blue-950 w-12`}>#</th>
            <th className={`px-4 py-2.5 font-semibold text-blue-100 text-left whitespace-nowrap sticky left-12 bg-blue-950 text-xs select-none`}>選手名</th>
            {COLS.map(col => {
              const dir = sort?.col === col.key ? sort.dir : null
              return (
                <th
                  key={col.key}
                  onClick={() => setSort(nextSort(sort, col.key))}
                  className={`${thBase} cursor-pointer hover:bg-blue-900 transition-colors ${sort?.col === col.key ? 'text-amber-300' : ''}`}
                >
                  {col.label}
                  <span className="inline-block w-3 ml-0.5 text-[10px]">
                    {dir === 'desc' ? '▼' : dir === 'asc' ? '▲' : ''}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map(({ player, appearances, wins, holds, saves, losses, winPct, era, ip, pitch_count, runs, er, cg, sho, hits_allowed, hr_allowed, k, bb, hbp, balk, wp }) => (
            <tr key={player!.id} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
              <td className="px-3 py-3 text-center text-sm text-gray-400 font-bold italic sticky left-0 bg-inherit w-12">{player!.number ?? '-'}</td>
              <td className="px-4 py-3 font-bold whitespace-nowrap sticky left-12 bg-inherit">
                <Link href={`/players/${player!.id}`} className="text-gray-900 hover:text-blue-700 hover:underline transition-colors">
                  {player!.name}
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
    </div>
  )
}
