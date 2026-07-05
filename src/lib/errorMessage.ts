// Supabase などから返る unknown なエラーを表示用の文字列に整形する
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string; code?: string }
    const parts = [e.message, e.details, e.hint, e.code && `(${e.code})`].filter(Boolean)
    if (parts.length > 0) return parts.join(' / ')
  }
  return '不明なエラー'
}
