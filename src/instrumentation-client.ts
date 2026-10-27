// 画面遷移の開始を NavigationSpinner に知らせる（Link・router.push・戻る/進む すべてで呼ばれる）。
// クエリも含めて今と同じURLへの遷移（同じ条件での再検索など）は画面が変わらないので知らせない
export function onRouterTransitionStart(url: string) {
  const next = new URL(url, window.location.href)
  if (next.pathname === window.location.pathname && next.search === window.location.search) return
  window.dispatchEvent(new Event('app:navigation-start'))
}
