import Link from 'next/link'
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

const thCls = 'whitespace-nowrap px-3 py-2.5 text-center text-xs font-semibold text-white'
const tdCls = 'whitespace-nowrap px-3 py-2.5 text-center text-sm tabular-nums'
const rowCls = 'odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="border-l-4 border-band pl-2.5 text-lg font-bold text-gray-900">{children}</h2>
}

function PlayerLink({ id, name }: { id: string; name: string }) {
  return (
    <Link href={`/players/${id}`} className="text-gray-900 hover:text-blue-700 hover:underline">
      {name}
    </Link>
  )
}

// 通算記録室：次の節目（50刻み）まで残りわずかの選手と、達成済みの記録（年度別）を出す
export default function RecordsRoom({
  sections,
  within,
  achieved,
  achievedYears,
  selectedYear,
}: {
  sections: RecordSection[]
  within: number
  achieved: AchievedRow[] // 選択中の年度に絞り込み済み
  achievedYears: string[]
  selectedYear: string | null // null は全年度
}) {
  return (
    <div className="space-y-10 rounded-b-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-6">
      {/* もうすぐ達成 */}
      <div className="space-y-4">
        <div>
          <SectionHeading>もうすぐ達成</SectionHeading>
          <p className="mt-1.5 text-xs text-gray-400">通算成績で、次の50刻みの記録まで残り{within}以内の選手がいる記録（近い順に最大3人）</p>
        </div>
        {sections.length === 0 ? (
          <p className="rounded-xl bg-slate-50 py-10 text-center text-sm text-gray-400">該当する記録はありません</p>
        ) : (
          // 1記録あたり数人しかいないので、表ではなく「記録名 → 選手ごとの進み具合」のカードで見せる
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map(sec => (
              <section key={sec.key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
                <h3 className="flex items-baseline justify-between gap-2">
                  <span className="text-xl font-extrabold text-blue-950">{sec.title}</span>
                  <span className="shrink-0 text-xs text-gray-400">過去{sec.achievedCount}人</span>
                </h3>
                <ul className="mt-4 space-y-4">
                  {sec.candidates.map(c => (
                    <li key={c.playerId}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-bold"><PlayerLink id={c.playerId} name={c.name} /></span>
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
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <SectionHeading>達成済みの記録</SectionHeading>
          {achievedYears.length > 0 && (
            <AchievedYearSelect years={achievedYears} selected={selectedYear} />
          )}
        </div>
        {achieved.length === 0 ? (
          <p className="rounded-xl bg-slate-50 py-10 text-center text-sm text-gray-400">達成済みの記録はありません</p>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-gray-900/5">
            <table className="w-full border-collapse text-sm">
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
                    <td className={tdCls}>
                      <Link href={`/games/${a.gameId}`} className="text-blue-700 hover:underline">
                        {a.date.replaceAll('-', '/')}
                      </Link>
                    </td>
                    <td className={tdCls}>{a.opponent ?? '-'}</td>
                    {/* 初めての達成（1人目）は赤で目立たせる */}
                    <td className={`${tdCls}${a.nth === 1 ? ' font-bold text-red-600' : ''}`}>{a.nth}人目</td>
                    <td className={tdCls}>{a.gamesPlayed}</td>
                    <td className={`${tdCls} font-bold`}><PlayerLink id={a.playerId} name={a.name} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
