// 画面中央のスピナー（NavigationSpinner）を出すかどうかの状態。
// 遷移開始〜URL切り替えまでは navigating、loading.tsx のスケルトン表示中は holds で出し続ける
let navigating = false
let holds = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())

export function subscribeLoading(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const isLoading = () => navigating || holds > 0

export function setNavigating(value: boolean) {
  if (navigating === value) return
  navigating = value
  emit()
}

// 呼んでいる間スピナーを出し続ける。戻り値を呼ぶと解除
export function holdLoading() {
  holds++
  emit()
  return () => {
    holds--
    emit()
  }
}
