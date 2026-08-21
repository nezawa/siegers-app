import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { BLOG_COOKIE, BLOG_SESSION_DAYS } from '@/lib/blogAuth'

export async function POST(req: Request) {
  let password: unknown
  try {
    password = (await req.json())?.password
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です' }, { status: 400 })
  }
  if (typeof password !== 'string' || password === '') {
    return NextResponse.json({ error: 'パスワードを入力してください' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: token, error } = await supabase.rpc('blog_login', { p_password: password })
  if (error) {
    return NextResponse.json({ error: `ログインに失敗しました: ${error.message}` }, { status: 500 })
  }
  // 照合失敗。パスワードが未設定なのか誤りなのかは区別せずに返す
  if (!token) {
    return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(BLOG_COOKIE, token as string, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * BLOG_SESSION_DAYS,
  })
  return res
}
