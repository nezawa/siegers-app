# スキル構成 設計書

このプロジェクトで使う Claude Code スキルの一覧と役割の定義。

- 更新日: 2026-07-12
- スキルの実体: `.claude/skills/<スキル名>/SKILL.md`(プロジェクト)、`~/.claude/skills/`(ユーザーレベル・全プロジェクト共通)
- エージェントの実体: `.claude/agents/<エージェント名>.md`

## 全体像

スキルは3層で構成する。

1. **開発ワークフロースキル(8個)** — 相談から PR 作成までの開発プロセスを段階ごとに定義し、次のスキルへ誘導し合う
2. **プロジェクト固有の実務スキル(10個)** — このアプリ特有の手順・チェックリスト・パターン集。ワークフロースキルの各段階から参照される
3. **ユーザーレベルの汎用スキル** — プロジェクトをまたいで使う汎用スキル

## 開発ワークフロー

```
/consult(相談)
   ├─ 新機能・仕様変更 → /requirement(要件定義)→ /design(設計)→ /design_review(設計レビュー)
   ├─ 設計の見直し ──────────────────────────────┘         │
   └─ 小さな修正 ──────────────────────────┐              Approve
                                           ↓                ↓
                                    /implementation(実装)←──┘
                                           ↓
                                    /review(コードレビュー)
                                      │ Request Changes ⇄ /resolve(修正)
                                      │ Approve
                                      ↓
                                    /pr(PR 作成)
```

### ワークフロースキル一覧

| スキル | 役割 | 成果物 | 次のステップ |
|--------|------|--------|--------------|
| `/consult` | 技術的な問題・方針の迷いを対話で整理し、解決策の選択肢とトレードオフを提示 | 方針の決定 | /requirement, /design, /implementation, /review |
| `/requirement` | 要件をヒアリングして構造化された要件定義ドキュメントを作成 | `docs/requirements/YYYYMMDD-機能名.md` | /design |
| `/design` | 要件定義をもとに実装可能なレベルの設計書を作成 | `docs/design/YYYYMMDD-機能名.md` | /design_review, /implementation |
| `/design_review` | 要件定義と設計書を照合し、誤り・過不足・矛盾・曖昧さを検出(**design_reviewer エージェント**に委譲) | Approve / Request Changes の判定 | /implementation(Approve 時) |
| `/implementation` | 設計書に基づいてコードを実装(DB → 型 → ロジック → API → フロント → インフラの順) | コード | /review |
| `/review` | 実装コードを設計書・要件定義と照合し、品質・セキュリティ・規約・UI/UX の観点でレビュー(**reviewer エージェント**と併用) | Approve / Request Changes / Comment の判定 | /resolve(Request Changes 時), /pr(Approve 時) |
| `/resolve` | レビュー指摘を重要度順(Critical → Warning → Suggestion)に修正し、報告 | 修正コード + 修正結果報告 | /review(再レビュー) |
| `/pr` | ブランチの差分を分析し、PR テンプレートに沿った本文を生成して `gh` で PR を作成 | GitHub PR | — |

### エージェント

| エージェント | 呼び出し元 | 役割 |
|--------------|-----------|------|
| `design_reviewer` | /design_review | 要件定義と設計書の照合分析。読み取り専用。Approve / Request Changes を判定 |
| `reviewer` | /review | 実装者とは別視点でのコードレビュー分析。読み取り専用。観点・フォーマットは /review スキルの定義に従う |

## プロジェクト固有の実務スキル

| スキル | 役割 | 主な呼び出し場面 |
|--------|------|------------------|
| `/db-change` | Supabase の DB 変更の流儀(SQL の書き方・RLS 雛形・README 更新) | /design の DB 設計、/implementation の手順1 |
| `/add-game-field` | games テーブルの入力項目を追加/変更/削除する具体手順 | 試合情報の項目変更時 |
| `/add-stat-column` | 打撃・投手成績の統計列を追加/削除/変更する具体手順(触るファイル8箇所) | 成績項目の変更時 |
| `/stats-edge-cases` | 成績計算の境界値・異常系チェックリスト | /implementation・/review で成績ロジックを触ったとき |
| `/supabase-review` | Supabase クエリ・データ取得コードの観点集 | /review のパフォーマンス観点、データ取得処理の追加時 |
| `/ui-style` | サイトのデザイン言語と UI 実装パターン集 | /implementation のフロント実装、/review の UI/UX 観点 |
| `/dev` | ローカル起動・動作確認の手順(dev サーバー・管理者認証・Supabase 接続) | /implementation の動作確認 |
| `/preflight` | コミット・push・デプロイ前の品質チェック(lint + ビルド) | /implementation の手順4、コミット前 |
| `/commit-msg` | このリポジトリの流儀に合わせたコミットメッセージ作成 | コミット時、/pr の手順5 |
| `/troubleshoot` | 実際に起きたエラーと解決策の辞典 | エラー調査の最初、/consult の原因調査 |

## ユーザーレベルの汎用スキル(~/.claude/skills/)

全プロジェクト共通。このプロジェクト専用ではない。

| スキル | 役割 | 備考 |
|--------|------|------|
| `readme-update` | README・ドキュメントをコードと同期させる | |
| `task-breakdown` | 大きな要望を実装可能なタスクに分解する | /requirement・/design と役割が重複気味 |
| `test-gen` | ユニットテストを生成する | このプロジェクトにはテスト環境が未導入のため現状出番なし |

## スキルが参照する資料

| 資料 | 内容 | 更新タイミング |
|------|------|----------------|
| `docs/requirements/current-state.md` | 実装済みの現状要件 | 新要件の実装が取り込まれたとき |
| `docs/design/current-state.md` | 実装済みの現状設計 | 設計変更の実装が取り込まれたとき |
| `docs/requirements/YYYYMMDD-*.md` | 個別の要件定義 | /requirement が作成 |
| `docs/design/YYYYMMDD-*.md` | 個別の設計書 | /design が作成 |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR テンプレート | /pr が使用 |
| `CLAUDE.md` / `AGENTS.md` | 共通規約(Next.js のドキュメント参照ルール) | |

## 運用ルール

- ワークフローは必ずしも全段階を通す必要はない。小さな修正は /consult や /implementation から直接始めてよい
- `current-state.md`(要件・設計とも)は「常に実装済みの現状」を表す。実装完了時の同期更新を忘れない(/implementation 手順4・/resolve 手順4.5 に組み込み済み)
- 新しいスキルを追加・削除したら、この設計書も更新する
