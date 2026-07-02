---
name: supabase-review
description: Supabaseのクエリやデータ取得コードを書く・レビューするときの観点。新しいデータ取得処理の追加時や、ページ表示が遅いときに使う。
---

# Supabase クエリの観点

このアプリのデータ取得は `src/lib/supabase/` のクライアント経由。
Server Component では `server.ts`、Client Component では `client.ts` を使う。

## 書くときの規約(既存コードの流儀)

- 複数テーブルを取得するページでは `Promise.all` で並列取得する
  (例: `src/app/players/page.tsx`、`src/app/admin/games/[id]/edit/page.tsx`)
- リレーションは JOIN 構文で1クエリにまとめる:
  `select('*, games(date, game_type)')` のように書く。ループ内での逐次取得(N+1)は書かない
- 単一行の取得は `.eq(...).single()` を使う
- 並び順が意味を持つ一覧は必ず `.order()` を付ける(選手は `number`、試合は `date` 降順)

## レビュー観点

1. **N+1 になっていないか** — `map` や `for` の中で `await supabase...` していたら JOIN か一括取得に直す
2. **取得列** — 一覧で全列不要なら `select('id, date, ...')` のように絞る(小規模アプリなので過度な最適化は不要。列挙が保守の妨げになるなら `*` で良い)
3. **エラーハンドリング** — `{ data, error }` の `error` を握りつぶして `data!` を使っていないか。`data` が null の場合の表示を確認
4. **RLS の前提** — 閲覧は全員可、書き込みは認証済みユーザーのみ。
   書き込み処理を公開ページに追加していないか、admin 配下は認証保護(`src/proxy.ts`)を通っているか確認
5. **スキーマ変更を伴う場合** — コードからは DB を変更できない。必要な SQL をユーザーに提示する([[add-stat-column]] 参照)
