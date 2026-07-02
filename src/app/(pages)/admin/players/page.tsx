import { createClient } from '@/lib/supabase/server'
import PlayersManager from './PlayersManager'

export default async function AdminPlayersPage() {
  const supabase = await createClient()
  const { data: players } = await supabase.from('players').select('*').order('number')

  return <PlayersManager players={players ?? []} />
}
