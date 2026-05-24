import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NavClient from './NavClient'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="bg-blue-900 text-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">⚾ Siegers</Link>
        <NavClient isLoggedIn={!!user} />
      </div>
    </nav>
  )
}
