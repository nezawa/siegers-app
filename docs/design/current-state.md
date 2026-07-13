# Siegers ホームページ 現状設計(current-state)

草野球チーム「Siegers」のホームページ。試合結果・選手成績の公開と、管理者による入力・編集を行う。

- 更新日: 2026-07-12
- このドキュメントは常に「実装済みの現状」を表す。設計変更が実装に取り込まれたら必ずここに反映する。

## 技術スタック

- Next.js(App Router)+ TypeScript
- Tailwind CSS 4
- Supabase(PostgreSQL + Auth)
- デプロイ先: Vercel(想定)

## ディレクトリ構成

```
src/
  app/
    (pages)/          # 画面(公開ページ・管理者ページ)。共通レイアウトは (pages)/layout.tsx
    api/              # Route Handlers(API)
    layout.tsx        # ルートレイアウト
    error.tsx / loading.tsx / not-found.tsx
  components/         # 共通コンポーネント(Navbar, RecentGamesSection など)
  lib/
    supabase/         # Supabase クライアント(client.ts / server.ts)と fetchAllRows(fetchAll.ts)
    stats.ts          # 成績計算(打率・防御率・OPS・回数換算など)
    errorMessage.ts   # エラーメッセージ整形
  types/index.ts      # DB テーブルに対応する型定義(Player / Game / BattingStat / PitchingStat)
  proxy.ts            # 認証ガード + セッションリフレッシュ(全リクエストで実行)
supabase/             # DB 変更 SQL(Supabase Dashboard の SQL Editor で手動適用)
docs/
  requirements/       # 要件定義ドキュメント
  design/             # 設計ドキュメント(このファイル含む)
```

## ページ一覧

### 公開ページ

| パス | 内容 |
|------|------|
| `/` | チーム勝敗数 + 最近の試合 |
| `/games` | 試合一覧(日付・対戦相手・スコア・結果・球場) |
| `/games/[id]` | 試合詳細(イニングスコア・打撃成績・投手成績)。ログイン中は編集・削除ボタン表示 |
| `/players` | 選手通算成績(打撃・投手・チーム集計、フィルター付き) |
| `/players/[id]` | 選手個人ページ |
| `/about` | チーム紹介 |

### 管理者ページ(認証必須)

| パス | 内容 |
|------|------|
| `/admin/login` | メール + パスワード認証(Supabase Auth) |
| `/admin/games/new` | 試合結果入力(フォーム入力 GameForm / JSON 一括入力 JsonGameForm) |
| `/admin/games/[id]/edit` | 試合結果編集(GameEditForm。共通部は GameFormBase) |
| `/admin/players` | 選手一覧・投手フラグ切替・削除 |
| `/admin/players/new` | 選手登録 |
| `/admin/opponents` | 対戦相手マスタ管理(MasterSection) |
| `/admin/tournaments` | 大会名マスタ管理(MasterSection) |
| `/admin/settings` | 設定(規定打席・規定投球回の倍率) |

## API(Route Handlers)

| メソッド・パス | 内容 |
|------|------|
| `DELETE /api/games/[id]` | 試合削除 |

※ データ取得・更新は基本的に Server Component / Client Component から Supabase クライアントで直接行い、API は最小限。

## 認証・認可

- `src/proxy.ts` が静的アセットを除く全リクエストで実行される
  - Supabase セッション(JWT)のリフレッシュ(公開ページ閲覧中の「JWT expired」防止のため全ページ対象)
  - 未ログインで `/admin/*`(`/admin/login` 以外)にアクセスすると `/admin/login` へリダイレクト
- DB 側は Supabase RLS で保護: **閲覧は全員可、書き込みは認証済みユーザーのみ**(全テーブル共通方針)

## DB テーブル

型定義の実体は `src/types/index.ts`、変更 SQL は `supabase/` を参照。

| テーブル | 内容 | 主なカラム |
|------|------|------|
| `players` | 選手マスタ | name, number, position, is_pitcher, notes |
| `games` | 試合 | date, start_time, opponent, venue, tournament, score_us, score_them, result('W'/'L'/'D'), innings_us/them(int[]), is_home, game_type('official'/'practice'/'other'), notes |
| `batting_stats` | 打撃成績(試合×選手) | game_id, player_id, batting_order, position, ab, hits, doubles, triples, hr, rbi, runs, bb, k, sb |
| `pitching_stats` | 投手成績(試合×選手) | game_id, player_id, is_win/is_hold/is_save/is_loss, ip, pitch_count, runs, er, is_cg, is_sho, hits_allowed, hr_allowed, k, bb, hbp, balk, wp |
| `opponents` | 対戦相手マスタ(入力候補・一括リネームの起点。games 側は文字列を保持) | name(unique) |
| `tournaments` | 大会名マスタ(同上) | name(unique) |
| `settings` | 規定値設定 | qualified_pa(numeric), qualified_ip(numeric) |

## 横断的な設計方針

- 開発は Claude Code スキルによるワークフロー(相談 → 要件定義 → 設計 → 実装 → レビュー → PR)で進める。スキル構成の詳細は [skills.md](skills.md) を参照

- DB 変更はマイグレーションツールを使わず、`supabase/*.sql` を書いて Supabase Dashboard の SQL Editor で手動適用する(手順は `/db-change` スキル)
- 成績の計算ロジックは `src/lib/stats.ts` に集約(境界値は `/stats-edge-cases` スキル参照)
- 一覧取得は Supabase の 1000 行制限を回避するため `fetchAllRows`(`src/lib/supabase/fetchAll.ts`)を使う
- UI のデザイン言語・実装パターンは `/ui-style` スキル参照
