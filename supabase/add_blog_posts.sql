-- ブログ記事
--
-- 設計:
--   - anon（未ログインの訪問者）に読み取りポリシーを与えない。
--     公開読み取りにすると Supabase の REST API から誰でも記事を取得でき、
--     ブログのパスワード（add_blog_password.sql）が意味を成さなくなるため。
--   - 閲覧は security definer 関数を通し、ブログのセッショントークンか
--     管理者ログインのどちらかを確認してから返す。
--   - 管理者（authenticated）は通常の RLS ポリシーで読み書きできる。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- ※ add_blog_password.sql を先に実行しておくこと（blog_sessions を参照します）。
-- ※ これを実行するまで、ブログの記事一覧と管理画面の投稿がエラーになります。

set search_path = public, extensions;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  -- 表示・並び替えに使う投稿日。管理画面から変更できる
  published_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc, created_at desc);

alter table public.blog_posts enable row level security;

-- 管理者は全操作可。anon はポリシーを作らない＝直接は読めない
drop policy if exists "blog_posts_authenticated_all" on public.blog_posts;
create policy "blog_posts_authenticated_all" on public.blog_posts
  for all to authenticated using (true) with check (true);

-- テーブル権限自体も anon から落としておく（RLS と二重の防御）。
-- 閲覧用の関数は security definer なのでテーブル所有者権限で動き、この revoke の影響を受けない
revoke all on table public.blog_posts from anon;

-- 閲覧可否。ブログにログイン済み、または管理者ログイン済みなら true
create or replace function public.blog_access_ok(p_token text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.uid() is not null
      or exists (
        select 1 from public.blog_sessions
        where token = p_token and expires_at > now()
      );
$$;

-- 記事一覧（新しい順）
create or replace function public.blog_posts_list(p_token text)
returns table (id uuid, title text, body text, published_at date)
language sql
security definer
set search_path = public
as $$
  select p.id, p.title, p.body, p.published_at
  from public.blog_posts p
  where public.blog_access_ok(p_token)
  order by p.published_at desc, p.created_at desc;
$$;

-- 記事1件
create or replace function public.blog_post_get(p_token text, p_id uuid)
returns table (id uuid, title text, body text, published_at date)
language sql
security definer
set search_path = public
as $$
  select p.id, p.title, p.body, p.published_at
  from public.blog_posts p
  where p.id = p_id and public.blog_access_ok(p_token);
$$;

revoke all on function public.blog_access_ok(text) from public;
revoke all on function public.blog_posts_list(text) from public;
revoke all on function public.blog_post_get(text, uuid) from public;

grant execute on function public.blog_access_ok(text) to anon, authenticated;
grant execute on function public.blog_posts_list(text) to anon, authenticated;
grant execute on function public.blog_post_get(text, uuid) to anon, authenticated;
