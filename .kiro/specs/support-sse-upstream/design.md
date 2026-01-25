# Technical Design: Support SSE Upstream

## Overview
上流MCPサーバーとして、stdioベースのサブプロセスだけでなく、HTTP(SSE)ベースのリモートサーバーへの接続を可能にする。

## Architecture Changes

### 1. Configuration Schema (`src/config/schema.ts`)
`ServerConfig` の定義を Discriminated Union (判別可能な共用体) に変更するか、オプショナルフィールドの組み合わせに変更する。

**変更案 (Zod Schema)**:
```typescript
const StdioConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(z.string()).optional()
});

const SseConfigSchema = z.object({
  url: z.string().url(),
  env: z.record(z.string()).optional() // SSEでもEnvが必要なケースは稀だが、互換性のため残しても良い
});

// mcpServers の値を Union にする
// command があれば Stdio, url があれば SSE
```
ユーザーの利便性を考え、以下のような緩やかなスキーマとする：
- `url`: optional string
- `command`: optional string
- `args`: optional string array
- **Validation Refinement**: `url` があるか、または `command` と `args` があるか、どちらか一方が必須。

### 2. Upstream Client (`src/client/upstream.ts`)
`connect()` メソッド内で設定値を判定し、トランスポートを切り替える。

*   **Current**: `StdioClientTransport` を常に使用。
*   **New**:
    *   `config.url` が存在する場合 -> `SSEClientTransport` を生成し、`new URL(config.url)` を渡す。
    *   それ以外 (`config.command`) -> 既存通り `StdioClientTransport` を使用。

## Data Model

### `ServerConfig` Interface
```typescript
export interface ServerConfig {
  id: string;
  tags: string[];
  // Stdio
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // SSE
  url?: string;
}
```

## Verification Plan
1.  **Unit Test**: `schema.test.ts` で `url` のみの設定がパースできることを確認。
2.  **Unit Test**: `upstream.test.ts` で `url` 指定時に `SSEClientTransport` がインスタンス化されることをモック確認。
3.  **Manual**: 実際にローカルでSSEサーバーを立て（既存の `mcpc serve --transport sse` を利用可能）、それに接続する設定を書いてループバック接続テストを行う。
