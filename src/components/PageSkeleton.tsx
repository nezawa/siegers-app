// データ取得中に表示する共通スケルトン（各ページの loading.tsx から使う）。
// header: 試合詳細・個人成績のようなバナーカードがあるページ用
// filters: 成績ページのフィルターパネルがあるページ用
export default function PageSkeleton({
  header = false,
  filters = false,
  rows = 8,
}: {
  header?: boolean
  filters?: boolean
  rows?: number
}) {
  return (
    <div role="status" aria-label="読み込み中" className="animate-pulse space-y-5">
      {/* ページ見出し */}
      <div className="h-8 w-44 rounded-lg bg-gray-200" />

      {/* バナーカード */}
      {header && <div className="h-36 rounded-3xl bg-gray-200 sm:h-40" />}

      {/* フィルターパネル */}
      {filters && (
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-100" />
            ))}
          </div>
          <div className="h-9 w-full max-w-md rounded-lg bg-gray-100" />
        </div>
      )}

      {/* 表 */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
        <div className="h-11 bg-gray-200" />
        <div className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-10 rounded bg-gray-100" />
              <div className="h-4 flex-1 rounded bg-gray-100" />
              <div className="h-4 w-16 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
