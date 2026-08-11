import { RANK1_BG } from '@/lib/rankStyle'

// 成績表の下に出す色の凡例
export default function RankLegend({ className = '' }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-400 ${className}`}>
      <span className={`rounded px-1.5 py-0.5 ${RANK1_BG}`}>色付き</span>
      <span>はチーム内1位（率系の指標は規定打席・規定投球回に到達した選手の中で判定）</span>
    </p>
  )
}
