import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="rounded-2xl bg-white px-8 py-14 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-5xl font-extrabold tracking-tight text-band">404</p>
        <p className="mt-3 text-sm text-gray-500">
          お探しのページが見つかりませんでした。
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-band px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  )
}
