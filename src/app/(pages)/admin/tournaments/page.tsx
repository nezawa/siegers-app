import { createClient } from '@/lib/supabase/server'
import MasterSection from '../MasterSection'

export default async function TournamentsPage() {
  const supabase = await createClient()
  const { data: tournaments } = await supabase.from('tournaments').select('id, name').order('name')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-gray-900">
        <span className="inline-block h-6 w-1.5 rounded-full bg-band" />
        大会名の管理
      </h1>
      <MasterSection title="大会名" table="tournaments" items={tournaments ?? []} />
    </div>
  )
}
