---
name: add-game-field
description: 試合(games テーブル)に入力項目を追加/変更/削除するときの手順(開始時間・大会名を追加した実績ベース)。試合情報の項目を変えるときは必ず使う。成績スタッツの列は /add-stat-column を使うこと。
---

# 試合項目の追加・変更手順

試合の属性(日付・対戦相手・大会名・種別など)は入力2系統+表示3箇所+DBに分散している。
以下を上から順に全部やる。1箇所でも漏れると「保存できない」「表示されない」になる。

## チェックリスト

| # | ファイル | やること |
|---|---|---|
| 1 | `supabase/` に新規SQL | 列追加(nullable必須。書き方は `/db-change` スキル)。ユーザーに実行を案内 |
| 2 | `src/types/index.ts` | `Game` 型に追加 |
| 3 | `src/app/(pages)/admin/games/GameFormBase.tsx` | フォーム本体(新規・編集共通)。`GameFields` 型・`gameInfo` state 初期値(`initialGame?.xxx ?? ''`)・保存 payload・入力UI の4箇所 |
| 4 | `src/app/(pages)/admin/games/new/JsonGameForm.tsx` | zod の `jsonGameSchema`・`EXAMPLE` 文字列(コメントで選択肢を書く)・フォーム上部の説明文の3箇所 |
| 5 | `src/app/(pages)/games/[id]/page.tsx` | 試合詳細ヘッダーの表示 |
| 6 | `src/components/RecentGamesSection.tsx` | 試合一覧(スマホカード版とPC表版の2箇所ある) |
| 7 | `src/app/page.tsx` | トップの直近試合・スケジュール表示(取得は `select('*')` なので追加不要、表示だけ) |
| 8 | `README.md` | SQL一覧とページ説明の更新 |

## 選択肢のある項目(game_type のような enum)の場合

- 上記に加えて成績ページの絞り込み対象にするか検討:
  `src/app/(pages)/players/page.tsx`(searchParams・フィルター判定・buildUrl)と `FilterPanel.tsx`
- DBに check 制約がある場合は許可値の入れ直しSQLが必要(`/db-change` の do-block 雛形)
- バッジ表示の色は `RecentGamesSection.tsx` の `GAME_TYPE_BADGE` に追加

## 注意

- `GameForm.tsx` / `GameEditForm.tsx` は薄いラッパー。フォームの中身は GameFormBase だけ直せば新規・編集の両方に反映される
- 対戦相手・大会名のようにマスタ管理(候補表示)したい項目は `opponents` / `tournaments` テーブルと `MasterSection.tsx` のパターンを踏襲(保存時に `registerMasters` で自動登録)
- `time` 型の列は `"HH:MM:SS"` で返るので表示・フォーム初期値は `.slice(0, 5)`
- 終わったら `npx tsc --noEmit && npm run lint && npm run build` で確認
