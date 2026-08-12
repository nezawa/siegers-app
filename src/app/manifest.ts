import type { MetadataRoute } from 'next'

// ホーム画面に追加したときの見た目(表示名・アイコン・色)を決めるファイル。
// アイコンは public/icon-*.png（maskable は Android の丸型枠で切られないよう余白を広めに取ってある）
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '小雀シーガーズ',
    short_name: 'シーガーズ',
    description: '草野球チーム 小雀シーガーズの公式サイト',
    lang: 'ja',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f1f5f9', // bg-slate-100（起動時のスプラッシュ背景）
    theme_color: '#6c9dc6', // --color-band
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
