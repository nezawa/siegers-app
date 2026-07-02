-- 試合成績の一括入れ替え関数
-- GameEditForm の保存で使用する。delete → insert を1トランザクションで行い、
-- 途中で失敗した場合は全てロールバックされる（成績が消えたままにならない）。
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- security invoker なので RLS はそのまま適用される（未認証ユーザーは実行しても書き込めない）。

create or replace function public.replace_game_stats(
  p_game_id uuid,
  p_batting jsonb default '[]'::jsonb,
  p_pitching jsonb default '[]'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from batting_stats where game_id = p_game_id;
  delete from pitching_stats where game_id = p_game_id;

  insert into batting_stats (
    game_id, player_id, batting_order,
    pa, ab, hits, doubles, triples, hr, rbi, runs, sb,
    risp_ab, risp_hits, k, bb, hbp, sac_bunt, sac_fly,
    gidp, reach_on_error, errors, cs
  )
  select
    p_game_id,
    (r->>'player_id')::uuid,
    (r->>'batting_order')::int,
    coalesce((r->>'pa')::int, 0),
    coalesce((r->>'ab')::int, 0),
    coalesce((r->>'hits')::int, 0),
    coalesce((r->>'doubles')::int, 0),
    coalesce((r->>'triples')::int, 0),
    coalesce((r->>'hr')::int, 0),
    coalesce((r->>'rbi')::int, 0),
    coalesce((r->>'runs')::int, 0),
    coalesce((r->>'sb')::int, 0),
    coalesce((r->>'risp_ab')::int, 0),
    coalesce((r->>'risp_hits')::int, 0),
    coalesce((r->>'k')::int, 0),
    coalesce((r->>'bb')::int, 0),
    coalesce((r->>'hbp')::int, 0),
    coalesce((r->>'sac_bunt')::int, 0),
    coalesce((r->>'sac_fly')::int, 0),
    coalesce((r->>'gidp')::int, 0),
    coalesce((r->>'reach_on_error')::int, 0),
    coalesce((r->>'errors')::int, 0),
    coalesce((r->>'cs')::int, 0)
  from jsonb_array_elements(coalesce(p_batting, '[]'::jsonb)) as r;

  insert into pitching_stats (
    game_id, player_id,
    is_win, is_hold, is_save, is_loss, is_cg, is_sho,
    ip, pitch_count, runs, er,
    hits_allowed, hr_allowed, k, bb, hbp, balk, wp
  )
  select
    p_game_id,
    (r->>'player_id')::uuid,
    coalesce((r->>'is_win')::boolean, false),
    coalesce((r->>'is_hold')::boolean, false),
    coalesce((r->>'is_save')::boolean, false),
    coalesce((r->>'is_loss')::boolean, false),
    coalesce((r->>'is_cg')::boolean, false),
    coalesce((r->>'is_sho')::boolean, false),
    coalesce((r->>'ip')::numeric, 0),
    coalesce((r->>'pitch_count')::int, 0),
    coalesce((r->>'runs')::int, 0),
    coalesce((r->>'er')::int, 0),
    coalesce((r->>'hits_allowed')::int, 0),
    coalesce((r->>'hr_allowed')::int, 0),
    coalesce((r->>'k')::int, 0),
    coalesce((r->>'bb')::int, 0),
    coalesce((r->>'hbp')::int, 0),
    coalesce((r->>'balk')::int, 0),
    coalesce((r->>'wp')::int, 0)
  from jsonb_array_elements(coalesce(p_pitching, '[]'::jsonb)) as r;
end;
$$;

-- 未認証ユーザーには実行権限自体を与えない（RLSに加えた多層防御）
-- ※ PUBLIC からも revoke しないと意味がない（関数作成時に PUBLIC へ自動付与されるため）
revoke execute on function public.replace_game_stats(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.replace_game_stats(uuid, jsonb, jsonb) to authenticated, service_role;
