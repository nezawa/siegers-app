草野球チーム「Siegers」のホームページ。試合結果・選手成績の公開と、管理者による入力・編集を行う Next.js (App Router) アプリです。

Git Hubに草を生やすためにはgit config user.emailとGithubアカウントに同じメールアドレスを追加しなくてはいけない

## 技術スタック

- Next.js (App Router) + TypeScript
- Tailwind CSS 4
- Supabase (PostgreSQL + Auth)

## Getting Started

環境変数を `.env.local` に設定します（Supabase プロジェクトの値を使用）。

```bash
NEXT_PUBLIC_SUPABASE_URL=xxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
```

開発サーバーを起動します。

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開くと確認できます。

### Supabase 側のセットアップ

[supabase/](supabase/) ディレクトリの SQL を Supabase Dashboard → SQL Editor で実行してください。

- `replace_game_stats.sql` — 試合成績を一括更新する関数。**未実行だと試合編集の保存が失敗します**
- `rls_settings_policies.sql` — settings テーブルの RLS ポリシー（公開ページに規定値を反映するために必要）
- `add_game_time_tournament.sql` — games テーブルに開始時間・大会名の列を追加。**未実行だと試合入力・編集の保存が失敗します**
- `add_opponents_tournaments.sql` — 対戦相手・大会名のマスタテーブル（試合入力の候補表示と管理ページに必要）
- `add_tournament_game_type.sql` — tournaments に試合属性（公式戦/練習試合/その他）の列を追加。**未実行だと大会管理ページの表示・保存が失敗します**
- `alter_settings_qualified_numeric.sql` — 規定打席・規定投球回の倍率を小数対応に（未実行だと規定打席に 1.5 などの小数が保存できません）
- `add_game_result_other.sql` — 試合結果に「その他」(`O`) を追加。**未実行だと結果に「その他」を選んだ試合の保存が check 制約違反で失敗します**
- `add_games_updated_at.sql` — games に更新日時の列とトリガーを追加（フッターの「成績データ更新」表示に使用）。未実行の場合はフッターの日時が出ないだけで他は動きます
- `fix_stat_inconsistencies.sql` — 打撃成績の入力ミス修正（1回限りのデータ修正）。末尾に、記録の流儀に反する行を洗い出す点検クエリを同梱

### 成績記録の流儀

打率・塁打数・長打率・OPS・得点圏打率は以下を前提に計算しています（入力時のチェックは `src/lib/validateStats.ts`）。

- **安打** は二塁打・三塁打・本塁打を含む総安打数（単打 = 安打 − 二塁打 − 三塁打 − 本塁打）
- **得点圏打数 / 得点圏安打** は「打数」ベース（四球・死球・犠打・犠飛は含まない）
- **敵失**での出塁も打数に含む

試合結果（`games.result`）は `W`(勝ち) / `L`(負け) / `D`(引分) / `O`(その他) / `null`(未設定)。
スコアから自動判定されますが、入力・編集画面で手動で選び直せます（中止・没収試合などは「その他」）。
「その他」はチーム成績の**試合数には数え、勝敗・勝率には数えません**（該当試合があるときだけ「他」列が出ます）。
`null`（結果未設定）の試合は今後のスケジュール扱いで、チーム成績の集計から除外されます。

## 画像アセット

[public/](public/) に以下のファイル名で画像を置くと、各所に反映されます（無い場合はプレースホルダー表示）。

- `logo.png` — ヘッダーのロゴ（背景透過 PNG 推奨）
- `hero.jpg` — トップページのメイン写真
- `team.jpg` — トップページ「選手成績」カードの写真

※ 拡張子は必ず**小文字**にすること（`hero.JPG` だと Vercel 上で 404 になる）。

トップページのチーム紹介文・スローガンは [src/app/page.tsx](src/app/page.tsx) 冒頭の `TEAM` 定数で編集できます。

## 主なスクリプト

- `npm run dev` — 開発サーバー起動
- `npm run build` — 本番ビルド
- `npm run start` — 本番サーバー起動
- `npm run lint` — ESLint 実行

## ページ構成

公開ページ:
- `/` — トップ（メイン写真・チーム紹介・今年/通算成績・試合結果/今後のスケジュール）
- `/about` — 小雀シーガーズとは（準備中）
- `/games` — 試合一覧（年度フィルター付き）。チーム勝敗数は `/players` のチーム成績タブに集約
- `/games/[id]` — 試合詳細（打撃・投手成績）。ログイン中は編集ボタンを表示
- `/players` — 成績ページ（ヘッダー上は「成績」表記）。チーム成績（年度別＋通算）・打撃成績・投手成績のタブ切り替え。
  年度・期間・規定・試合種別（公式戦/練習試合）・大会名・対戦相手のフィルターは URL パラメータ（`?tab=` `?year=` `?gtype=` `?q=1` `?tournament=` `?opponent=` など）で共有可能
- `/players/[id]` — 選手個人の成績詳細

管理者ページ（`src/proxy.ts` で認証保護）:
- `/admin/login` — メール＋パスワード認証
- `/admin/games/new` — 試合結果の入力。フォーム入力と JSON 一括入力の2モードあり、どちらも開始時間・大会名・試合種別に対応
  （対戦相手・大会名は入力時にマスタへ自動登録。JSON の書式は入力画面の例を参照、`//` コメント付きでも可）
- `/admin/games/[id]/edit` — 試合結果の編集
- `/admin/players` — 選手一覧・削除
- `/admin/players/new` — 選手登録
- `/admin/opponents` — 対戦相手マスタの追加・編集
- `/admin/tournaments` — 大会名マスタの追加・編集
- `/admin/settings` — 規定打席・規定投球回率などの設定

## Deploy

Vercel へのデプロイを想定しています。詳細は [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。
