# Implementation Plan

## Task Summary
- **Total**: 6 Major Tasks
- **Coverage**: All requirements (1.1-1.4, 2.1-2.6, 3.1-3.5) covered across 14 sub-tasks
- **Strategy**: 
  - Phase 1: Core Configuration & Upstream Client (Parallelizable)
  - Phase 2: Router Logic (Aggregation & Dispatch)
  - Phase 3: Server Interfaces (Downstream)
  - Phase 4: Integration & CLI

## Tasks

- [ ] 1. Core Configuration Module (ConfigManager)
- [x] 1.1 (P) Implement Zod Schema & Type Definitions
  - Define `ServerConfig` interface and Zod schema for validation
  - Implement parsing logic for `mcpServers` and `tags`
  - Support environment variable substitution in config values
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 1.2 (P) Implement Configuration Loader with XDG Support
  - Implement `XDG_CONFIG_HOME` discovery logic
  - Scan and load all JSON files from `mcpc/` directory
  - Apply tag filtering logic based on input arguments
  - _Requirements: 3.1, 3.3, 3.4_

- [ ] 2. Upstream Client Core
- [x] 2.1 (P) Implement UpstreamClient Connection Management
  - Implement `UpstreamClient` class wrapping `@modelcontextprotocol/sdk` Client
  - Support `StdioClientTransport` connection establishment
  - Support `SSEClientTransport` connection establishment (future-proof)
  - Manage connection state and error handling (connection failure logging)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2.2 (P) Implement Upstream Tool/Resource Accessors
  - Implement `listTools`, `listResources`, `listPrompts` wrappers
  - Implement `callTool`, `readResource`, `getPrompt` wrappers
  - Ensure error propagation from upstream is transparent
  - _Requirements: 2.3, 2.5_

- [ ] 3. Router & Aggregation Logic
- [x] 3.1 Implement Namespace & Prefix Logic
  - Implement utility to add prefix (`{serverID}_{name}`) to tool/resource names
  - Implement utility to strip prefix and extract target server ID
  - Handle edge cases (e.g., empty ID, separator collision)
  - _Requirements: 2.4_

- [x] 3.2 Implement Aggregation Logic
  - Implement `Router` class holding `UpstreamClient` registry
  - Implement `getAllTools`, `getAllResources` merging logic
  - Execute upstream list calls in parallel and aggregate results
  - Handle partial failures (log error, exclude failed server's tools)
  - _Requirements: 2.3, 1.3_

- [x] 3.3 Implement Dispatch Routing
  - Implement `dispatchCallTool` logic to identify target client
  - Implement routing for resources and prompts
  - Handle "Method not found" or "Invalid params" for unknown prefixes
  - _Requirements: 2.5, 2.6_

- [ ] 4. Downstream Server Interfaces
- [x] 4.1 (P) Implement Stdio Server Transport
  - Set up `McpServer` with `StdioServerTransport`
  - Wire `ListTools`/`CallTool` handlers to `Router` methods
  - Ensure standard input/output is exclusively used for protocol
  - _Requirements: 2.1, 2.2_

- [x] 4.2 (P) Implement Hono SSE Server Transport
  - Set up `Hono` app with `@hono/node-server` adapter
  - Implement `GET /sse` endpoint using `SSEServerTransport` logic
  - Implement `POST /messages` endpoint for JSON-RPC messages
  - Wire handlers to `Router` instance
  - _Requirements: 2.1, 2.2_

- [ ] 5. CLI & Entry Point
- [x] 5.1 Implement CLI Argument Parsing
  - Use `commander` to parse `--tags` and transport mode (`stdio` vs `http`) arguments
  - Configure logging levels (default to stderr)
  - _Requirements: 3.4_

- [x] 5.2 Implement Main Entry Point & Integration
  - Wire `ConfigManager` -> `UpstreamClient` Pool -> `Router` -> `ServerInterface`
  - Implement initialization sequence (connect upstreams first, then start downstream)
  - Handle graceful shutdown (close connections)
  - _Requirements: 1.2, 2.1_

- [ ] 6. Testing & Validation
- [x] 6.1 (P) Unit Testing Suite
  - Test ConfigManager parsing and filtering
  - Test Router prefix logic and dispatching
  - Mock upstream clients to verify aggregation logic
  - _Requirements: 2.3, 2.4, 3.2_

- [x] 6.2 Integration Testing
  - Create dummy upstream MCP server (simple filesystem or echo)
  - Verify full flow: Downstream Request -> Aggregator -> Upstream -> Response
  - Verify error handling when upstream is down
  - _Requirements: 2.5, 2.6, 1.3_
