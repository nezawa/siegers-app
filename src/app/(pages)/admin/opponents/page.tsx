import { createClient } from '@/lib/supabase/server'
import MasterSection from '../MasterSection'

export default async function OpponentsPage() {
  const supabase = await createClient()
  const { data: opponents } = await supabase.from('opponents').select('id, name').order('name')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
        対戦相手の管理
      </h1>
      <MasterSection title="対戦相手" table="opponents" items={opponents ?? []} />
    </div>
  )
}
