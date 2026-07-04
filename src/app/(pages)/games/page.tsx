import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import RecentGamesSection from '@/components/RecentGamesSection'

export default async function GamesPage() {
  const supabase = await createClient()
  const games = await fetchAllRows((from, to) =>
    supabase.from('games').select('*').order('date', { ascending: false }).order('id').range(from, to)
  )

  return <RecentGamesSection games={games} />
}
