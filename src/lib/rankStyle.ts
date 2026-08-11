// チーム内1位のセル背景色。
// 行の縞模様（odd:bg-white / even:bg-slate-50）より優先して塗るため、セル側の背景クラスとして当てる。

export const RANK1_BG = 'bg-amber-300 text-amber-950 font-semibold'

export function rankBgClass(rank: number | undefined): string {
  return rank === 1 ? ` ${RANK1_BG}` : ''
}
