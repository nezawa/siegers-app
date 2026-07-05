import PageSkeleton from '@/components/PageSkeleton'

// トップページと、個別の loading.tsx を持たないページ（管理画面など）のフォールバック
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <PageSkeleton rows={6} />
    </div>
  )
}
