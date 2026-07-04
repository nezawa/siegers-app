-- 対戦相手・大会名のマスタテーブル
--
-- 試合入力の候補表示と、管理ページ（/admin/masters）での追加・編集用。
-- games テーブル側は従来どおり文字列を保持する（マスタは候補と一括リネームの起点）。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。

create table if not exists public.opponents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- RLS: 閲覧は全員可、書き込みは認証済みユーザーのみ
alter table public.opponents enable row level security;
alter table public.tournaments enable row level security;

drop policy if exists "opponents_public_read" on public.opponents;
create policy "opponents_public_read" on public.opponents
  for select using (true);

drop policy if exists "opponents_authenticated_write" on public.opponents;
create policy "opponents_authenticated_write" on public.opponents
  for all to authenticated using (true) with check (true);

drop policy if exists "tournaments_public_read" on public.tournaments;
create policy "tournaments_public_read" on public.tournaments
  for select using (true);

drop policy if exists "tournaments_authenticated_write" on public.tournaments;
create policy "tournaments_authenticated_write" on public.tournaments
  for all to authenticated using (true) with check (true);

-- 既存の試合データから初期データを取り込む
insert into public.opponents (name)
  select distinct opponent from public.games
  where opponent is not null and opponent <> ''
on conflict (name) do nothing;

insert into public.tournaments (name)
  select distinct tournament from public.games
  where tournament is not null and tournament <> ''
on conflict (name) do nothing;
