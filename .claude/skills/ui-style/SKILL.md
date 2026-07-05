---
name: ui-style
description: このサイトのデザイン言語(色・カード・チップ・表・スマホ対応)とUI実装パターン集。ページやコンポーネントのUIを追加・変更するとき、「リッチにして」と言われたときは必ず参照する。
---

# UIスタイルガイド

サイト全体は「水色の帯(band)+白い角丸カード」で統一されている。
新しいUIは必ず以下のパターンを踏襲する。独自の色・角丸・影を発明しない。

## 色

- ベース色: `bg-band`(水色 #6c9dc6。`src/app/globals.css` の `--color-band` で定義)
- アクセント: `text-amber-300`(band上の強調数字・英字ラベル)、`border-band`(区切り)
- 濃紺: `text-blue-950` / `shadow-blue-950/20`(数字・影)
- ページ背景: `bg-slate-100`(layout.tsx)。カードは白

## 定型パターン(コピーして使う)

- **白カード**: `rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5`
- **バナーカード**(試合詳細・個人ページ上部): `relative overflow-hidden rounded-3xl bg-band text-white shadow-xl shadow-blue-950/20` + 装飾の白い輪 `absolute h-64 w-64 rounded-full border-[18px] border-white/10`
- **ページ見出し h1**: `flex items-center gap-2.5 text-2xl font-bold text-gray-900` + `<span className="inline-block h-6 w-1.5 rounded-full bg-band" />`
- **セクション見出し h2**(カード内): `border-l-4 border-band pl-2.5 font-bold text-gray-900`
- **チップ(トグル)**: `px-3.5 py-1.5 rounded-full text-sm` + 選択中 `bg-band text-white font-medium shadow` / 非選択 `bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50`
- **入力欄**: `w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30`
- **主ボタン**: `rounded-xl bg-band font-bold text-white shadow-md shadow-blue-950/20 transition-all hover:opacity-85 hover:shadow-lg disabled:opacity-50`
- **テーブル行**: `odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors`。先頭列固定は `sticky left-0 bg-inherit`
- **タブ+表の一体型**(成績ページ): タブ行に `overflow-hidden rounded-t-2xl border-b-4 border-band`、表側は `rounded-b-2xl`(上下で角丸を分担)
- **エラー表示**: `text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg`
- **空データ**: `rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-900/5` + 「〜がありません」

## スマホ対応の定石

- 横並びが潰れるときは、要素を `w-full sm:w-auto` にして行を分ける(flex-wrap 任せにしない)
- date入力など幅が要る入力は `min-w-0 flex-1 sm:flex-none` で行の残り幅を分け合う
- 文字ボタンが入らないときはスマホだけアイコン化: `<span className="sm:hidden">✕</span><span className="hidden sm:inline">クリア</span>`
- グリッドは `grid-cols-2 sm:grid-cols-4` のように段階指定

## その他の決まり

- ローディングは各ルートの `loading.tsx` + `src/components/PageSkeleton.tsx`(header/filters/rows プロパティで形を選ぶ)
- アイコンは 24x24 のアウトラインSVG(`fill="none" stroke="currentColor" strokeWidth={1.8〜2}`)をインラインで書く。アイコンライブラリは入れない
- 管理メニューの項目追加は `src/components/NavClient.tsx` 冒頭の `ADMIN_MENU` 配列に1件足すだけ(PC・スマホ両方に反映される)
- ロゴ等の `public/` 画像は `next/image` を使う。`hero.jpg` / `team.jpg` はCSS背景画像(ファイルが無くても壊れない設計)なので `<Image>` に変えない
- ハンバーガーメニュー内は左揃え。アコーディオンはラベル左・矢印右端
