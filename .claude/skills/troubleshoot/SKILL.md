---
name: troubleshoot
description: このプロジェクトで実際に起きたエラーと解決策の辞典。エラーメッセージの調査を始める前に必ず一度参照する(既知のエラーなら即解決できる)。
---

# 既知のエラーと解決策

原因調査を始める前にここを見る。一致したらその解決策を適用する。
一致しなければ通常の調査に進み、**解決したらこのファイルに追記する**。

## 実行時エラー

- **`JWT expired`(公開ページで発生)**
  認証トークンのリフレッシュは `src/proxy.ts` の `getUser()` が担っている。
  `config.matcher` が全ページ対象(静的アセット除外の正規表現)になっているか確認。
  `/admin` だけに絞ると、ログイン中に公開ページを開いたとき期限切れトークンのまま落ちる。

- **`column ... not found` / `Could not find the ... column in the schema cache`**
  `supabase/` のSQLが Supabase 側で未実行。該当SQLを Dashboard → SQL Editor で実行するよう案内する。

- **`invalid input syntax for type integer: "1.5"`**
  DB列が `integer` のまま小数を保存しようとしている。
  `alter table ... alter column ... type numeric using ...::numeric` で型変更(実例: `supabase/alter_settings_qualified_numeric.sql`)。

- **一覧・集計の件数が1000件で頭打ち**
  PostgREST は1リクエスト最大1000行。全件が要る集計は `src/lib/supabase/fetchAll.ts` の
  `fetchAllRows` を使い、クエリに必ず `.order()` を付ける(ページング整合性のため)。

## ビルド・型チェックのエラー

- **`tsc` で `Definitions ... conflict` / `Duplicate identifier`(`.next/types/... 2.ts` など)**
  `.next` 内に古い生成型ファイルが残っている。`rm -rf .next` してやり直す。

- **`react/jsx-no-comment-textnodes`(JSXテキスト内の `//`)**
  JSX内に `//` をそのまま書くとコメント誤認される。`{'//'}` と書く。

## このNext.jsバージョン(16系)の注意

- **`error.tsx` の再試行コールバックは `reset` ではなく `unstable_retry`**(props名が違う)
- 仕様が怪しいときは推測せず `node_modules/next/dist/docs/` の同梱ドキュメントを読む(AGENTS.md の指示)
- middleware は `src/proxy.ts`(関数名も `proxy`)

## 環境まわり

- **画像が Vercel 上で 404**: `public/` の拡張子は小文字にする(`hero.JPG` はNG)
- **`Port 3000 is in use`**: dev サーバーが既に起動中。古い方を止めるか案内された別ポートを使う
- **管理ページの保存系が全部失敗する**: ログインセッション切れの可能性。`/admin/login` で入り直す
