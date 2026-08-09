import { RANK_LEGEND } from '@/lib/rankStyle'

const Swatch = ({ cls }: { cls: string }) => (
  <span className={`inline-block h-3 w-4 rounded-sm ${cls}`} />
)

// 成績表の下に出す色の凡例
export default function RankLegend({ className = '' }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-400 ${className}`}>
      <span className="mr-0.5">チーム内の位置：</span>
      <span className="text-gray-500">上位</span>
      {RANK_LEGEND.warm.map((cls, i) => <Swatch key={`w${i}`} cls={cls} />)}
      <span className="mx-1 text-gray-500">中位（色なし）</span>
      {RANK_LEGEND.cool.map((cls, i) => <Swatch key={`c${i}`} cls={cls} />)}
      <span className="text-gray-500">下位</span>
      <span className="ml-1">（率系の指標は規定打席・規定投球回に到達した選手の中で判定）</span>
    </p>
  )
}
