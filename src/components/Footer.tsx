import Image from 'next/image'
import { fetchLastUpdated } from '@/lib/lastUpdated'

// 日時が取れない場合（updated_at の SQL 未適用など）は、その行だけ出さない
export default async function Footer() {
  const lastUpdated = await fetchLastUpdated()

  return (
    <footer className="mt-12 bg-band">
      <div className="h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="flex flex-wrap items-center justify-center gap-8 px-4 py-8">
        <Image src="/logo1.png" alt="小雀シーガーズロゴ" width={1125} height={1059} className="h-20 w-auto" />
        <Image src="/logo2.png" alt="小雀シーガーズロゴ" width={624} height={624} className="h-20 w-auto" />
        <a
          href="https://www.instagram.com/kosuzume_siegers/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="transition-opacity hover:opacity-85"
        >
          <svg className="h-15 w-15" viewBox="0 0 24 24">
            <defs>
              <radialGradient id="ig-gradient" cx="30%" cy="107%" r="150%">
                <stop offset="0%" stopColor="#fdf497" />
                <stop offset="5%" stopColor="#fdf497" />
                <stop offset="45%" stopColor="#fd5949" />
                <stop offset="60%" stopColor="#d6249f" />
                <stop offset="90%" stopColor="#285AEB" />
              </radialGradient>
            </defs>
            <rect width="24" height="24" rx="5.5" fill="url(#ig-gradient)" />
            <rect x="5.7" y="5.7" width="12.6" height="12.6" rx="3.4" fill="none" stroke="#fff" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.5" />
            <circle cx="15.8" cy="8.2" r="0.95" fill="#fff" />
          </svg>
        </a>
      </div>
      {lastUpdated && (
        <p className="px-4 pb-6 text-center text-xs text-white/70">
          成績データ更新：{lastUpdated}
        </p>
      )}
    </footer>
  )
}
