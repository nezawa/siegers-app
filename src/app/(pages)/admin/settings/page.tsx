import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data } = await supabase.from('settings').select('*').eq('id', 1).single()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
        設定
      </h1>
      <SettingsForm
        qualifiedIpRate={data?.qualified_ip ?? 1.0}
        qualifiedPaRate={data?.qualified_pa ?? 3.1}
      />
    </div>
  )
}
