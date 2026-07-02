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
| `src/app/admin/games/new/GameForm.tsx` | 試合結果の手入力フォーム |
| `src/app/admin/games/new/JsonGameForm.tsx` | JSON貼り付けによる入力フォーム |
| `src/app/admin/games/[id]/edit/GameEditForm.tsx` | 試合結果の編集フォーム |
| `src/app/games/[id]/page.tsx` | 試合詳細ページの成績テーブル表示 |
| `src/app/players/page.tsx` | 選手通算成績の集計ロジック |
| `src/app/players/BattingTable.tsx` または `PitchingTable.tsx` | 通算成績テーブルの表示 |
| `src/app/players/[id]/page.tsx` | 選手個人ページの成績表示 |

## 手順

1. **既存の類似列をgrepして全触点を洗い出す**
   打撃なら `doubles`、投手なら `balk` など既存列名で `grep -rn` し、
   同じパターンで新列を追加する。上の表と突き合わせて漏れがないか確認する。
2. **Supabase側のカラム追加を忘れない**
   DBスキーマはコードからは変更できない。Supabaseダッシュボードで実行する
   `ALTER TABLE batting_stats ADD COLUMN ... ;` 等のSQLをユーザーに提示すること。
   デフォルト値(通常 `0` / `false`)を必ず指定する。
3. **集計ロジックの確認**
   `src/app/players/page.tsx` の通算集計に新列を組み込む。
   率系(打率・防御率など)の派生指標に影響するか確認する。
4. **テーブル表示の注意点**
   - 成績テーブルの選手名列は `sticky left-0` で固定されている。列追加時は横スクロールで崩れないか確認。
   - 選手通算成績は2行ヘッダー構成。colSpan の整合性に注意。
5. **確認**
   `npm run build` が通ること。可能なら dev サーバーで入力→保存→表示まで通しで確認する。
