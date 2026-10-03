-- ブログを「News」として誰でも閲覧できるようにし、投稿は管理者のみにする
--
-- 設計:
--   - テーブル名は blog_posts のまま（名称変更は画面上のみ。既存データと管理画面のコードをそのまま使うため）。
--   - 閲覧はパスワード不要にする。anon に select の RLS ポリシーと権限を与え、
--     他の公開テーブルと同じくアプリからテーブルを直接読む。
--   - 書き込み（投稿・編集・削除）は既存の authenticated 向けポリシーのみ＝管理者だけ。
--     一般ユーザー向けの投稿関数 blog_post_create は削除する。
--   - 閲覧パスワードの仕組み（blog_auth / blog_sessions と関連関数）は不要になるので削除する。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- ※ add_blog_posts.sql / add_blog_post_create.sql を実行済みの環境で実行すること。
-- ※ これを実行するまで、ログインしていない人には News の記事が表示されません（「まだ記事がありません」になります）。
--   また、実行するまでは旧来の投稿関数が残り、パスワードを知っている人が投稿できる状態のままです。

set search_path = public, extensions;

-- 誰でも閲覧可
grant select on table public.blog_posts to anon;

drop policy if exists "blog_posts_public_read" on public.blog_posts;
create policy "blog_posts_public_read" on public.blog_posts
  for select using (true);

-- 一般ユーザーの投稿をやめる
drop function if exists public.blog_post_create(text, text, text, date, text);

-- パスワード閲覧用の関数・テーブルを削除
drop function if exists public.blog_posts_list(text);
drop function if exists public.blog_post_get(text, uuid);
drop function if exists public.blog_access_ok(text);
drop function if exists public.blog_login(text);
drop function if exists public.blog_session_valid(text);
drop function if exists public.blog_logout(text);
drop function if exists public.set_blog_password(text);
drop table if exists public.blog_sessions;
drop table if exists public.blog_auth;
