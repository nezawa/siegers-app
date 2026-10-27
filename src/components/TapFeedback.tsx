'use client'

import { useEffect } from 'react'

// スマホのタップは一瞬なので :active だけだと縮んだのが見えない。
// タップした瞬間にアニメーションを最後まで再生して、押したことが分かるようにする。layout.tsx に1つだけ置く
const POP_TARGET = 'button:not(:disabled), input[type=submit], input[type=button], input[type=reset], .press'

export default function TapFeedback() {
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== 'touch' || !(e.target instanceof Element)) return
      const pop = e.target.closest(POP_TARGET)
      const el = pop ?? e.target.closest('a[href]')
      if (!el) return
      const cls = pop ? 'tap-pop' : 'tap-dim'
      // 連打でも毎回最初から再生する
      el.classList.remove(cls)
      void (el as HTMLElement).offsetWidth
      el.classList.add(cls)
      const done = (ev: Event) => {
        if (ev.target !== el) return // 中のスピナー等のアニメーションは無視
        el.classList.remove(cls)
        el.removeEventListener('animationend', done)
      }
      el.addEventListener('animationend', done)
    }
    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])
  return null
}
