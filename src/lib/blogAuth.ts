import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// ブログの閲覧パスワード（管理者パスワードとは別）のセッション管理。
// パスワード照合とセッション検証は DB の security definer 関数側で行い、
// アプリはトークンを httpOnly Cookie で持ち回るだけにしている。

export const BLOG_COOKIE = 'blog_session'
export const BLOG_SESSION_DAYS = 30

export async function isBlogUnlocked(): Promise<boolean> {
  const supabase = await createClient()

  // 管理者としてログイン済みならパスワード入力なしで閲覧できる
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return true

  const token = (await cookies()).get(BLOG_COOKIE)?.value
  if (!token) return false

  const { data, error } = await supabase.rpc('blog_session_valid', { p_token: token })
  if (error) return false
  return data === true
}
