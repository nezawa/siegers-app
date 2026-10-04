import Image from 'next/image'
import ContactEmail from './ContactEmail'

export default function Footer() {
  return (
    <footer className="mt-12 bg-band">
      <div className="h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {/* md 以上は 3 列グリッドでロゴ群を中央に、お問い合わせを右端に置く。狭い画面では縦に積んで中央揃え */}
      <div className="flex flex-col items-center gap-6 px-4 py-8 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-8 md:px-8">
        <div className="hidden md:block" />
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          <Image src="/logo1.png" alt="小雀シーガーズロゴ" width={1125} height={1059} className="h-16 w-auto sm:h-20" />
          <Image src="/logo2.png" alt="小雀シーガーズロゴ" width={624} height={624} className="h-16 w-auto sm:h-20" />
          <a
            href="https://www.instagram.com/kosuzume_siegers/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="transition-opacity hover:opacity-85"
          >
            <svg className="h-12 w-12 sm:h-15 sm:w-15" viewBox="0 0 24 24">
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
        <div className="md:justify-self-end">
          <ContactEmail />
        </div>
      </div>
    </footer>
  )
}
