export type TeamRow = {
  label: string
  games: number
  w: number
  l: number
  d: number
  winPct: string
  runsFor: number
  runsAgainst: number
  avg: string
  hr: number
  sb: number
  era: string
}

export type TeamDataset = { rows: TeamRow[]; total: TeamRow | null }

const HEADERS = ['年', '試合', '勝ち', '負け', '引分', '勝率', '得点', '失点', '打率', '本塁打', '盗塁', '防御率']

const tdCls = 'px-3 py-3 text-center text-sm tabular-nums'

function renderRow(r: TeamRow, isTotal = false) {
  return (
    <tr key={r.label} className={isTotal ? 'bg-blue-50 font-semibold border-t-2 border-blue-200' : 'odd:bg-white even:bg-slate-50/70'}>
      <td className={`${tdCls} font-bold ${isTotal ? '' : 'text-gray-700'}`}>{r.label}</td>
      <td className={tdCls}>{r.games}</td>
      <td className={tdCls}>{r.w}</td>
      <td className={tdCls}>{r.l}</td>
      <td className={tdCls}>{r.d}</td>
      <td className={tdCls}>{r.winPct}</td>
      <td className={tdCls}>{r.runsFor}</td>
      <td className={tdCls}>{r.runsAgainst}</td>
      <td className={tdCls}>{r.avg}</td>
      <td className={tdCls}>{r.hr}</td>
      <td className={tdCls}>{r.sb}</td>
      <td className={tdCls}>{r.era}</td>
    </tr>
  )
}

export default function TeamTable({ data }: { data: TeamDataset }) {
  if (data.rows.length === 0) {
    return (
      <div className="rounded-b-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">
        試合データがありません
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-b-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-band">
          <tr>
            {HEADERS.map(h => (
              <th key={h} className="whitespace-nowrap px-3 py-3 text-center text-xs font-semibold text-white">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.rows.map(r => renderRow(r))}
          {data.total && renderRow(data.total, true)}
        </tbody>
      </table>
    </div>
  )
}
