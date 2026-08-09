const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

// チーム内順位（1〜3位）のメダル。
// 置き場所のセルには relative を付けること。セル右端の padding 内に絶対配置するので、
// バッジの有無で数字の位置がずれず、列幅も増えない。
export default function RankBadge({ rank }: { rank: number }) {
  if (!MEDALS[rank]) return null
  return (
    <span
      className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] leading-none"
      role="img"
      aria-label={`${rank}位`}
    >
      {MEDALS[rank]}
    </span>
  )
}
