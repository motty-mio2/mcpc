# Requirements Document

## Introduction
ユーザーが `npx github:motty-mio2/mcpc serve` のようにGitHubリポジトリから直接実行しようとした際、`could not determine executable to run` というエラーが発生しています。これは `package.json` に `bin` フィールドが正しく設定されていないことが原因です。本修正により、`npx` での直接実行を可能にします。

## Requirements

### Requirement 1: NPX Executability (NPX実行可能性)
**Objective:** As a ユーザー, I want `npx` コマンドでパッケージを直接実行できる, so that インストール不要で手軽に利用できる

#### Acceptance Criteria
1. The `package.json` shall [executableなエントリポイントを指定する `bin` フィールドを含む]
2. The `bin` entry shall [ビルドされたJavaScriptファイル（`dist/index.js` 等）を指す]
3. The executable file shall [適切なShebang (`#!/usr/bin/env node`) を先頭に含む] (現状 `src/index.ts` には含まれているが、コンパイル後の挙動を保証する)

### Requirement 2: Publishability (公開設定)
**Objective:** As a 開発者, I want パッケージが正しく公開・利用できる設定, so that 配布時のトラブルを防ぐ

#### Acceptance Criteria
1. The `package.json` shall [`files` フィールドを含み、`dist` ディレクトリを配布対象とする]
2. The `files` field shall [ソースファイルを除外し、ビルド成果物のみを含める設定が推奨される]
