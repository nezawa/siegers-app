import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getBlogToken } from '@/lib/blogAuth'

// ブログの投稿。セッショントークンは httpOnly Cookie にあるため、
// ブラウザから直接 RPC を呼ばずにこの API を経由する
export async function POST(req: Request) {
  let payload: { title?: unknown; body?: unknown; author?: unknown; published_at?: unknown }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です' }, { status: 400 })
  }

  const title = typeof payload.title === 'string' ? payload.title : ''
  const body = typeof payload.body === 'string' ? payload.body : ''
  const author = typeof payload.author === 'string' ? payload.author : ''
  const publishedAt = typeof payload.published_at === 'string' && payload.published_at !== ''
    ? payload.published_at
    : null

  if (title.trim() === '' || body.trim() === '') {
    return NextResponse.json({ error: 'タイトルと本文を入力してください' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('blog_post_create', {
    p_token: await getBlogToken(),
    p_title: title,
    p_body: body,
    p_published_at: publishedAt,
    p_author: author,
  })

  if (error) {
    // ログイン切れは 401 で返し、画面側で入力画面へ戻せるようにする
    const status = error.message.includes('ログインしてください') ? 401 : 500
    return NextResponse.json({ error: `投稿に失敗しました: ${error.message}` }, { status })
  }

  return NextResponse.json({ id: data as string })
}
