// チーム内での相対位置を表すセル背景色。
// 上位1/3を暖色（amber）、中位1/3を無色、下位1/3を寒色（sky）とし、
// それぞれの帯の中を3段階の濃淡に分ける。上位・下位の両端ほど色が濃い。
//
// キーは lib/ranking.ts が返す tier（1〜3が暖色・-1〜-3が寒色）。
// 行の縞模様（odd:bg-white / even:bg-slate-50）より優先して塗るため、セル側の背景クラスとして当てる。

const TIER_BG: Record<number, string> = {
  1: 'bg-amber-300 text-amber-950 font-semibold', // 上位の中でも上
  2: 'bg-amber-200 text-amber-950',
  3: 'bg-amber-100 text-amber-900',
  [-1]: 'bg-sky-100 text-sky-900', // 下位の中では上（中位寄り）
  [-2]: 'bg-sky-200 text-sky-900',
  [-3]: 'bg-sky-300 text-sky-950 font-semibold', // 最下位側
}

export function rankBgClass(tier: number | undefined): string {
  return tier ? ` ${TIER_BG[tier] ?? ''}` : ''
}

// 凡例。色の定義とずれないよう TIER_BG から作る
export const RANK_LEGEND = {
  warm: [1, 2, 3].map(t => TIER_BG[t]),
  cool: [-1, -2, -3].map(t => TIER_BG[t]),
}
