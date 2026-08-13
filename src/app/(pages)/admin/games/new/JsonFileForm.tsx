'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { errorMessage } from '@/lib/errorMessage'
import {
  parseGamesText,
  validateJsonGame,
  saveJsonGame,
  gameTitle,
  type JsonInput,
  type SavedGame,
} from './jsonGame'
import type { Player } from '@/types'

// 1ファイルの状態。ファイル単位で「待機 → 保存中 → 完了 / 失敗」を表示する
type FileStatus = 'ready' | 'error' | 'saving' | 'done' | 'failed'

type FileEntry = {
  name: string
  games: { label: string; input: JsonInput }[]
  errors: string[]
  warnings: string[]
  status: FileStatus
  progress: number
  saved: SavedGame[]
  failMessage: string | null
}

// ファイル内に配列で複数試合が入っている場合の表示用ラベル
const gameLabel = (index: number, total: number) => (total > 1 ? `${index + 1}件目` : '')
const withLabel = (label: string, message: string) => (label ? `${label} ${message}` : message)

const BADGE: Record<FileStatus, string> = {
  ready: 'bg-slate-100 text-gray-600 ring-1 ring-gray-200',
  error: 'bg-red-100 text-red-700',
  saving: 'bg-blue-100 text-blue-700',
  done: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

const badgeText = (f: FileEntry) => {
  switch (f.status) {
    case 'ready': return `${f.games.length}試合`
    case 'error': return `エラー ${f.errors.length}件`
    case 'saving': return `保存中 ${f.progress}/${f.games.length}`
    case 'done': return `完了 ${f.saved.length}試合`
    case 'failed': return f.saved.length > 0 ? `失敗（${f.saved.length}試合のみ保存）` : '失敗'
  }
}

export default function JsonFileForm({ players }: { players: Player[] }) {
  const router = useRouter()
  const [files, setFiles] = useState<FileEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null)
  const [warningsAcked, setWarningsAcked] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 読み込んだ時点で中身を検証する（保存を押す前に、ファイルごとの可否が分かるようにする）
  const buildEntry = (name: string, text: string): FileEntry => {
    const base = { name, progress: 0, saved: [], failMessage: null }
    const { games, error: parseError } = parseGamesText(text)
    if (parseError) {
      return { ...base, games: [], errors: [parseError], warnings: [], status: 'error' }
    }

    const errors: string[] = []
    const warnings: string[] = []
    const targets: { label: string; input: JsonInput }[] = []
    games.forEach((game, i) => {
      const label = gameLabel(i, games.length)
      const result = validateJsonGame(game, players)
      errors.push(...result.errors.map(m => withLabel(label, m)))
      warnings.push(...result.warnings.map(m => withLabel(label, m)))
      if (result.input) targets.push({ label, input: result.input })
    })

    return {
      ...base,
      games: targets,
      errors,
      warnings,
      status: errors.length > 0 ? 'error' : 'ready',
    }
  }

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const picked = Array.from(fileList)
    const jsonFiles = picked.filter(f => f.name.toLowerCase().endsWith('.json'))
    const ignored = picked.filter(f => !jsonFiles.includes(f))

    const loaded = await Promise.all(
      jsonFiles.map(async f => buildEntry(f.name, await f.text()))
    )
    setFiles(prev => {
      // 同名ファイルは読み直し扱いで置き換える（二重登録の事故を防ぐ）
      const rest = prev.filter(p => !loaded.some(l => l.name === p.name))
      return [...rest, ...loaded].sort((a, b) => a.name.localeCompare(b.name))
    })
    setWarningsAcked(false)
    setMessage(ignored.length > 0
      ? { kind: 'error', text: `.json 以外のファイルは読み込めません: ${ignored.map(f => f.name).join(', ')}` }
      : null)
  }

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name))
    setWarningsAcked(false)
  }

  const patch = (name: string, changes: Partial<FileEntry>) => {
    setFiles(prev => prev.map(f => (f.name === name ? { ...f, ...changes } : f)))
  }

  const pending = files.filter(f => f.status === 'ready')
  const hasError = files.some(f => f.status === 'error')
  const pendingWarnings = pending.some(f => f.warnings.length > 0)

  const handleSubmit = async () => {
    if (pending.length === 0) return
    setMessage(null)

    if (pendingWarnings && !warningsAcked) {
      setWarningsAcked(true)
      setMessage({ kind: 'info', text: '入力漏れの可能性がある項目があります。このまま保存する場合は、もう一度「保存」を押してください' })
      return
    }

    setLoading(true)
    let savedGames = 0
    const failedFiles: string[] = []

    for (const file of pending) {
      patch(file.name, { status: 'saving', progress: 0, saved: [], failMessage: null })
      const done: SavedGame[] = []
      try {
        for (const target of file.games) {
          done.push(await saveJsonGame(target.input, players))
          savedGames++
          patch(file.name, { progress: done.length, saved: [...done] })
        }
        patch(file.name, { status: 'done', saved: done })
      } catch (err: unknown) {
        // 失敗した試合は保存せず、このファイルは中断して次のファイルへ進む。
        // 保存はトランザクションではないので、同じファイル内で既に保存できた試合は残る
        failedFiles.push(file.name)
        const failedAt = file.games[done.length]
        const rest = file.games.length - done.length - 1
        patch(file.name, {
          status: 'failed',
          saved: done,
          failMessage:
            withLabel(failedAt ? `${gameTitle(failedAt.input)} は` : '', `保存できませんでした: ${errorMessage(err)}`) +
            (rest > 0 ? `（このファイルの残り${rest}試合も保存していません）` : ''),
        })
      }
    }

    const okFiles = pending.length - failedFiles.length
    setMessage(
      failedFiles.length === 0
        ? { kind: 'info', text: `${pending.length}ファイル・${savedGames}件の試合を保存しました` }
        : {
            kind: 'error',
            text: `${okFiles}ファイル・${savedGames}件の試合を保存しました。` +
              `${failedFiles.length}ファイルは保存できませんでした（${failedFiles.join('、')}）。` +
              `失敗したファイルは、内容を確認してから入れ直してください`,
          }
    )
    setWarningsAcked(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <p className="mb-3 text-sm text-gray-500">
          試合データを書いた <code className="rounded bg-gray-100 px-1">.json</code> ファイルを読み込んで登録します。
          <span className="font-medium text-gray-600">複数ファイルを同時に選択できます。</span>
          1ファイルに <code className="rounded bg-gray-100 px-1">[ &#123;試合1&#125;, &#123;試合2&#125; ]</code> と配列で書けば、そのファイル内の複数試合もまとめて登録されます。
          書き方は「JSON入力」タブの入力例と同じです。
        </p>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition ${
            dragging ? 'border-band bg-blue-50' : 'border-gray-300 bg-slate-50 hover:bg-blue-50/50'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-7 w-7 text-band">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          <p className="text-sm font-medium text-gray-700">
            <span className="sm:hidden">タップしてファイルを選択</span>
            <span className="hidden sm:inline">ここに .json ファイルをドラッグ&amp;ドロップ</span>
          </p>
          <p className="hidden text-xs text-gray-500 sm:block">またはクリックしてファイルを選択（複数可）</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          multiple
          className="hidden"
          onChange={e => { addFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {files.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <h2 className="mb-3 border-l-4 border-band pl-2.5 font-bold text-gray-900">
            読み込んだファイル（{files.length}件）
          </h2>
          <ul className="space-y-2">
            {files.map(f => (
              <li key={f.name} className="rounded-xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-gray-200">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 shrink-0 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5" />
                  </svg>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">{f.name}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[f.status]}`}>
                    {badgeText(f)}
                  </span>
                  {f.status !== 'saving' && (
                    <button
                      type="button"
                      onClick={() => removeFile(f.name)}
                      disabled={loading}
                      className="shrink-0 rounded-md px-1.5 py-0.5 text-sm text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      aria-label={`${f.name} を外す`}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {f.errors.length > 0 && (
                  <ul className="mt-2 space-y-0.5 border-t border-gray-200 pt-2">
                    {f.errors.map((e, i) => <li key={i} className="text-xs text-red-600">{e}</li>)}
                  </ul>
                )}

                {f.failMessage && (
                  <p className="mt-2 border-t border-gray-200 pt-2 text-xs text-red-600">{f.failMessage}</p>
                )}

                {f.status !== 'error' && f.warnings.length > 0 && (
                  <ul className="mt-2 space-y-0.5 border-t border-gray-200 pt-2">
                    <li className="text-xs font-bold text-amber-800">入力漏れの可能性があります</li>
                    {f.warnings.map((w, i) => <li key={i} className="text-xs text-amber-700">{w}</li>)}
                  </ul>
                )}

                {f.saved.length > 0 && (
                  <ul className="mt-2 space-y-0.5 border-t border-gray-200 pt-2">
                    {f.saved.map(s => (
                      <li key={s.id}>
                        <Link href={`/games/${s.id}`} className="text-xs text-emerald-700 underline hover:opacity-70">
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
          エラーのあるファイルがあります。ファイルを直して入れ直すか、「✕」で外してください
        </p>
      )}

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ring-1 ${
          message.kind === 'error'
            ? 'bg-red-50 text-red-600 ring-red-200'
            : 'bg-emerald-50 font-medium text-emerald-800 ring-emerald-200'
        }`}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || pending.length === 0 || hasError}
        className="w-full rounded-xl bg-band py-3 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50"
      >
        {loading
          ? '保存中...'
          : pending.length > 0
            ? `${pending.length}ファイル（${pending.reduce((s, f) => s + f.games.length, 0)}試合）を保存`
            : '試合結果を保存'}
      </button>
    </div>
  )
}
