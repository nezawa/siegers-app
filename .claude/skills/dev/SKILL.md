---
name: dev
description: このアプリ(Siegers ホームページ)をローカルで起動して動作確認するときの手順。dev サーバーの起動、管理者ページの認証、Supabase 接続の前提条件を含む。
---

# ローカル起動・動作確認

## 起動

```bash
npm run dev
```

- Next.js の dev サーバーが `http://localhost:3000` で起動する。
- バックグラウンドで起動し、`localhost:3000` にアクセスできるようになるまで待つこと。

## 前提条件

- `.env.local` に Supabase の接続情報が必要(リポジトリには含まれない)。
  無い場合、データ取得が全て失敗する。ユーザーに確認すること。
- データは本番の Supabase を参照している可能性があるため、
  **動作確認のためにデータを書き込む前にユーザーに確認する**。

## ページ構成

- 公開: `/`(トップ)、`/games`(試合一覧)、`/games/[id]`(試合詳細)、`/players`(通算成績)、`/players/[id]`(個人成績)
- 管理者(要ログイン、middleware/proxy で保護): `/admin/login`、`/admin/games/new`、`/admin/games/[id]/edit`、`/admin/players`、`/admin/settings`
- 管理者ページの確認にはメール+パスワードでのログインが必要。認証情報は持っていないので、ログインが必要な確認はユーザーに依頼する。

## 注意

- この Next.js はバージョンが新しく(16.x)、学習データと API が異なる可能性がある。
  コードを書く前に `node_modules/next/dist/docs/` の該当ガイドを読むこと(AGENTS.md 参照)。
