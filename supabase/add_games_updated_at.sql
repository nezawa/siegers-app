-- games テーブルに更新日時（updated_at）を追加
--
-- フッターに「成績データ更新：YYYY/MM/DD HH:MM」を表示するために使う。
-- 試合の新規登録・編集のどちらでも最新化する必要があるため、アプリ側で値を送るのではなく
-- BEFORE UPDATE トリガーで自動更新する（送り忘れ・JSON入力経路の漏れを防ぐ）。
--
-- 成績（batting_stats / pitching_stats）だけを直した場合も、編集画面は必ず games を
-- update してから replace_game_stats を呼ぶので、この列で拾える。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- ※ 未実行の場合、フッターの更新日時が表示されないだけで、他の機能には影響しません。

-- 列の追加と既存行の初期化。
-- 「列が無いときだけ」実行することで、再実行しても既存の updated_at を作成日時へ戻さない
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'games' and column_name = 'updated_at'
  ) then
    alter table public.games add column updated_at timestamptz not null default now();
    -- 過去の試合は「作成時に入力されたもの」として作成日時を初期値にする
    update public.games set updated_at = created_at;
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();
