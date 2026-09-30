-- settings に「成績ページの絞り込み既定値」を追加
--
-- 目的:
--   成績ページ(/players)を開いた直後に表示する年度と試合種別を、
--   管理画面の設定から変更できるようにする。
--   これまではコード側の定数で固定していたため、シーズンが変わるたびに
--   ソースを書き換えてデプロイし直す必要があった。
--
-- 設計判断:
--   - null を「絞り込まない」の意味に使う。
--     default_stats_year が null なら通算、default_stats_game_type が null なら全試合。
--     URL 側では 'all' で表現するが、DB には sentinel 文字列を持たせない。
--   - 年度は text。games.date が 'YYYY-MM-DD' の文字列で、
--     アプリ側も date.slice(0, 4) / startsWith による前方一致で扱っているため、
--     integer にすると保存・比較の両方で変換が挟まって噛み合わせが悪い。
--     4桁数字以外が入らないよう check 制約で縛る。
--   - 既存行(id=1)にも値が入るよう default を付けてから列を追加する。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- ※ 未実行の場合、成績ページは従来どおり「通算・全試合」で表示され、
--   管理画面の設定ページで既定値を保存しようとすると
--   「Could not find the 'default_stats_year' column」エラーで失敗します。

set search_path = public, extensions;

alter table public.settings
  add column if not exists default_stats_year text default '2026',
  add column if not exists default_stats_game_type text default 'official';

-- 許可値の縛り。名前によらず貼り直して冪等にする
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.settings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%default_stats_%'
  loop
    execute format('alter table public.settings drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.settings
  add constraint settings_default_stats_year_check
    check (default_stats_year is null or default_stats_year ~ '^[0-9]{4}$');

alter table public.settings
  add constraint settings_default_stats_game_type_check
    check (default_stats_game_type is null
           or default_stats_game_type in ('official', 'practice', 'other'));

-- 既存行への初期値投入は上の add column の default が行うため、ここでは何もしない。
-- （このファイルを再実行しても、管理画面で「通算」「全試合」= null に
--   変更した設定を '2026' / 'official' に戻してしまわないようにするため）
