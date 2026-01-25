# Tasks

- [x] 1. Update `package.json`
  - [x] 1.1 Add `"bin": { "mcpc": "./dist/index.js" }`
  - [x] 1.2 Add `"files": ["dist"]`

- [x] 2. Verify Shebang
  - [x] 2.1 Check `src/index.ts` for shebang (add if missing)
  - [x] 2.2 Run build and verify `dist/index.js` starts with shebang

- [x] 3. Validation
  - [x] 3.1 Run `pnpm build`
  - [x] 3.2 Test execution via `node dist/index.js` (and directly via `./dist/index.js`)
  - [x] 3.3 (Optional) Test local npx if possible