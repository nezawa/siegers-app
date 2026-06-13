import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DeletePlayerButton from './DeletePlayerButton'

export default async function AdminPlayersPage() {
  const supabase = await createClient()
  const { data: players } = await supabase.from('players').select('*').order('number')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900">
          <span className="inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-blue-700 to-blue-950" />
          選手管理
        </h1>
        <Link href="/admin/players/new"
          className="rounded-xl bg-gradient-to-r from-blue-900 to-blue-950 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:from-blue-800 hover:to-blue-900 hover:shadow-lg">
          + 選手を追加
        </Link>
      </div>

      {!players || players.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5">
          選手が登録されていません
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
          <table className="w-full">
            <thead className="bg-blue-950">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-blue-100">背番号</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-blue-100">名前</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-blue-100">備考</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {players.map(player => (
                <tr key={player.id} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 font-bold italic tabular-nums text-gray-400">{player.number ?? '-'}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{player.name}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{player.notes ?? '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <DeletePlayerButton id={player.id} name={player.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
