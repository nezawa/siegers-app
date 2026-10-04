import AchievedYearSelect from './AchievedYearSelect'

export type RecordCandidate = {
  playerId: string
  name: string
  current: string
  remaining: string
  remainingValue: number // 並び替え用（投球回はイニング換算）
  progress: number // 現在の50刻み区間での進み具合 0〜1
}

export type RecordSection = {
  key: string
  title: string // 「100安打」
  achievedCount: number // すでに達成している選手の人数
  candidates: RecordCandidate[]
}

export type AchievedRow = {
  id: string
  title: string
  playerId: string
  name: string
  gameId: string
  date: string
  opponent: string | null
  nth: number
  gamesPlayed: number
}

export type SeasonRecordRow = {
  key: string
  label: string
  value: string | null // 記録なしは null
  holders: { playerId: string; name: string; year: string }[] // 同率1位は複数
}

export type StreakRow = {
  key: string
  label: string
  length: number | null // 記録なしは null
  holders: { playerId: string; name: string; from: string; to: string; ongoing: boolean }[]
}

const thCls = 'whitespace-nowrap px-3 py-2.5 text-center text-xs font-semibold text-white'
const tdCls = 'whitespace-nowrap px-3 py-2.5 text-center text-sm tabular-nums'
// 通算記録室の表はすべて table-fixed で列幅を均等にする。
// スマホで潰れないよう各表に min-w を付け、足りない分は横スクロールにする
const rowCls = 'odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="border-l-4 border-band pl-2.5 text-lg font-bold text-gray-900">{children}</h2>
}

// 見出し下の説明文。PC では常に出し、スマホでは「ⓘ」を押したときだけ開く（文字ばかりに見えるのを避ける）
function Note({ children }: { children: React.ReactNode }) {
  return (
    <>
        <p className="mt-1.5 hidden text-xs text-gray-400 sm:block">{children}</p>
        <details className="group mt-1 sm:hidden">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-gray-400 [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
            </svg>
            集計のルール
          </summary>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{children}</p>
        </details>
    </>
  )
}


function OngoingBadge({ hidden = false }: { hidden?: boolean }) {
  return (
    <span
      className={`ml-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600${hidden ? ' invisible' : ''}`}
      aria-hidden={hidden}
    >
      継続中
    </span>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-slate-50 py-10 text-center text-sm text-gray-400">{children}</p>
}

const SECTIONS = [
  { id: 'upcoming', label: 'もうすぐ達成' },
  { id: 'achieved', label: '達成済み' },
  { id: 'season', label: 'シーズン記録' },
  { id: 'streak', label: '連続記録' },
]

// スマホで各欄へ飛ぶナビ。サイトのヘッダー（sticky・高さ約62px）の直下に固定する。
// 横スクロールさせず4つを均等幅で並べる（最も狭い 320px 幅でも収まる文字サイズ）
function SectionNav() {
  return (
    <nav className="sticky top-[62px] z-10 -mx-4 -mt-4 grid grid-cols-4 gap-1.5 border-b border-gray-100 bg-white/95 px-3 py-2.5 backdrop-blur sm:hidden">
      {SECTIONS.map(s => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="whitespace-nowrap rounded-full bg-white py-1.5 text-center text-[clamp(10px,2.9vw,12px)] text-gray-600 ring-1 ring-gray-200"
        >
          {s.label}
        </a>
      ))}
    </nav>
  )
}

// 通算記録室：もうすぐ達成・達成済みの記録（年度別）・歴代シーズン記録・連続試合記録
// PC は表、スマホ（sm 未満）は縦に読めるリストに切り替える
export default function RecordsRoom({
  sections,
  within,
  achieved,
  achievedYears,
  selectedYear,
  seasonBatting,
  seasonPitching,
  streaks,
}: {
  sections: RecordSection[]
  within: number
  achieved: AchievedRow[] // 選択中の年度に絞り込み済み
  achievedYears: string[]
  selectedYear: string | null // null は全年度
  seasonBatting: SeasonRecordRow[]
  seasonPitching: SeasonRecordRow[]
  streaks: StreakRow[]
}) {
  // sticky ナビ・ヘッダーの下に見出しが隠れないよう、飛び先に余白を取る
  const sectionCls = 'scroll-mt-32 space-y-4 sm:scroll-mt-24'

  return (
    <div className="space-y-10 rounded-b-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-6">
      <SectionNav />

      {/* もうすぐ達成 */}
      <div id="upcoming" className={sectionCls}>
        <div>
          <SectionHeading>もうすぐ達成</SectionHeading>
          <Note>通算成績で、次の50刻みの記録まで残り{within}以内の選手がいる記録（近い順に最大3人）</Note>
        </div>
        {sections.length === 0 ? (
          <Empty>該当する記録はありません</Empty>
        ) : (
          // 1記録あたり数人しかいないので、表ではなく「記録名 → 選手ごとの進み具合」のカードで見せる。
          // スマホは縦に積むと長すぎるので、横スワイプ（1枚ずつ止まる）にする
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {sections.map(sec => (
              <section
                key={sec.key}
                className="w-[78%] shrink-0 snap-center rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 sm:w-auto"
              >
                <h3 className="flex items-baseline justify-between gap-2">
                  <span className="text-xl font-extrabold text-blue-950">{sec.title}</span>
                  <span className="shrink-0 text-xs text-gray-400">過去{sec.achievedCount}人</span>
                </h3>
                <ul className="mt-4 space-y-4">
                  {sec.candidates.map(c => (
                    <li key={c.playerId}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-bold">{c.name}</span>
                        <span className="shrink-0 text-sm text-gray-500">
                          あと<span className="mx-0.5 text-lg font-extrabold tabular-nums text-red-600">{c.remaining}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-band" style={{ width: `${c.progress * 100}%` }} />
                      </div>
                      <p className="mt-1 text-xs tabular-nums text-gray-400">現在 {c.current}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* 達成済みの記録 */}
      <div id="achieved" className={sectionCls}>
        <div className="flex items-center gap-3">
          <SectionHeading>達成済みの記録</SectionHeading>
          {achievedYears.length > 0 && (
            <AchievedYearSelect years={achievedYears} selected={selectedYear} />
          )}
        </div>
        {achieved.length === 0 ? (
          <Empty>達成済みの記録はありません</Empty>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl ring-1 ring-gray-900/5 sm:block">
              <table className="w-full min-w-[600px] table-fixed border-collapse text-sm">
                <thead className="bg-band">
                  <tr>
                    <th className={thCls}>記録</th>
                    <th className={thCls}>達成日</th>
                    <th className={thCls}>対戦相手</th>
                    <th className={thCls}>達成順</th>
                    <th className={thCls}>出場試合数</th>
                    <th className={thCls}>氏名</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {achieved.map(a => (
                    <tr key={a.id} className={rowCls}>
                      <td className={`${tdCls} font-extrabold text-blue-950`}>{a.title}</td>
                      <td className={tdCls}>{fmtDate(a.date)}</td>
                      <td className={tdCls}>{a.opponent ?? '-'}</td>
                      {/* 初めての達成（1人目）は赤で目立たせる */}
                      <td className={`${tdCls}${a.nth === 1 ? ' font-bold text-red-600' : ''}`}>{a.nth}人目</td>
                      <td className={tdCls}>{a.gamesPlayed}</td>
                      <td className={`${tdCls} font-bold`}>{a.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* スマホ: 1件2行のリスト */}
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl ring-1 ring-gray-900/5 sm:hidden">
              {achieved.map(a => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-baseline gap-2">
                      <span className="font-extrabold text-blue-950">{a.title}</span>
                      <span className="text-sm font-bold">{a.name}</span>
                    </span>
                    <span className={`shrink-0 text-sm${a.nth === 1 ? ' font-bold text-red-600' : ' text-gray-500'}`}>{a.nth}人目</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="tabular-nums text-gray-700">{fmtDate(a.date)}</span>
                    <span className="text-gray-500">vs {a.opponent ?? '-'}</span>
                    <span className="text-gray-400">· {a.gamesPlayed}試合目</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* 歴代シーズン記録 */}
      <div id="season" className={sectionCls}>
        <div>
          <SectionHeading>歴代シーズン記録</SectionHeading>
          <Note>公式戦のみ。率系は規定打席・規定投球回に到達した選手、勝率は5勝以上の選手が対象</Note>
        </div>
        {/* グリッドの子は min-w-0 にしないと、中の表の最小幅でページ全体が横にはみ出す */}
        <div className="grid gap-4 lg:grid-cols-2">
          <SeasonRecordTable title="打撃" rows={seasonBatting} />
          <SeasonRecordTable title="投手" rows={seasonPitching} />
        </div>
      </div>

      {/* 連続試合記録 */}
      <div id="streak" className={sectionCls}>
        <div>
          <SectionHeading>連続試合記録</SectionHeading>
          <Note>公式戦のみ。出場・登板はチームの試合で連続、それ以外は本人が出場した試合の中で連続（欠場した試合は途切れない）</Note>
        </div>
        <StreakTable rows={streaks} />
      </div>
    </div>
  )
}

const fmtDate = (d: string) => d.replaceAll('-', '/')

// スマホの同率1位：2人までは並べ、3人以上は「◯◯ ほか N人」に畳んで押すと全員を出す
const shortYear = (y: string) => `'${y.slice(2)}`

function SeasonHoldersMobile({ holders }: { holders: SeasonRecordRow['holders'] }) {
  const item = (h: SeasonRecordRow['holders'][number]) => (
    <div key={`${h.playerId}-${h.year}`}>
      <span className="font-bold">{h.name}</span>
      <span className="ml-1 text-xs text-gray-400 tabular-nums">{shortYear(h.year)}</span>
    </div>
  )
  if (holders.length <= 2) return <>{holders.map(item)}</>
  return (
    <details className="group">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="font-bold">{holders[0].name}</span>
        <span className="ml-1 text-xs text-blue-700 group-open:hidden">ほか{holders.length - 1}人</span>
      </summary>
      <div className="mt-1 space-y-0.5">{holders.map(item)}</div>
    </details>
  )
}

function SeasonRecordTable({ title, rows }: { title: string; rows: SeasonRecordRow[] }) {
  return (
    <div className="min-w-0 self-start">
      {/* スマホ: 氏名と年度を1列にまとめた3列で、横スクロールなしに収める */}
      <div className="overflow-hidden rounded-xl ring-1 ring-gray-900/5 sm:hidden">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="bg-band">
            <tr>
              <th className={`${thCls} w-[34%]`}>{title}</th>
              <th className={`${thCls} w-[26%]`}>記録</th>
              <th className={thCls}>氏名</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(r => (
              <tr key={r.key} className={rowCls}>
                <td className="px-2 py-2.5 text-center text-sm font-bold text-gray-700">{r.label}</td>
                {r.value === null ? (
                  <td colSpan={2} className="px-2 py-2.5 text-center text-gray-300">-</td>
                ) : (
                  <>
                    <td className="px-2 py-2.5 text-center font-extrabold tabular-nums text-blue-950">{r.value}</td>
                    <td className="px-2 py-2.5 text-center"><SeasonHoldersMobile holders={r.holders} /></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden overflow-x-auto rounded-xl ring-1 ring-gray-900/5 sm:block">
        <table className="w-full min-w-[420px] table-fixed border-collapse text-sm">
          <thead className="bg-band">
            <tr>
              <th className={thCls}>{title}</th>
              <th className={thCls}>記録</th>
              <th className={thCls}>氏名</th>
              <th className={thCls}>年度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(r => (
              <tr key={r.key} className={rowCls}>
                <td className={`${tdCls} font-bold text-gray-700`}>{r.label}</td>
                {r.value === null ? (
                  <td colSpan={3} className={`${tdCls} text-gray-300`}>-</td>
                ) : (
                  <>
                    <td className={`${tdCls} font-extrabold text-blue-950`}>{r.value}</td>
                    {/* 同率1位は1人1行で縦に並べ、氏名と年度の行を揃える */}
                    <td className={`${tdCls} font-bold`}>
                      {r.holders.map(h => (
                        <div key={`${h.playerId}-${h.year}`}>{h.name}</div>
                      ))}
                    </td>
                    <td className={tdCls}>
                      {r.holders.map(h => <div key={`${h.playerId}-${h.year}`}>{h.year}</div>)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StreakTable({ rows }: { rows: StreakRow[] }) {
  return (
    <>
      {/* スマホ: 1項目2行のリスト */}
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl ring-1 ring-gray-900/5 sm:hidden">
        {rows.map(r => (
          <li key={r.key} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-bold text-gray-700">連続{r.label}</span>
              <span className={`shrink-0 font-extrabold tabular-nums ${r.length === null ? 'text-gray-300' : 'text-blue-950'}`}>
                {r.length === null ? '-' : `${r.length}試合`}
              </span>
            </div>
            {r.holders.map(h => (
              <div key={`${h.playerId}-${h.from}`} className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
                <span className="font-bold">{h.name}</span>
                <span className="tabular-nums text-gray-500">{fmtDate(h.from)}〜{fmtDate(h.to)}</span>
                {h.ongoing && <OngoingBadge />}
              </div>
            ))}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl ring-1 ring-gray-900/5 sm:block">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
          <thead className="bg-band">
            <tr>
              <th className={thCls}>出場試合連続</th>
              <th className={thCls}>連続試合数</th>
              <th className={thCls}>氏名</th>
              <th className={thCls}>期間</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(r => (
              <tr key={r.key} className={rowCls}>
                <td className={`${tdCls} font-bold text-gray-700`}>{r.label}</td>
                {r.length === null ? (
                  <td colSpan={3} className={`${tdCls} text-gray-300`}>-</td>
                ) : (
                  <>
                    <td className={`${tdCls} font-extrabold text-blue-950`}>{r.length}試合</td>
                    {/* 同じ長さの1位は1人1行で縦に並べ、氏名と期間の行を揃える */}
                    <td className={`${tdCls} font-bold`}>
                      {r.holders.map(h => (
                        <div key={`${h.playerId}-${h.from}`}>{h.name}</div>
                      ))}
                    </td>
                    {/* 期間は中央に置きつつ日付の先頭を揃える。「継続中」が無い行も同じ幅の透明なバッジで
                        場所を取っておき、どの行も同じ幅のまま中央揃えになるようにする */}
                    <td className={tdCls}>
                      {r.holders.map(h => (
                        <div key={`${h.playerId}-${h.from}`}>
                          {fmtDate(h.from)}〜{fmtDate(h.to)}
                          <OngoingBadge hidden={!h.ongoing} />
                        </div>
                      ))}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
