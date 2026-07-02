-- settings テーブルの RLS ポリシー修正
--
-- 現状: anon（未ログインの訪問者）から settings が SELECT できないため、
-- 公開の成績ページでは規定打席・規定投球回の設定値が常にデフォルト
-- （qualified_pa=3.1 / qualified_ip=1.0）にフォールバックしている。
-- 管理者がログインして見た場合とで規定値の表示が食い違う。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。

alter table if exists public.settings enable row level security;

-- 誰でも読める（成績ページの規定値計算に必要）
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings
  for select using (true);

-- 書き込みは認証済みユーザーのみ
drop policy if exists "settings_authenticated_write" on public.settings;
create policy "settings_authenticated_write" on public.settings
  for all to authenticated using (true) with check (true);

-- 【参考】全テーブルのポリシー棚卸し用クエリ（実行して現状を確認できる）
-- select tablename, rowsecurity from pg_tables where schemaname = 'public';
-- select tablename, policyname, roles, cmd, qual, with_check
--   from pg_policies where schemaname = 'public' order by tablename;
