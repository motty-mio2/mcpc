# Requirements Document

## Introduction
本仕様変更は、`mcpc` CLIのユーザーインターフェースを再構築し、サブコマンド形式を導入することを目的とします。
従来は `mcpc` コマンドが直接サーバーを起動していましたが、今後は `mcpc` 単体で設定済みサーバーの一覧表示を行い、サーバー起動は `mcpc serve` サブコマンドで行うように変更します。これにより、ユーザーは設定状況を容易に確認できるようになります。

## Requirements

### Requirement 1: CLI Subcommand Structure (CLI構造の変更)
**Objective:** As a ユーザー, I want 明確なサブコマンド体系, so that 意図した操作（一覧表示またはサーバー起動）を迷いなく実行できる

#### Acceptance Criteria
1. When [`mcpc` コマンドが引数なしで実行された場合], the `mcpc` shall [設定されているMCPサーバーの一覧を表示する（詳細はRequirement 2参照）]
2. When [`mcpc serve` コマンドが実行された場合], the `mcpc` shall [アグリゲーターサーバーとしての動作を開始する（既存機能の維持）]
3. The `mcpc` shall [既存のオプション（`--transport`, `--tags` など）を `serve` コマンドのオプションとして受け入れる]
4. The `mcpc --help` shall [利用可能なサブコマンド（`serve` 等）とその説明を表示する]

### Requirement 2: List Servers Functionality (サーバー一覧表示機能)
**Objective:** As a ユーザー, I want 設定済みサーバーとタグの一覧表示, so that 現在の設定が正しくロードされているかを確認できる

#### Acceptance Criteria
1. When [一覧表示が実行された場合], the `mcpc` shall [設定ファイルからロードされたすべてのサーバー情報を取得する]
2. The `mcpc` shall [各サーバーの「サーバーID」を表示する]
3. The `mcpc` shall [各サーバーに関連付けられた「タグ」のリストを表示する]
4. The output format shall [人間が読みやすい形式（例: 各行にIDとタグを表示）であること]
