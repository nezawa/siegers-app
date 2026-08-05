-- games.result に「その他」("O") を追加
--
-- 中止・没収試合・無効試合など、勝ち・負け・引き分けのいずれにも当てはまらない
-- 試合を記録できるようにする。既存値 W(勝ち) / L(負け) / D(引き分け) に合わせ、
-- 1文字の "O"(Other) とする。
--
-- 「その他」の試合の扱い（集計側の実装は src/app/(pages)/players/page.tsx）:
--   - チーム成績の「試合」数には数える
--   - 勝ち・負け・引分・勝率には数えない（別途「他」列に表示）
--   - 打撃・投手成績は通常どおり集計対象に含める
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- ※ 未実行のまま結果に「その他」を選んで保存すると、check 制約違反で保存に失敗します。

-- 制約名は環境によって異なる可能性があるため、名前によらず result の check 制約を
-- 全て外してから付け直す（制約が存在しない環境でもそのまま実行できる）
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.games'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%result%'
  loop
    execute format('alter table public.games drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.games
  add constraint games_result_check
  check (result is null or result in ('W', 'L', 'D', 'O'));
