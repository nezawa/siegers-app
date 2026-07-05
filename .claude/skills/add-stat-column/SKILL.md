---
name: add-stat-column
description: 打撃成績・投手成績に新しい統計列(スタッツ)を追加/削除/変更するときの手順。触るべきファイルが8箇所あり漏れやすいので、成績項目の変更時は必ずこのスキルを使う。
---

# 成績列の追加・変更手順

打撃(BattingStat)・投手(PitchingStat)の統計項目は複数ファイルに分散している。
1箇所でも漏れると入力できない・表示されない・集計が合わないバグになる。

## 変更が必要なファイル一覧

| ファイル | 役割 |
|---|---|
| `src/types/index.ts` | 型定義(BattingStat / PitchingStat) |
| `src/app/(pages)/admin/games/GameFormBase.tsx` | 入力フォーム本体(新規・編集で共通)。BattingRow/PitchingRow 型・empty関数・ヘッダー配列・数値フィールド一覧・保存 payload をここで定義 |
| `src/app/(pages)/admin/games/new/JsonGameForm.tsx` | JSON貼り付け入力。zod の battingRowSchema / pitchingRowSchema と EXAMPLE 文字列の両方に追加 |
| `src/lib/stats.ts` | 通算集計(computeBatting / computePitching)。ここを直せば成績一覧・個人ページの両方に反映される |
| `src/app/(pages)/games/[id]/page.tsx` | 試合詳細ページの成績テーブル表示 |
| `src/app/(pages)/players/BattingTable.tsx` または `PitchingTable.tsx` | 通算成績テーブルの表示 |
| `src/app/(pages)/players/[id]/page.tsx` | 選手個人ページの成績表示(表示列の追加) |
| `supabase/replace_game_stats.sql` | 編集保存用RPC。挿入カラムの列挙に新列を追加して Dashboard で再実行 |

※ `GameForm.tsx` / `GameEditForm.tsx` は GameFormBase の薄いラッパーなので通常触らない。

## 手順

1. **既存の類似列をgrepして全触点を洗い出す**
   打撃なら `doubles`、投手なら `balk` など既存列名で `grep -rn` し、
   同じパターンで新列を追加する。上の表と突き合わせて漏れがないか確認する。
2. **Supabase側のカラム追加を忘れない**
   DBスキーマはコードからは変更できない。`supabase/` にSQLファイルを作り
   (書き方は `/db-change` スキル参照)、ユーザーに Dashboard での実行を案内すること。
   デフォルト値(通常 `0` / `false`)を必ず指定する。
   **編集の保存は `replace_game_stats` RPC 経由なので、RPC側のカラム列挙の更新も必須。**
3. **集計ロジックの確認**
   `src/lib/stats.ts` の computeBatting / computePitching に新列を組み込む。
   率系(打率・防御率など)の派生指標に影響するか確認する。
4. **テーブル表示の注意点**
   - 成績テーブルの選手名列は `sticky left-0` で固定されている。列追加時は横スクロールで崩れないか確認。
   - 選手通算成績は2行ヘッダー構成。colSpan の整合性に注意。
5. **確認**
   `npm run build` が通ること。可能なら dev サーバーで入力→保存→表示まで通しで確認する。
