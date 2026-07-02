'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Player } from '@/types'
import PitcherToggle from './PitcherToggle'
import DeletePlayerButton from './DeletePlayerButton'

type Draft = { name: string; number: number | '' }

export default function PlayersManager({ players }: { players: Player[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})

  const startEdit = () => {
    const init: Record<string, Draft> = {}
    for (const p of players) init[p.id] = { name: p.name, number: p.number ?? '' }
    setDrafts(init)
    setError('')
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setError('')
  }

  const setDraft = (id: string, field: keyof Draft, value: string) =>
    setDrafts(d => ({
      ...d,
      [id]: {
        ...d[id],
        [field]: field === 'number' ? (value === '' ? '' : Number(value)) : value,
      },
    }))

  const save = async () => {
    // 名前の必須チェック
    for (const p of players) {
      if (!drafts[p.id]?.name.trim()) {
        setError(`「${p.name}」の名前が空です`)
        return
      }
    }
    // 背番号の重複チェック
    const seen = new Map<number, string>()
    for (const p of players) {
      const n = drafts[p.id].number
      if (n === '') continue
      if (seen.has(Number(n))) {
        setError(`背番号 ${n} が重複しています`)
        return
      }
      seen.set(Number(n), p.id)
    }

    setLoading(true)
    setError('')
    const supabase = createClient()

    const changed = players.filter(p => {
      const d = drafts[p.id]
      const newNumber = d.number === '' ? null : Number(d.number)
      return d.name.trim() !== p.name || newNumber !== p.number
    })

    const results = await Promise.all(
      changed.map(p => {
        const d = drafts[p.id]
        return supabase
          .from('players')
          .update({ name: d.name.trim(), number: d.number === '' ? null : Number(d.number) })
          .eq('id', p.id)
      })
    )

    if (results.some(r => r.error)) {
      setError('保存に失敗しました')
      setLoading(false)
      return
    }

    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  const inputCls =
    'rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900">
          <span className="inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-blue-700 to-blue-950" />
          選手管理
        </h1>
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button onClick={save} disabled={loading}
                className="rounded-xl bg-gradient-to-r from-blue-900 to-blue-950 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:from-blue-800 hover:to-blue-900 disabled:opacity-50">
                {loading ? '保存中...' : '保存'}
              </button>
              <button onClick={cancel} disabled={loading}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-300 transition-all hover:bg-gray-50 disabled:opacity-50">
                キャンセル
              </button>
            </>
          ) : (
            <button onClick={startEdit} disabled={players.length === 0}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-800 ring-1 ring-blue-200 shadow-sm transition-all hover:bg-blue-50 hover:ring-blue-300 disabled:opacity-40">
              編集
            </button>
          )}
          <Link href="/admin/players/new"
            className="rounded-xl bg-gradient-to-r from-blue-900 to-blue-950 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:from-blue-800 hover:to-blue-900 hover:shadow-lg">
            + 選手を追加
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">{error}</p>
      )}

      {players.length === 0 ? (
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
                <th className="text-center px-6 py-3 text-xs font-semibold text-blue-100">投手</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {players.map(player => (
                <tr key={player.id} className={editing ? 'bg-blue-50/40' : 'odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors'}>
                  {editing ? (
                    <>
                      <td className="px-6 py-4">
                        <input type="number" min="0" max="999" value={drafts[player.id]?.number ?? ''}
                          onChange={e => setDraft(player.id, 'number', e.target.value)}
                          className={`${inputCls} w-16 text-center`} placeholder="-" />
                      </td>
                      <td className="px-6 py-4" colSpan={2}>
                        <input type="text" value={drafts[player.id]?.name ?? ''}
                          onChange={e => setDraft(player.id, 'name', e.target.value)}
                          className={`${inputCls} w-full max-w-xs`} placeholder="名前" />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-bold italic tabular-nums text-gray-400">{player.number ?? '-'}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{player.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{player.notes ?? '-'}</td>
                    </>
                  )}
                  <td className="px-6 py-4 text-center">
                    <PitcherToggle id={player.id} isPitcher={player.is_pitcher ?? false} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!editing && <DeletePlayerButton id={player.id} name={player.name} />}
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
