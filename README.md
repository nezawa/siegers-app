草野球チーム「Siegers」のホームページ。試合結果・選手成績の公開と、管理者による入力・編集を行う Next.js (App Router) アプリです。

## 技術スタック

- Next.js (App Router) + TypeScript
- Tailwind CSS 4
- Supabase (PostgreSQL + Auth)

## Getting Started

環境変数を `.env.local` に設定します（Supabase プロジェクトの値を使用）。

```bash
NEXT_PUBLIC_SUPABASE_URL=xxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
```

開発サーバーを起動します。

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開くと確認できます。

## 主なスクリプト

- `npm run dev` — 開発サーバー起動
- `npm run build` — 本番ビルド
- `npm run start` — 本番サーバー起動
- `npm run lint` — ESLint 実行

## ページ構成

公開ページ:
- `/` — チーム勝敗数、直近5試合
- `/games` — 試合一覧
- `/games/[id]` — 試合詳細（打撃・投手成績）。ログイン中は編集ボタンを表示
- `/players` — 選手通算成績
- `/players/[id]` — 選手個人の成績詳細

管理者ページ（`middleware` で認証保護）:
- `/admin/login` — メール＋パスワード認証
- `/admin/games/new` — 試合結果の入力
- `/admin/games/[id]/edit` — 試合結果の編集
- `/admin/players` — 選手一覧・削除
- `/admin/players/new` — 選手登録
- `/admin/settings` — 規定打席・規定投球回率などの設定

## Deploy

Vercel へのデプロイを想定しています。詳細は [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。
