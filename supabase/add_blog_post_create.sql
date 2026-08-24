-- ブログ記事を「ブログにログインした一般ユーザー」も投稿できるようにする
--
-- 設計:
--   - 投稿は security definer 関数 blog_post_create を通す。
--     テーブルへの insert 権限は anon に与えず、関数の中で
--     blog_access_ok（ブログのセッション or 管理者ログイン）を確認してから書き込む。
--   - 投稿者が複数になるため、任意入力の author 列を追加する（未入力なら null）。
--   - 編集・削除は引き続き管理者のみ（誰の投稿かを確実に紐付ける仕組みが無いため）。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- ※ add_blog_posts.sql を先に実行しておくこと。
-- ※ これを実行するまで、ブログからの投稿と投稿者名の表示ができません。

set search_path = public, extensions;

alter table public.blog_posts
  add column if not exists author text;

-- 返す列が増えるので、既存の閲覧用関数は作り直す（返却型は create or replace では変更できない）
drop function if exists public.blog_posts_list(text);
drop function if exists public.blog_post_get(text, uuid);

create function public.blog_posts_list(p_token text)
returns table (id uuid, title text, body text, published_at date, author text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.title, p.body, p.published_at, p.author
  from public.blog_posts p
  where public.blog_access_ok(p_token)
  order by p.published_at desc, p.created_at desc;
$$;

create function public.blog_post_get(p_token text, p_id uuid)
returns table (id uuid, title text, body text, published_at date, author text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.title, p.body, p.published_at, p.author
  from public.blog_posts p
  where p.id = p_id and public.blog_access_ok(p_token);
$$;

-- 投稿（ブログにログイン済み、または管理者）
create or replace function public.blog_post_create(
  p_token text,
  p_title text,
  p_body text,
  p_published_at date default null,
  p_author text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.blog_access_ok(p_token) then
    raise exception 'ブログにログインしてください';
  end if;
  if length(coalesce(btrim(p_title), '')) = 0 then
    raise exception 'タイトルを入力してください';
  end if;
  if length(coalesce(btrim(p_body), '')) = 0 then
    raise exception '本文を入力してください';
  end if;

  insert into public.blog_posts (title, body, published_at, author)
  values (
    btrim(p_title),
    p_body,
    coalesce(p_published_at, current_date),
    nullif(btrim(coalesce(p_author, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.blog_posts_list(text) from public;
revoke all on function public.blog_post_get(text, uuid) from public;
revoke all on function public.blog_post_create(text, text, text, date, text) from public;

grant execute on function public.blog_posts_list(text) to anon, authenticated;
grant execute on function public.blog_post_get(text, uuid) to anon, authenticated;
grant execute on function public.blog_post_create(text, text, text, date, text) to anon, authenticated;
