# Research & Design Decisions: mcp-aggregator

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.
---

## Summary
- **Feature**: `mcp-aggregator`
- **Discovery Scope**: New Feature (Greenfield)
- **Key Findings**:
  - `Node.js` with `@modelcontextprotocol/sdk` is chosen for ease of implementation.
  - `Express` with `SSEServerTransport` is the standard pattern for SSE support.
  - Prefix-based namespacing is the simplest effective strategy for tool aggregation.

## Research Log

### MCP SDK (TypeScript)
- **Context**: Need a TypeScript implementation of the Model Context Protocol.
- **Findings**:
  - `@modelcontextprotocol/sdk` provides `Client`, `Server`, `StdioClientTransport`, `StdioServerTransport`, `SSEClientTransport`, `SSEServerTransport`.
  - It supports `zod` for schema validation natively.

### Streamable HTTP / SSE
- **Context**: Requirement to support Streamable HTTP.
- **Findings**:
  - Express middleware pattern is common for SSE.
  - `SSEServerTransport` handles the protocol details, needing only request/response streams hooked up.

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| **Central Hub (Node.js)** | A single Node process aggregating upstream connections. | Mature ecosystem, easy async handling, rich library support. | Single threaded (mitigated by async I/O nature of proxying). | **Selected Approach** |

## Design Decisions

### Decision: Node.js & TypeScript
- **Context**: Choosing the runtime environment.
- **Selected Approach**: Node.js v24 (LTS) + TypeScript.
- **Rationale**: Best alignment with official SDK, easy handling of dynamic JSON, fast development cycle.

### Decision: Hono for HTTP Server
- **Context**: Requirement for high-performance Streamable HTTP support.
- **Selected Approach**: `hono` with `@hono/node-server`.
- **Rationale**:
  - Higher performance than Express.
  - Standard Web API compliance (easier migration to Edge/Bun/Deno later).
  - Clean stream handling integration for SSE.
- **Trade-offs**: Slightly smaller ecosystem than Express (mitigated by standard compliance).

### Decision: Namespace Management via Prefixing
- **Selected Approach**: Prepend server ID to tool names (`{serverID}_{toolName}`).
- **Rationale**: Simple collision avoidance.

## Risks & Mitigations
- **Risk 1**: Upstream failure blocking the event loop.
  - **Mitigation**: Ensure all upstream calls are properly awaited and wrapped in try-catch/timeout blocks so they don't hang the router.