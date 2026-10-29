'use client'

import { useId, useMemo, useRef, useState } from 'react'

// 全角・半角や大文字・小文字の違いを無視して部分一致させる
const normalize = (s: string) => s.normalize('NFKC').toLowerCase()

// 対戦相手の絞り込み。入力した文字を含むチーム名を候補に出し、選ぶと確定する。
// value は確定済みの対戦相手（未選択は ''）。入力途中の文字は確定するまで絞り込みに使わない
export default function OpponentSearch({
  options,
  value,
  onChange,
  className = '',
}: {
  options: string[]
  value: string
  onChange: (opponent: string) => void
  className?: string
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  // 確定済みの名前がそのまま入っているときは、全候補を出す（別の相手に選び直しやすくする）
  const matches = useMemo(() => {
    const q = normalize(query.trim())
    if (!q || query === value) return options
    return options.filter(name => normalize(name).includes(q))
  }, [options, query, value])

  const select = (name: string) => {
    setQuery(name)
    setOpen(false)
    onChange(name)
    inputRef.current?.blur()
  }

  const clear = () => {
    setQuery('')
    setOpen(false)
    onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="対戦相手で検索"
        aria-label="対戦相手で絞り込む"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onFocus={() => { setOpen(true); setActive(0) }}
        onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0) }}
        // 候補を選ばずに離れたら、入力途中の文字は捨てて確定済みの表示に戻す
        onBlur={() => { setOpen(false); setQuery(value) }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a + 1, matches.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
          else if (e.key === 'Enter') {
            e.preventDefault()
            if (!query.trim()) clear()
            else if (matches[active]) select(matches[active])
          }
          else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
        }}
        className="w-full rounded-full border border-gray-200 bg-white py-1.5 pl-9 pr-9 text-base font-medium sm:text-sm text-gray-700 shadow-sm transition-colors placeholder:font-normal placeholder:text-gray-400 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="対戦相手の絞り込みを解除"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-64 min-w-48 overflow-y-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-900/10"
        >
          {matches.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-gray-400">一致する対戦相手がありません</li>
          ) : (
            matches.map((name, i) => (
              <li
                key={name}
                role="option"
                aria-selected={name === value}
                // mousedown で確定する（click だと先に input の blur が走り、候補が閉じてしまう）
                onMouseDown={e => { e.preventDefault(); select(name) }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-4 py-2.5 text-sm ${i === active ? 'bg-blue-50 text-blue-900' : 'text-gray-700'} ${name === value ? 'font-bold' : ''}`}
              >
                {name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
