import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DeletePlayerButton from './DeletePlayerButton'

export default async function AdminPlayersPage() {
  const supabase = await createClient()
  const { data: players } = await supabase.from('players').select('*').order('number')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">選手管理</h1>
        <Link href="/admin/players/new"
          className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">
          + 選手を追加
        </Link>
      </div>

      {!players || players.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl shadow-sm">
          選手が登録されていません
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">背番号</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">名前</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">備考</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {players.map(player => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{player.number ?? '-'}</td>
                  <td className="px-6 py-4 font-medium">{player.name}</td>
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
