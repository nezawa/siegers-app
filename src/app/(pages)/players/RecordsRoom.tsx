import Link from 'next/link'
import AchievedYearSelect from './AchievedYearSelect'

export type RecordCandidate = {
  playerId: string
  name: string
  current: string
  remaining: string
  remainingValue: number // 並び替え用（投球回はイニング換算）
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
          <p className="mt-1.5 text-xs text-gray-400">通算成績で、次の50刻みの記録まで残り{within}以内の選手</p>
        </div>
        {sections.length === 0 ? (
          <p className="rounded-xl bg-slate-50 py-10 text-center text-sm text-gray-400">該当する記録はありません</p>
        ) : (
          sections.map(sec => (
            <section key={sec.key} className="overflow-hidden rounded-xl ring-1 ring-gray-900/5">
              <h3 className="flex items-baseline gap-2 bg-band px-4 py-3 text-lg font-extrabold text-white">
                {sec.title}
                <span className="text-sm font-bold text-white/80">（過去{sec.achievedCount}人）</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-blue-950/70">
                    <tr>
                      <th className={thCls}>氏名</th>
                      <th className={thCls}>現在</th>
                      <th className={thCls}>達成まで</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sec.candidates.map(c => (
                      <tr key={c.playerId} className={rowCls}>
                        <td className={`${tdCls} font-bold`}><PlayerLink id={c.playerId} name={c.name} /></td>
                        <td className={tdCls}>{c.current}</td>
                        <td className={`${tdCls} font-extrabold text-red-600`}>あと{c.remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
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
