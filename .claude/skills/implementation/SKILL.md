---
name: implementation
description: '実装スキル。設計ドキュメントをもとにコードの実装を行う。Use when: 実装、コーディング、開発、機能追加、バグ修正、リファクタリング、マイグレーション作成'
argument-hint: '実装対象の設計ドキュメント名、または実装したい内容の概要'
---

# 実装スキル

## 目的

設計ドキュメントに基づいてコードを実装する。設計書がない場合は `/design` での作成を先に提案する。

## 前提知識

- 設計ドキュメント: `docs/design/` ディレクトリ
- 現状の設計: [current-state.md](../../../docs/design/current-state.md)

## 手順

### 0. ブランチ確認

- 大きめの変更・作り直しの可能性がある変更は、`feature/` ブランチの作成を提案する
- 小さな修正はこのリポジトリの普段の運用どおり `main` 直コミットでよい

### 1. 設計の確認

- 対象の設計ドキュメント(`docs/design/`)を読む
- 設計書がない場合は `/design` で先に作成することを提案する
- 設計に不明点があればユーザーに確認する

### 2. 影響範囲の確認

- 変更対象のファイルを特定する
- 既存コードを読み、実装方針を決める
- 既存のパターン・規約に従う

### 3. 実装

以下の順序で実装する。

1. **DB**: 変更 SQL の作成(`supabase/`。書き方・RLS 雛形は `/db-change` に従う)
2. **型定義**: `src/types/index.ts` をテーブル変更に合わせて更新
3. **ロジック**: 成績計算・データ取得(`src/lib/`。成績系は `/stats-edge-cases` を確認)
4. **API**: Route Handlers(`src/app/api/`。必要な場合のみ)
5. **フロント**: ページ・コンポーネント(`src/app/(pages)/`、`src/components/`。UI は `/ui-style` に従う)
6. **インフラ**: Vercel 環境変数・Supabase 設定(RLS ポリシーなど)

### 4. 実装後の確認

- 型エラー・Lint エラーがないか確認する(`/preflight` で lint + ビルドを通す)
- 設計書の受け入れ条件を満たしているか確認する(動作確認の手順は `/dev`)
- 実装内容が既存の要件定義・設計書の記述と矛盾する場合、該当ドキュメントも更新する(`docs/design/current-state.md` への反映を含む)
- 変更内容をユーザーに報告する
- 実装完了後、次のステップとして `/review` の実行を案内する

## プロジェクト固有の規約

### データアクセス(Supabase)

- クライアントは `src/lib/supabase/`(ブラウザ: client.ts / サーバー: server.ts)を使う
- 一覧取得は 1000 行制限を回避するため `fetchAllRows` を使う
- クエリの書き方・レビュー観点は `/supabase-review` に従う
- 書き込みは認証済みユーザーのみ(RLS 前提)。新テーブルには必ず RLS を設定する

### フロントエンド(Next.js + TypeScript)

- 全ページ共通のコンポーネントは `src/components/` に配置
- ページ固有のコンポーネントはページと同じディレクトリに配置(例: `src/app/(pages)/players/BattingTable.tsx`)
- ページは `src/app/(pages)/` 配下の App Router 構成
- 状態管理はライブラリを使わず React の state(useState 等)で行う
- デザインは Tailwind CSS 4 + `/ui-style` のパターンに従う

### インフラ(Vercel + Supabase)

- DB 変更 SQL は `supabase/` に配置し、Supabase Dashboard の SQL Editor で手動適用する
- 環境変数(`NEXT_PUBLIC_SUPABASE_URL` など)は `.env.local` と Vercel の設定で管理する

## 注意事項

- 設計書にない機能を追加しない
- 既存コードのスタイルに合わせる
- セキュリティ上の問題(OWASP Top 10)を作り込まない
- 大きな変更は段階的に実装し、途中経過を報告する
