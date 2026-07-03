import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import Link from 'next/link'

// チーム紹介の文章はここを編集する（slogan は \n で改行できる。行を消す/コメントアウトすると非表示）
const TEAM: { slogan?: string; name: string; about: string } = {
  // slogan: '野球を、\n本気で楽しむ。',
  name: '小雀シーガーズ',
  about:
    '小雀シーガーズは、野球好きの仲間が集まって結成された草野球チームです。勝ちにこだわりながら、何より野球を楽しむことを大切に、週末を中心に活動しています。',
}

// ベースの水色は globals.css の --color-band で定義（bg-band で使用）

const DOW_JA = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${DOW_JA[d.getDay()]}）`
}

function SectionHeading({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2 className={`text-center text-lg sm:text-xl font-semibold tracking-[0.2em] ${light ? 'text-white' : 'text-gray-700'}`}>
      <span className="mx-3">−</span>{children}<span className="mx-3">−</span>
    </h2>
  )
}

export default async function TopPage() {
  const supabase = await createClient()
  const games = await fetchAllRows((from, to) =>
    supabase
      .from('games')
      .select('id, date, opponent, venue, score_us, score_them, result')
      .order('date', { ascending: false })
      .order('id')
      .range(from, to)
  )

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })

  // 今後のスケジュール（今日以降・近い日付順に3件）と直近の試合結果
  // games は日付降順なので、末尾3件が「今日以降で近い順」になる
  const upcomingGames = games.filter(g => g.date >= today).slice(-3).reverse()
  const recentResults = games.filter(g => g.date < today).slice(0, 3)

  // 年度別成績（直近3年）
  const yearlyRecords = [...new Set(games.map(g => g.date.slice(0, 4)))]
    .sort()
    .reverse()
    .slice(0, 3)
    .map(year => {
      const ys = games.filter(g => g.date.startsWith(year))
      return {
        year,
        w: ys.filter(g => g.result === 'W').length,
        l: ys.filter(g => g.result === 'L').length,
        d: ys.filter(g => g.result === 'D').length,
      }
    })

  return (
    <div className="flex w-full flex-1 flex-col -mb-12 bg-white">
      {/* ヒーロー（ぼかした写真の帯 + 写真ボックス） */}
      <section className="relative overflow-hidden bg-band px-4 py-8 sm:py-12">
        {/* 写真を拡大してぼかした背景（hero.jpg が無い場合は水色のまま） */}
        <div className="absolute inset-0 scale-110 bg-[url('/hero.jpg')] bg-cover bg-center blur-sm" />
        <div className="absolute inset-0 bg-blue-950/40" />
        <div className="relative mx-auto aspect-[4/3] w-full max-w-4xl overflow-hidden shadow-xl shadow-blue-950/20 sm:aspect-[16/9]">
          {/* public/hero.jpg を置くと背景写真になる */}
          <div className="absolute inset-0 bg-blue-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.4),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.15),transparent_50%)]" />
          <div className="absolute -left-10 -top-16 h-56 w-56 rounded-full border-[16px] border-white/5" />
          <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full border-[20px] border-white/5" />
          <div className="absolute inset-0 bg-[url('/hero.jpg')] bg-cover bg-center" />

          {/* 電光掲示板の位置に合わせて配置（left/top の % で微調整できる） */}
          {TEAM.slogan && (
            <p className="absolute left-[43%] top-[30%] -translate-x-1/2 -translate-y-1/2 whitespace-pre-line text-center text-3xl font-extrabold leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] sm:text-5xl">
              {TEAM.slogan}
            </p>
          )}
        </div>
      </section>

      {/* シーガーズとは（水色帯・下端だけ斜め） */}
      <section className="relative py-20 sm:py-24">
        {/* 上半分はベタ塗りでヒーロー画像と隙間なくつなぐ */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-band" />
        <div className="absolute inset-x-0 inset-y-6 -skew-y-2 bg-band" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <SectionHeading light>小雀シーガーズとは</SectionHeading>
          <p className="mt-8 text-sm sm:text-base leading-8 text-white whitespace-pre-line">
            {TEAM.about}
          </p>

          {yearlyRecords.length > 0 && (
            <div className="mt-8 space-y-1.5 text-sm sm:text-base text-white">
              <p className="text-xs tracking-widest text-white/70">これまでの成績</p>
              {yearlyRecords.map(r => (
                <p key={r.year} className="font-medium tabular-nums">
                  {r.year}年　{r.w}勝 {r.l}敗 {r.d}分
                </p>
              ))}
            </div>
          )}

          <Link
            href="/about"
            className="mt-10 inline-block rounded bg-white px-10 py-3 text-sm font-bold text-blue-950 shadow-md transition-opacity hover:opacity-85"
          >
            詳しくはこちら
          </Link>
        </div>
      </section>

      {/* 選手名鑑 */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl">
          <SectionHeading>選手成績</SectionHeading>
          <Link href="/players" className="group mt-8 block">
            <div className="relative aspect-[5/2] w-full overflow-hidden shadow-lg shadow-blue-950/15 transition-transform duration-200 group-hover:-translate-y-1">
              {/* public/team.jpg を置くとチーム写真になる */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-950" />
              <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full border-[12px] border-white/10" />
              <div className="absolute inset-0 bg-[url('/team.jpg')] bg-cover bg-center" />
              {/* ホバー時だけ暗くなり「選手成績を見る」が表示される */}
              <div className="absolute inset-0 flex items-center justify-center transition-colors duration-200 group-hover:bg-blue-950/40">
                <span className="rounded-full bg-white/90 px-8 py-2.5 text-sm font-bold text-blue-950 shadow opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  選手成績を見る →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* スコア（水色帯・上端だけ斜め）。flex-1 で余った高さも水色で埋めてフッターに繋ぐ */}
      <section className="relative flex-1 py-20 sm:py-24">
        {/* 下半分はベタ塗りでフッターと隙間なくつなぐ */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-band" />
        <div className="absolute inset-y-6 inset-x-0 -skew-y-2 bg-band" />
        <div className="relative mx-auto max-w-4xl px-4">
          <SectionHeading light>スコア</SectionHeading>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* 試合結果 */}
            <div>
              <p className="mb-3 text-center text-xs font-semibold tracking-[0.25em] text-white/90">試合結果</p>
              <div className="divide-y divide-gray-100 bg-white shadow-md">
                {recentResults.length === 0 ? (
                  <p className="py-9 text-center text-sm text-gray-400">試合結果はまだありません</p>
                ) : (
                  recentResults.map(g => (
                    <Link key={g.id} href={`/games/${g.id}`} className="block p-4 text-center transition-colors hover:bg-blue-50">
                      <p className="text-xs tabular-nums text-gray-500">
                        {formatDate(g.date)}{g.venue && `　@ ${g.venue}`}
                      </p>
                      <div className="mt-1.5 flex items-center justify-center gap-3 text-sm font-bold text-blue-950">
                        <span>{TEAM.name}</span>
                        <span className="tabular-nums text-base">
                          {g.score_us} - {g.score_them}
                        </span>
                        <span className="max-w-28 truncate">{g.opponent}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* 今後のスケジュール */}
            <div>
              <p className="mb-3 text-center text-xs font-semibold tracking-[0.25em] text-white/90">今後のスケジュール</p>
              <div className="divide-y divide-gray-100 bg-white shadow-md">
                {upcomingGames.length === 0 ? (
                  <p className="py-9 text-center text-sm text-gray-400">次の試合は未定です</p>
                ) : (
                  upcomingGames.map(g => (
                    <div key={g.id} className="p-4 text-center">
                      <p className="text-xs tabular-nums text-gray-500">
                        {formatDate(g.date)}{g.venue && `　@ ${g.venue}`}
                      </p>
                      <div className="mt-1.5 flex items-center justify-center gap-3 text-sm font-bold text-blue-950">
                        <span>{TEAM.name}</span>
                        <span className="text-xs text-gray-400">VS</span>
                        <span className="max-w-28 truncate">{g.opponent}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/games"
              className="inline-block rounded bg-white px-10 py-3 text-sm font-bold text-blue-950 shadow-md transition-opacity hover:opacity-85"
            >
              試合結果一覧へ
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
