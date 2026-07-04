'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  qualifiedIpRate: number
  qualifiedPaRate: number
}

export default function SettingsForm({ qualifiedIpRate, qualifiedPaRate }: Props) {
  const [ipRate, setIpRate] = useState<number | ''>(qualifiedIpRate)
  const [paRate, setPaRate] = useState<number | ''>(qualifiedPaRate)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('settings').upsert({
        id: 1,
        qualified_ip: ipRate === '' ? 0 : Number(ipRate),
        qualified_pa: paRate === '' ? 0 : Number(paRate),
      })
      if (err) throw err
      setSaved(true)
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
        const e = err as { message?: string; details?: string; hint?: string; code?: string }
        const parts = [e.message, e.details, e.hint, e.code && `(${e.code})`].filter(Boolean)
        setError(parts.join(' / ') || '保存に失敗しました')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('保存に失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-32 text-right'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <h2 className="mb-1 border-l-4 border-band pl-2.5 font-bold text-gray-900">成績規定値</h2>
        <p className="mb-5 pl-3.5 text-xs text-gray-400">規定値 = 試合数 × 倍率で計算されます</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">規定投球回</label>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>試合数</span>
              <span className="text-gray-400">×</span>
              <input
                type="number" min="0" step="0.01" value={ipRate}
                onChange={e => setIpRate(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">規定打席</label>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>試合数</span>
              <span className="text-gray-400">×</span>
              <input
                type="number" min="0" step="0.01" value={paRate}
                onChange={e => setPaRate(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}
      {saved && <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg">保存しました</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-xl bg-band py-3 font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50">
        {loading ? '保存中...' : '設定を保存'}
      </button>
    </form>
  )
}
