import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NavClient from './NavClient'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white shadow-lg shadow-blue-950/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 text-lg transition-colors group-hover:bg-white/20">
            ⚾
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold italic tracking-wider">SIEGERS</span>
            <span className="block text-[10px] tracking-[0.25em] text-blue-300">BASEBALL TEAM</span>
          </span>
        </Link>
        <NavClient isLoggedIn={!!user} />
      </div>
      <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
    </nav>
  )
}
