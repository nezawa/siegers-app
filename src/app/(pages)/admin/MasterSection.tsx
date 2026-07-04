'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Item = { id: string; name: string }

type Props = {
  title: string
  table: 'opponents' | 'tournaments'
  items: Item[]
}

export default function MasterSection({ title, table, items }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')

  // games 側の対応カラム（名前変更時に過去の試合表記もまとめて更新する）
  const gameColumn = table === 'opponents' ? 'opponent' : 'tournament'

  const startEdit = () => {
    const init: Record<string, string> = {}
    for (const item of items) init[item.id] = item.name
    setDrafts(init)
    setError('')
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setError('')
  }

  const add = async () => {
    const name = newName.trim()
    if (!name) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from(table).insert({ name })
    setLoading(false)
    if (err) {
      setError(err.code === '23505' ? `「${name}」はすでに登録されています` : `追加に失敗しました: ${err.message}`)
      return
    }
    setNewName('')
    router.refresh()
  }

  const save = async () => {
    // 空チェックと重複チェック
    const seen = new Set<string>()
    for (const item of items) {
      const name = drafts[item.id]?.trim()
      if (!name) {
        setError(`「${item.name}」の名前が空です`)
        return
      }
      if (seen.has(name)) {
        setError(`「${name}」が重複しています`)
        return
      }
      seen.add(name)
    }

    setLoading(true)
    setError('')
    const supabase = createClient()

    const changed = items.filter(item => drafts[item.id].trim() !== item.name)
    for (const item of changed) {
      const newVal = drafts[item.id].trim()
      const { error: err } = await supabase.from(table).update({ name: newVal }).eq('id', item.id)
      if (err) {
        setError(`保存に失敗しました: ${err.message}`)
        setLoading(false)
        return
      }
      // 過去の試合の表記も新しい名前に揃える
      const { error: gameErr } = await supabase.from('games').update({ [gameColumn]: newVal }).eq(gameColumn, item.name)
      if (gameErr) {
        setError(`試合データの更新に失敗しました: ${gameErr.message}`)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  const remove = async (item: Item) => {
    if (!confirm(`「${item.name}」を候補から削除しますか？\n※過去の試合データはそのまま残ります`)) return
    const supabase = createClient()
    const { error: err } = await supabase.from(table).delete().eq('id', item.id)
    if (err) {
      alert(`削除に失敗しました: ${err.message}`)
      return
    }
    router.refresh()
  }

  const inputCls =
    'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40'

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        {/* 左スペーサー（追加フォームを中央に寄せるための余白） */}
        <div className="flex-1" />

        {/* 追加（中央） */}
        <div className="flex items-center gap-2">
          <input type="text" value={newName} placeholder={`新しい${title}を入力`}
            disabled={editing}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            className={`${inputCls} w-56 disabled:bg-slate-100 disabled:text-gray-400`} />
          <button onClick={add} disabled={loading || editing || newName.trim() === ''}
            className="rounded-xl bg-band px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-85 disabled:opacity-50">
            追加
          </button>
        </div>

        {/* 編集（右端） */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {editing ? (
            <>
              <button onClick={save} disabled={loading}
                className="rounded-xl bg-band px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-85 disabled:opacity-50">
                {loading ? '保存中...' : '保存'}
              </button>
              <button onClick={cancel} disabled={loading}
                className="rounded-xl bg-white px-4 py-1.5 text-sm font-medium text-gray-600 ring-1 ring-gray-300 transition-all hover:bg-gray-50 disabled:opacity-50">
                キャンセル
              </button>
            </>
          ) : (
            <button onClick={startEdit} disabled={items.length === 0}
              className="rounded-xl bg-white px-4 py-1.5 text-sm font-bold text-blue-800 ring-1 ring-blue-200 shadow-sm transition-all hover:bg-blue-50 disabled:opacity-40">
              編集
            </button>
          )}
        </div>
      </div>

      {editing && (
        <p className="mb-2 text-xs text-gray-400">名前を変更して保存すると、過去の試合の表記もまとめて更新されます</p>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">まだ登録されていません</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map(item => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                {editing ? (
                  <input type="text" value={drafts[item.id] ?? ''}
                    onChange={e => setDrafts(d => ({ ...d, [item.id]: e.target.value }))}
                    className={`${inputCls} w-full max-w-xs`} />
                ) : (
                  <span className="font-bold text-gray-900">{item.name}</span>
                )}
                {!editing && (
                  <button onClick={() => remove(item)}
                    className="text-sm text-red-500 transition-colors hover:text-red-700">
                    削除
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
