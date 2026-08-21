-- ブログページの閲覧パスワード（管理者パスワードとは別）
--
-- 設計:
--   - パスワードは bcrypt ハッシュで保存し、平文は一切保持しない。
--   - blog_auth / blog_sessions は RLS を有効にしたうえで「ポリシーを1つも作らない」＝
--     anon・authenticated からは直接 SELECT できない。ハッシュが公開APIから読めてしまうと
--     総当たりの材料になるため、settings テーブル（公開読み取り可）には置かない。
--   - 操作は security definer 関数だけを通す。関数はテーブル所有者権限で動くので RLS を迂回できる。
--   - ログイン成功時はランダムなセッショントークンを発行して blog_sessions に保存し、
--     アプリ側は httpOnly Cookie に入れて持ち回る（環境変数の秘密鍵が不要な方式）。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- ※ これを実行するまで、ブログページのログインと設定画面でのパスワード変更が失敗します。
--
-- ※ 初期パスワードは 'siegers' です。実行後に管理画面の「設定」から必ず変更してください。

set search_path = public, extensions;

create extension if not exists pgcrypto;

-- パスワード（1行だけ持つ）
create table if not exists public.blog_auth (
  id smallint primary key default 1,
  password_hash text not null,
  updated_at timestamptz not null default now(),
  constraint blog_auth_single_row check (id = 1)
);

-- ログイン済みセッション
create table if not exists public.blog_sessions (
  token text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- RLS 有効＋ポリシーなし = 誰も直接読み書きできない（security definer 関数だけが触れる）
alter table public.blog_auth enable row level security;
alter table public.blog_sessions enable row level security;

-- 念のためテーブル権限自体も落としておく（RLS と二重の防御）
revoke all on table public.blog_auth from anon, authenticated;
revoke all on table public.blog_sessions from anon, authenticated;

-- パスワード照合。成功時はセッショントークン、失敗時は null を返す
create or replace function public.blog_login(p_password text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_token text;
begin
  select password_hash into v_hash from public.blog_auth where id = 1;
  if v_hash is null then
    return null;
  end if;
  if crypt(coalesce(p_password, ''), v_hash) <> v_hash then
    return null;
  end if;

  delete from public.blog_sessions where expires_at < now();

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.blog_sessions (token, expires_at)
    values (v_token, now() + interval '30 days');
  return v_token;
end;
$$;

-- セッションが有効かどうか
create or replace function public.blog_session_valid(p_token text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blog_sessions
    where token = p_token and expires_at > now()
  );
$$;

-- ログアウト（このセッションだけ破棄）
create or replace function public.blog_logout(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.blog_sessions where token = p_token;
$$;

-- パスワード変更（管理者＝ログイン済みユーザーのみ）。変更したら既存セッションは全て無効にする
create or replace function public.set_blog_password(p_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception '管理者のみ変更できます';
  end if;
  if length(coalesce(p_password, '')) < 4 then
    raise exception 'パスワードは4文字以上にしてください';
  end if;

  insert into public.blog_auth (id, password_hash, updated_at)
    values (1, crypt(p_password, gen_salt('bf')), now())
  on conflict (id) do update
    set password_hash = excluded.password_hash, updated_at = now();

  -- 全件削除だが、Supabase の安全装置（pg_safeupdate）が WHERE 無しの DELETE を弾くため条件を付ける
  delete from public.blog_sessions where token is not null;
end;
$$;

-- 実行権限。関数は既定で PUBLIC に実行権があるので、revoke してから必要な role にだけ渡す
revoke all on function public.blog_login(text) from public;
revoke all on function public.blog_session_valid(text) from public;
revoke all on function public.blog_logout(text) from public;
revoke all on function public.set_blog_password(text) from public;

grant execute on function public.blog_login(text) to anon, authenticated;
grant execute on function public.blog_session_valid(text) to anon, authenticated;
grant execute on function public.blog_logout(text) to anon, authenticated;
grant execute on function public.set_blog_password(text) to authenticated;

-- 初期パスワード 'siegers'（設定画面から必ず変更すること）
insert into public.blog_auth (id, password_hash)
  values (1, crypt('siegers', gen_salt('bf')))
on conflict (id) do nothing;
