import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'
import StatsDefaultsForm from './StatsDefaultsForm'
import { isGameType, FALLBACK_YEAR, FALLBACK_GTYPE } from '@/app/(pages)/players/filterDefaults'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '設定' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [{ data }, games] = await Promise.all([
    supabase.from('settings').select('*').eq('id', 1).single(),
    // 既定年度のプルダウン用。年度の選択肢は実際に試合がある年から作る
    fetchAllRows<{ date: string }>((from, to) =>
      supabase.from('games').select('date').order('date').range(from, to)
    ),
  ])

  // add_settings_stats_defaults.sql が未実行なら列が無いので null 扱い（＝通算・全試合）
  const defaultYear: string | null =
    typeof data?.default_stats_year === 'string' ? data.default_stats_year : FALLBACK_YEAR
  const defaultGtype = isGameType(data?.default_stats_game_type)
    ? data.default_stats_game_type
    : FALLBACK_GTYPE

  // 保存済みの既定年度は、その年の試合をまだ登録していなくても選択肢に残す
  const years = [...new Set([defaultYear, ...games.map(g => g.date?.slice(0, 4))].filter(Boolean))]
    .sort()
    .reverse() as string[]

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
        設定
      </h1>
      <div className="space-y-8">
        <SettingsForm
          qualifiedIpRate={data?.qualified_ip ?? 1.0}
          qualifiedPaRate={data?.qualified_pa ?? 3.1}
        />
        <StatsDefaultsForm
          defaultYear={defaultYear}
          defaultGtype={defaultGtype}
          years={years}
        />
      </div>
    </div>
  )
}
