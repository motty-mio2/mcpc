# Tasks

- [ ] 1. Update Config Schema
  - [ ] 1.1 Update `src/config/schema.ts` to allow `url` and make `command`/`args` optional (conditional validation).
  - [ ] 1.2 Update `ServerConfig` interface/type.
  - [ ] 1.3 Update `src/config/loader.ts` to map `url` property.
  - [ ] 1.4 Update tests in `tests/config/schema.test.ts`.

- [ ] 2. Implement SSE Connection
  - [ ] 2.1 Update `src/client/upstream.ts` to support `SSEClientTransport`.
  - [ ] 2.2 Import `SSEClientTransport` from sdk.
  - [ ] 2.3 Switch transport based on config.
  - [ ] 2.4 Update tests in `tests/client/upstream.test.ts`.

- [ ] 3. Validation
  - [ ] 3.1 Verify existing Stdio connection still works.
  - [ ] 3.2 Verify SSE connection logic (via unit tests).
