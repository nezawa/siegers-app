import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { BLOG_COOKIE } from '@/lib/blogAuth'

export async function POST() {
  const token = (await cookies()).get(BLOG_COOKIE)?.value
  if (token) {
    const supabase = await createClient()
    // 失敗しても Cookie は消すので結果は見ない
    await supabase.rpc('blog_logout', { p_token: token })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.delete(BLOG_COOKIE)
  return res
}
