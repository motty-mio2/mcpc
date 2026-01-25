# Tasks

- [x] 1. Refactor Structure
  - [x] 1.1 Create `src/actions/` directory
  - [x] 1.2 Move server startup logic from `src/index.ts` to `src/actions/serve.ts`
    - Define `runServe(options: ServeOptions): Promise<void>`
  - [x] 1.3 Implement `src/actions/list.ts`
    - Define `runList(options: ListOptions): Promise<void>`
    - Implement output formatting

- [x] 2. Implement CLI Runner
  - [x] 2.1 Create `src/cli/runner.ts`
  - [x] 2.2 Configure `serve` subcommand with options
  - [x] 2.3 Configure root command (default) to trigger `runList`
  - [x] 2.4 Handle global options (like tags) if applicable to both

- [x] 3. Entry Point & Cleanup
  - [x] 3.1 Update `src/index.ts` to import and call `runCli`
  - [x] 3.2 Delete `src/cli/args.ts` (logic moved to runner)

- [x] 4. Tests
  - [x] 4.1 Update unit tests for `serve` action (previously integration/main tests?)
  - [x] 4.2 Add unit tests for `list` action
  - [x] 4.3 Update/Verify CLI argument parsing tests (runner tests)