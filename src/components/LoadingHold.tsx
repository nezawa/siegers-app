'use client'

import { useEffect } from 'react'
import { holdLoading } from '@/lib/loadingStore'

// 置いてある間、画面中央のスピナー（NavigationSpinner）を出し続ける。PageSkeleton から使う
export default function LoadingHold() {
  useEffect(() => holdLoading(), [])
  return null
}
