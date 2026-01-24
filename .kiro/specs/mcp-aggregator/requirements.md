# Requirements Document

## Introduction
本プロジェクト「mcp-aggregator」は、複数のModel Context Protocol (MCP) サーバーを統合し、単一のエンドポイントとして振る舞うプロキシ（アグリゲーター）アプリケーションです。本アプリケーションは、外部のMCPサーバーに対してはクライアントとして振る舞い、AIクライアント（利用者）に対してはサーバーとして振る舞います。利用者側のインターフェースとして、標準入出力（stdio）とStreamable HTTPの2種類をサポートします。これにより、ユーザーやAIクライアントは、接続先ごとに設定を切り替えることなく、複数のMCPサーバーが提供するツール、リソース、プロンプトを一元的に利用可能になります。

## Requirements

### Requirement 1: MCPC Client Core (上流接続機能)
**Objective:** As a アグリゲーター, I want 複数の上流MCPサーバーに対して堅牢なクライアントとして振る舞う機能, so that 多様なサーバー機能を安定して取り込める

#### Acceptance Criteria
1. The `mcp-aggregator` shall [上流サーバーとの通信トランスポートとして、標準入出力（stdio）およびStreamable HTTPの両方をサポートする]
2. While [起動シーケンス中または動作中], the `mcp-aggregator` shall [設定された有効なすべての上流MCPサーバーへの接続を確立・維持する]
3. If [上流サーバーへの接続が失敗または切断された場合], the `mcp-aggregator` shall [該当サーバーを一時的に利用不可としてマークし、エラーをログに記録する] (システム全体の停止は防ぐ)
4. The `mcp-aggregator` shall [各上流サーバーに対して内部的に一意の識別子（IDまたは名前）を割り当てて管理する]

### Requirement 2: MCPC Server Core (集約・提供機能)
**Objective:** As a MCPクライアントユーザー, I want 統合された単一のサーバーインターフェース, so that 複数のバックエンドを意識せずに全ての機能を利用できる

#### Acceptance Criteria
1. The `mcp-aggregator` shall [利用者（ダウンストリーム）向けのインターフェースとして、標準入出力（stdio）をサポートする]
2. The `mcp-aggregator` shall [利用者（ダウンストリーム）向けのインターフェースとして、Streamable HTTP (SSE) をサポートする]
3. When [クライアントから一覧取得リクエスト（ListTools, ListResources, ListPrompts）を受信した], the `mcp-aggregator` shall [すべてのアクティブな上流サーバーから対応する情報を取得し、単一のリストに結合して返却する]
4. The `mcp-aggregator` shall [集約した機能（ツール、リソース、プロンプト）の名前に上流サーバーの識別子をプレフィックスとして付与し、名前空間を分離する] (例: `server1_toolName`)
5. When [クライアントから機能実行リクエスト（CallTool, ReadResourceなど）を受信した], the `mcp-aggregator` shall [プレフィックス等から対象の上流サーバーを特定し、リクエストを適切にルーティング（転送）する]
6. When [上流サーバーから処理結果を受信した], the `mcp-aggregator` shall [そのレスポンスをそのままリクエスト元のクライアントへ中継する]

### Requirement 3: MCPC CLI & Configuration (CLI・設定機能)
**Objective:** As a システム管理者, I want 標準的な設定とコマンドライン操作で振る舞いを制御する機能, so that 既存の環境に容易に導入・統合できる

#### Acceptance Criteria
1. The `mcp-aggregator` shall [ロードする設定ファイルを `XDG_CONFIG_HOME/mcpc/*.json` から探索する]
2. The `mcp-aggregator` shall [各設定ファイルにおいて、ルートレベルの `tags` (文字列のリスト) および `mcpServers` オブジェクトを認識する]
3. The `mcp-aggregator` shall [同一ファイル内のすべてのサーバーに対して、そのファイルで定義された `tags` を付与する]
4. When [CLI起動引数でタグフィルタが指定された], the `mcp-aggregator` shall [指定されたタグを持つファイル内のサーバーのみを接続対象としてフィルタリングする]
5. The `mcp-aggregator` shall [標準の `mcpServers` 形式（command, args, env等）のサーバー定義を正しくパースする]
