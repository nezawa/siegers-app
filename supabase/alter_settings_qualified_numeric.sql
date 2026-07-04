-- settings の規定値カラムを小数対応の型に変更
--
-- qualified_pa（規定打席の倍率）が integer のため、1.5 のような小数を保存すると
-- 「invalid input syntax for type integer」エラーになる。
-- qualified_ip と合わせて両方 numeric に統一する（既に numeric でも実行して問題ない）。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。

alter table public.settings
  alter column qualified_pa type numeric using qualified_pa::numeric,
  alter column qualified_ip type numeric using qualified_ip::numeric;
