import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// 管理者が最後に試合データを登録・編集した日時（表示用の文字列）。
// games.updated_at はDBのトリガーで自動更新される（supabase/add_games_updated_at.sql）。
// 未適用の環境ではクエリがエラーになるので null を返し、呼び出し側で表示を省く。
//
// フッター（全ページ）と成績ページの見出しの2箇所から呼ばれるため、
// cache() で1リクエストにつき1回のクエリにまとめる。
export const fetchLastUpdated = cache(async (): Promise<string | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('games')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data?.updated_at) return null

  return new Date(data.updated_at).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})
