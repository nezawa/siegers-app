import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import { fetchLastUpdated } from '@/lib/lastUpdated'
import RecentGamesSection from '@/components/RecentGamesSection'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '試合結果' }

export default async function GamesPage() {
  const supabase = await createClient()
  const [games, lastUpdated] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase.from('games').select('*').order('date', { ascending: false }).order('id').range(from, to)
    ),
    fetchLastUpdated(),
  ])

  return <RecentGamesSection games={games} lastUpdated={lastUpdated} />
}
