-- tournaments テーブルに「試合属性」(game_type) を追加
--
-- 大会ごとに 公式戦 / 練習試合 / その他 を決めておき、大会管理ページで変更したときに
-- 「その大会名の試合」へまとめて反映するために使う。
-- 反映処理はアプリ側（大会管理ページの保存時）で games を更新して行う。
-- DBトリガーにしないのは、games.tournament が外部キーではなく文字列で、
-- 名前変更と属性変更が同じ保存操作の中で前後するため、アプリ側で順序を制御した方が安全なため。
--
-- 過去に登録済みの大会には値が無いので nullable。null = 「未設定」で、
-- 保存しても試合側の属性は書き換えない（既存の試合の属性を勝手に消さないため）。
-- 許可値は games.game_type と揃える。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- ※ これを実行するまで、大会管理ページの表示・保存が「column not found」エラーで失敗します。

alter table public.tournaments
  add column if not exists game_type text;

-- 許可値の制約は付け直す（制約名が環境で違う可能性があるため、名前によらず削除してから作る）
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.tournaments'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%game_type%'
  loop
    execute format('alter table public.tournaments drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.tournaments
  add constraint tournaments_game_type_check
  check (game_type is null or game_type in ('official', 'practice', 'other'));

-- 既存の試合データから初期値を取り込む。
-- その大会名の試合が全て同じ属性のときだけ設定する（バラバラなら未設定のままにして、手で決めてもらう）
update public.tournaments t
set game_type = g.game_type
from (
  select tournament, min(game_type) as game_type
  from public.games
  where tournament is not null and tournament <> '' and game_type is not null
  group by tournament
  having count(distinct game_type) = 1
) g
where t.name = g.tournament
  and t.game_type is null;
