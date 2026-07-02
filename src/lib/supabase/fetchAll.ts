const PAGE_SIZE = 1000

type PageResult<T> = { data: T[] | null; error: { message: string } | null }

// Supabase(PostgREST)は1リクエスト最大1000行のため、全件を前提とする集計は
// range でページングして取り切る。ページングの整合性のため呼び出し側のクエリには
// 必ず .order() を付けること。
export async function fetchAllRows<T>(
  getPage: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<T[]> {
  const all: T[] = []
  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE
    const { data, error } = await getPage(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const rows = data ?? []
    all.push(...rows)
    if (rows.length < PAGE_SIZE) return all
  }
}
