import { createClient } from '@/lib/supabase/server'
import PlayersManager from './PlayersManager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '選手管理' }

export default async function AdminPlayersPage() {
  const supabase = await createClient()
  const { data: players } = await supabase.from('players').select('*').order('number')

  return <PlayersManager players={players ?? []} />
}
