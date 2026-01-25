# Tasks

- [x] 1. Update `package.json`
  - [x] 1.1 Add `"bin": { "mcpc": "./dist/index.js" }`
  - [x] 1.2 Add `"files": ["dist"]`

- [x] 2. Verify Shebang
  - [x] 2.1 Check `src/index.ts` for shebang (add if missing)
  - [x] 2.2 Run build and verify `dist/index.js` starts with shebang

- [x] 3. Enable Git Installation Build
  - [x] 3.1 Add `"prepare": "npm run build"` to `package.json` scripts
    - This ensures `dist` is generated when installed from Git.

- [x] 4. Validation
  - [x] 4.1 Run `pnpm build`
  - [x] 4.2 Test execution via `node dist/index.js`
  - [ ] 4.3 (Manual) Verify `npx github:...` works after push (User task)