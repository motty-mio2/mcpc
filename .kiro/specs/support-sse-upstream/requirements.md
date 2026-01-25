# Requirements Document

## Introduction
現在の `mcpc` は、`command` と `args` を指定してローカルプロセスを起動する stdio 接続のみをサポートしています。
本機能追加により、HTTP(SSE) エンドポイントを持つ既存のMCPサーバーへの接続をサポートし、GitHub MCP Server のようなリモート/常駐型サーバーも集約できるようにします。

## Requirements

### Requirement 1: Configuration for SSE Upstream (設定拡張)
**Objective:** As a ユーザー, I want SSEエンドポイントのURLを設定ファイルに記述できる, so that リモートのMCPサーバーに接続できる

#### Acceptance Criteria
1. The `mcpServers` configuration shall [従来の `command` / `args` の代わりに `url` プロパティを受け入れる]
2. The system shall [バリデーションを行い、`url` が指定された場合は `command` / `args` が不要であることを許容する]
3. The system shall [url と command の両方が指定された場合のエラーハンドリング（または優先順位）を定義する] -> `url` 優先または排他制御とする。

### Requirement 2: SSE Client Connection (SSE接続機能)
**Objective:** As a アグリゲーター, I want 指定されたURLに対してSSEで接続する, so that リモートサーバーの機能を利用できる

#### Acceptance Criteria
1. When [サーバー設定に `url` が含まれている場合], the `UpstreamClient` shall [`SSEClientTransport` を使用して接続を開始する]
2. The client shall [SSEエンドポイント（`GET`）への接続と、メッセージ送信エンドポイント（`POST`）の解決を行う] (通常、SDKが `sse` エンドポイントから `post` エンドポイントを解決する)
3. The client shall [接続エラー時に適切にログを出力し、他のサーバーへの影響を最小限にする（既存のPartial Failure仕様の維持）]
