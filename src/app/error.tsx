'use client'

export default function ErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="rounded-2xl bg-white px-8 py-14 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-sm font-semibold tracking-wide text-red-500">エラーが発生しました</p>
        <p className="mt-3 text-sm text-gray-500">
          ページの読み込み中に問題が発生しました。時間をおいて再度お試しください。
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-8 inline-block rounded-xl bg-band px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg"
        >
          再読み込み
        </button>
      </div>
    </div>
  )
}
