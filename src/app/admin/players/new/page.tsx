'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewPlayerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', number: '' as number | '', notes: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.from('players').insert({
      name: form.name,
      number: form.number !== '' ? Number(form.number) : null,
      notes: form.notes || null,
    })

    if (error) {
      setError('保存に失敗しました')
      setLoading(false)
      return
    }

    router.push('/admin/players')
    router.refresh()
  }

  const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/players" className="text-gray-400 hover:text-gray-600 text-sm">← 選手管理</Link>
        <h1 className="text-2xl font-bold text-gray-900">選手を追加</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">背番号</label>
            <input type="number" min="0" max="999" value={form.number}
              onChange={e => setForm({ ...form, number: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="1"
              className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前 *</label>
            <input type="text" required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="山田 太郎"
              className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
            <textarea rows={2} value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="キャプテン、投手兼任など"
              className={inputCls} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-900 text-white py-2 rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors">
            {loading ? '保存中...' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  )
}
