'use client'

import { useState } from 'react'
import Link from 'next/link'

type Player = { id: string; name: string; number: number | null }

export type BattingRow = {
  player: Player
  games: number
  pa: number; ab: number; hits: number; doubles: number; triples: number; hr: number
  rbi: number; runs: number; sb: number; bb: number; hbp: number
  sac_fly: number; sac_bunt: number; k: number; gidp: number
  reach_on_error: number; errors: number; cs: number; tb: number
  avg: string; obp: string; slg: string; ops: string; risp_avg: string
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

type ColDef = { key: string; label: string; getValue: (r: BattingRow) => number | string; bold?: boolean }

const COLS: ColDef[] = [
  { key: '試合数',    label: '試合数',    getValue: r => r.games },
  { key: '打率',      label: '打率',      getValue: r => r.avg,       bold: true },
  { key: '打席',      label: '打席',      getValue: r => r.pa },
  { key: '打数',      label: '打数',      getValue: r => r.ab },
  { key: '安打',      label: '安打',      getValue: r => r.hits },
  { key: '本塁打',    label: '本塁打',    getValue: r => r.hr },
  { key: '打点',      label: '打点',      getValue: r => r.rbi },
  { key: '得点',      label: '得点',      getValue: r => r.runs },
  { key: '盗塁',      label: '盗塁',      getValue: r => r.sb },
  { key: '出塁率',    label: '出塁率',    getValue: r => r.obp },
  { key: '長打率',    label: '長打率',    getValue: r => r.slg },
  { key: '得点圏打率',label: '得点圏打率',getValue: r => r.risp_avg },
  { key: 'OPS',       label: 'OPS',       getValue: r => r.ops,       bold: true },
  { key: '二塁打',    label: '二塁打',    getValue: r => r.doubles },
  { key: '三塁打',    label: '三塁打',    getValue: r => r.triples },
  { key: '塁打数',    label: '塁打数',    getValue: r => r.tb },
  { key: '三振',      label: '三振',      getValue: r => r.k },
  { key: '四球',      label: '四球',      getValue: r => r.bb },
  { key: '死球',      label: '死球',      getValue: r => r.hbp },
  { key: '犠打',      label: '犠打',      getValue: r => r.sac_bunt },
  { key: '犠飛',      label: '犠飛',      getValue: r => r.sac_fly },
  { key: '併殺打',    label: '併殺打',    getValue: r => r.gidp },
  { key: '敵失',      label: '敵失',      getValue: r => r.reach_on_error },
  { key: '失策',      label: '失策',      getValue: r => r.errors },
  { key: '盗塁阻止',  label: '盗塁阻止',  getValue: r => r.cs },
]

export default function BattingTable({ rows }: { rows: BattingRow[] }) {
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
          {sorted.map(({ player, games, pa, ab, hits, doubles, triples, hr, rbi, runs, sb, bb, hbp, sac_fly, sac_bunt, k, gidp, reach_on_error, errors, cs, tb, avg, obp, slg, ops, risp_avg }) => (
            <tr key={player.id} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
              <td className="px-3 py-3 text-center text-sm text-gray-400 font-bold italic sticky left-0 bg-inherit w-12">{player.number ?? '-'}</td>
              <td className="px-4 py-3 font-bold whitespace-nowrap sticky left-12 bg-inherit">
                <Link href={`/players/${player.id}`} className="text-gray-900 hover:text-blue-700 hover:underline transition-colors">
                  {player.name}
                </Link>
              </td>
              <td className={tdCls}>{games}</td>
              <td className={`${tdCls} font-medium`}>{avg}</td>
              <td className={tdCls}>{pa}</td>
              <td className={tdCls}>{ab}</td>
              <td className={tdCls}>{hits}</td>
              <td className={tdCls}>{hr}</td>
              <td className={tdCls}>{rbi}</td>
              <td className={tdCls}>{runs}</td>
              <td className={tdCls}>{sb}</td>
              <td className={tdCls}>{obp}</td>
              <td className={tdCls}>{slg}</td>
              <td className={tdCls}>{risp_avg}</td>
              <td className={`${tdCls} font-medium`}>{ops}</td>
              <td className={tdCls}>{doubles}</td>
              <td className={tdCls}>{triples}</td>
              <td className={tdCls}>{tb}</td>
              <td className={tdCls}>{k}</td>
              <td className={tdCls}>{bb}</td>
              <td className={tdCls}>{hbp}</td>
              <td className={tdCls}>{sac_bunt}</td>
              <td className={tdCls}>{sac_fly}</td>
              <td className={tdCls}>{gidp}</td>
              <td className={tdCls}>{reach_on_error}</td>
              <td className={tdCls}>{errors}</td>
              <td className={tdCls}>{cs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
