-- games テーブルに「開始時間」と「大会名」を追加
--
-- 日付(date)と開始時間(start_time)は別カラムにする。
-- 既存の集計・フィルターが date 文字列に依存しているため、timestamp への統合はしない。
-- どちらも任意項目（過去の試合には無いデータ）なので nullable。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- ※ これを実行するまで、試合入力・編集の保存は「column not found」エラーで失敗します。

alter table public.games
  add column if not exists start_time time,
  add column if not exists tournament text;
