---
name: db-change
description: Supabase の DB 変更(列追加・テーブル追加・制約・RLS)を行うときの流儀。マイグレーションSQLの書き方・RLS雛形・README更新を含む。DBスキーマを触る変更では必ず使う。
---

# DB変更(Supabase)の流儀

このプロジェクトに自動マイグレーションは無い。DB変更は必ず
**`supabase/` にSQLファイルを作成し、ユーザーが Supabase Dashboard → SQL Editor で実行する**。
コード側から実行することはできないので、作成したら実行を明確に案内すること。

## SQLファイルの書き方

- ファイル名は目的が分かる英語スネークケース(例: `add_game_time_tournament.sql`)
- 冒頭コメントに必ず書く: **目的 / 設計判断の理由 / 適用方法 / 未実行時に何が起きるか**

```sql
-- games テーブルに「開始時間」を追加
--
-- (設計判断の理由があればここに)
--
-- 適用方法: Supabase Dashboard → SQL Editor でこのファイルの内容を実行する。
-- ※ これを実行するまで、試合入力・編集の保存は「column not found」エラーで失敗します。
```

- **冪等に書く**: `add column if not exists` / `create table if not exists` / `drop policy if exists` → `create policy`
- 既存テーブルへの列追加は **nullable にするか default を付ける**(過去データがあるため)
- 小数が入りうる数値列は `numeric`(`integer` にすると 1.5 の保存で「invalid input syntax for type integer」になった実績あり)
- `time` 型は取得時 `"18:00:00"` 形式で返る。表示側は `.slice(0, 5)` で HH:MM に切る

## RLS の雛形(新テーブルには必ず付ける)

```sql
alter table public.<table> enable row level security;

drop policy if exists "<table>_public_read" on public.<table>;
create policy "<table>_public_read" on public.<table>
  for select using (true);

drop policy if exists "<table>_authenticated_write" on public.<table>;
create policy "<table>_authenticated_write" on public.<table>
  for all to authenticated using (true) with check (true);
```

## check制約の入れ直し(許可値の変更)

制約名が環境で違う可能性があるため、名前によらず削除してから付け直す:

```sql
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.<table>'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%<column>%'
  loop
    execute format('alter table public.<table> drop constraint %I', c.conname);
  end loop;
end $$;
```

## 仕上げ(忘れがち)

1. README の「Supabase 側のセットアップ」のSQL一覧に1行追加する(未実行時の症状も書く)
2. `src/types/index.ts` の型定義を更新する
3. 試合の成績に関わる変更なら `supabase/replace_game_stats.sql`(編集保存用RPC)のカラム列挙も更新が必要
