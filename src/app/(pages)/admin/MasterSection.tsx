'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export type GameType = 'official' | 'practice' | 'other'

type Item = { id: string; name: string; game_type?: GameType | null }

type Props = {
  title: string
  table: 'opponents' | 'tournaments'
  items: Item[]
  // 試合属性（公式戦/練習試合/その他）も編集する。大会名だけで使う
  withGameType?: boolean
}

// 表示用のラベル。'' は「未設定」（試合側の属性を書き換えない）
export const GAME_TYPES: { value: '' | GameType; label: string }[] = [
  { value: '', label: '未設定' },
  { value: 'official', label: '公式戦' },
  { value: 'practice', label: '練習試合' },
  { value: 'other', label: 'その他' },
]

const GAME_TYPE_BADGE: Record<GameType, { label: string; cls: string }> = {
  official: { label: '公式戦', cls: 'bg-emerald-600' },
  practice: { label: '練習試合', cls: 'bg-sky-500' },
  other: { label: 'その他', cls: 'bg-gray-500' },
}

type Draft = { name: string; game_type: '' | GameType }

export default function MasterSection({ title, table, items, withGameType = false }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [newName, setNewName] = useState('')
  const [newGameType, setNewGameType] = useState<'' | GameType>('')

  // games 側の対応カラム（名前変更時に過去の試合表記もまとめて更新する）
  const gameColumn = table === 'opponents' ? 'opponent' : 'tournament'

  // 大会の試合属性を、その大会名の試合へ反映する。更新できた試合数を返す。
  // 試合種別がまだ未設定の試合だけが対象。個別の試合で手動指定された種別は書き換えない
  const applyGameType = async (
    supabase: ReturnType<typeof createClient>,
    name: string,
    gameType: GameType,
  ): Promise<number> => {
    const { data, error: err } = await supabase
      .from('games')
      .update({ game_type: gameType })
      .eq('tournament', name)
      .is('game_type', null)
      .select('id')
    if (err) throw new Error(`試合への反映に失敗しました: ${err.message}`)
    return data?.length ?? 0
  }

  const startEdit = () => {
    const init: Record<string, Draft> = {}
    for (const item of items) init[item.id] = { name: item.name, game_type: item.game_type ?? '' }
    setDrafts(init)
    setError('')
    setNotice('')
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
    setNotice('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from(table)
      .insert(withGameType ? { name, game_type: newGameType || null } : { name })
    if (err) {
      setLoading(false)
      setError(err.code === '23505' ? `「${name}」はすでに登録されています` : `追加に失敗しました: ${err.message}`)
      return
    }

    // 同じ大会名の試合がすでに登録されていれば、その属性も揃える
    try {
      if (withGameType && newGameType) {
        const count = await applyGameType(supabase, name, newGameType)
        if (count > 0) setNotice(`「${name}」の試合種別が未設定だった ${count}件に反映しました`)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setLoading(false)
      return
    }

    setLoading(false)
    setNewName('')
    setNewGameType('')
    router.refresh()
  }

  const save = async () => {
    // 空チェックと重複チェック
    const seen = new Set<string>()
    for (const item of items) {
      const name = drafts[item.id]?.name.trim()
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
    setNotice('')
    const supabase = createClient()

    const changed = items.filter(item => {
      const draft = drafts[item.id]
      return draft.name.trim() !== item.name || draft.game_type !== (item.game_type ?? '')
    })

    const applied: string[] = []
    for (const item of changed) {
      const draft = drafts[item.id]
      const newName = draft.name.trim()
      const nameChanged = newName !== item.name
      const typeChanged = draft.game_type !== (item.game_type ?? '')

      const { error: err } = await supabase
        .from(table)
        .update(withGameType ? { name: newName, game_type: draft.game_type || null } : { name: newName })
        .eq('id', item.id)
      if (err) {
        setError(`保存に失敗しました: ${err.message}`)
        setLoading(false)
        return
      }

      // 過去の試合の表記も新しい名前に揃える（属性の反映より先に、名前を新しい方へ寄せておく）
      if (nameChanged) {
        const { error: gameErr } = await supabase.from('games').update({ [gameColumn]: newName }).eq(gameColumn, item.name)
        if (gameErr) {
          setError(`試合データの更新に失敗しました: ${gameErr.message}`)
          setLoading(false)
          return
        }
      }

      // 属性を変えた大会は、その大会名の試合すべてに反映する。
      // 「未設定」に戻したときは、試合側の属性を勝手に消さない（意図せず属性が消えるのを防ぐ）
      if (withGameType && typeChanged && draft.game_type) {
        try {
          const count = await applyGameType(supabase, newName, draft.game_type)
          applied.push(`「${newName}」${count}件`)
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : String(e))
          setLoading(false)
          return
        }
      }
    }

    if (applied.length > 0) setNotice(`試合種別が未設定だった試合に反映しました: ${applied.join('、')}`)
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

  // 一覧の列。表示・編集どちらでも同じ幅にして、試合属性の書き始めを揃える
  const rowGrid = withGameType
    ? 'grid grid-cols-[minmax(0,1fr)_8rem_3rem] items-center gap-3'
    : 'grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-3'

  return (
    <section>
      {/* 左＝追加フォーム / 右＝編集操作。狭い画面では折り返して縦に積む */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input type="text" value={newName} placeholder={`新しい${title}を入力`}
            disabled={editing}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            className={`${inputCls} w-52 disabled:bg-slate-100 disabled:text-gray-400`} />
          {withGameType && (
            <select value={newGameType} disabled={editing}
              aria-label="試合属性"
              onChange={e => setNewGameType(e.target.value as '' | GameType)}
              className={`${inputCls} w-32 cursor-pointer disabled:bg-slate-100 disabled:text-gray-400`}>
              {GAME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          )}
          <button onClick={add} disabled={loading || editing || newName.trim() === ''}
            className="whitespace-nowrap rounded-xl bg-band px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-85 disabled:opacity-50">
            追加
          </button>
        </div>

        {/* 編集操作。「キャンセル → 保存」の順に置き、主操作（保存）を右端にする */}
        <div className="flex shrink-0 items-center gap-2">
          {editing ? (
            <>
              <button onClick={cancel} disabled={loading}
                className="whitespace-nowrap rounded-xl bg-white px-4 py-1.5 text-sm font-medium text-gray-600 ring-1 ring-gray-300 transition-all hover:bg-gray-50 disabled:opacity-50">
                キャンセル
              </button>
              <button onClick={save} disabled={loading}
                className="whitespace-nowrap rounded-xl bg-band px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-85 disabled:opacity-50">
                {loading ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <button onClick={startEdit} disabled={items.length === 0}
              className="whitespace-nowrap rounded-xl bg-white px-4 py-1.5 text-sm font-bold text-blue-800 ring-1 ring-blue-200 shadow-sm transition-all hover:bg-blue-50 disabled:opacity-40">
              編集
            </button>
          )}
        </div>
      </div>

      {editing && (
        <p className="mb-2 text-xs text-gray-400">
          名前を変更して保存すると、過去の試合の表記もまとめて更新されます
          {withGameType && '。試合属性を変更すると、その大会名の試合のうち「試合種別が未設定のもの」だけに反映されます（試合ごとに種別を指定済みの試合と、属性を「未設定」に戻した場合は変更しません）'}
        </p>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">{error}</p>
      )}

      {notice && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">{notice}</p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">まだ登録されていません</p>
        ) : (
          <>
            {withGameType && (
              <div className={`${rowGrid} border-b border-gray-200 bg-slate-50 px-5 py-2 text-xs font-semibold text-gray-500`}>
                <span>{title}</span>
                <span>試合属性</span>
                <span />
              </div>
            )}
            <ul className="divide-y divide-gray-100">
              {items.map(item => (
                <li key={item.id} className={`${rowGrid} px-5 py-3 transition-colors hover:bg-gray-50`}>
                  {editing ? (
                    <input type="text" value={drafts[item.id]?.name ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, [item.id]: { ...d[item.id], name: e.target.value } }))}
                      className={`${inputCls} w-full`} />
                  ) : (
                    <span className="truncate font-bold text-gray-900">{item.name}</span>
                  )}

                  {withGameType && (
                    editing ? (
                      <select value={drafts[item.id]?.game_type ?? ''}
                        aria-label={`${item.name} の試合属性`}
                        onChange={e => setDrafts(d => ({ ...d, [item.id]: { ...d[item.id], game_type: e.target.value as '' | GameType } }))}
                        className={`${inputCls} w-full cursor-pointer`}>
                        {GAME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    ) : item.game_type ? (
                      <span className={`inline-flex w-fit rounded px-2 py-0.5 text-xs font-bold text-white ${GAME_TYPE_BADGE[item.game_type].cls}`}>
                        {GAME_TYPE_BADGE[item.game_type].label}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">未設定</span>
                    )
                  )}

                  {/* 編集中も列は空のまま残し、名前・属性の位置が動かないようにする */}
                  <div className="text-right">
                    {!editing && (
                      <button onClick={() => remove(item)}
                        className="text-sm text-red-500 transition-colors hover:text-red-700">
                        削除
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
