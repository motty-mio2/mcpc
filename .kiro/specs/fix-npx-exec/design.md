# Technical Design: Fix NPX Execution

## Overview
`package.json` の設定不足により `npx` 実行が失敗している問題を解消する。具体的には `bin` フィールドの追加と、Shebangの維持を確認する。

## Changes

### 1. `package.json` Configuration
*   **bin**: `"bin": { "mcpc": "./dist/index.js" }` を追加。
    *   これにより、`npx` はパッケージ名（または指定されたコマンド名）に対応する実行ファイルを見つけられるようになる。
*   **files**: `"files": ["dist"]` を追加（推奨）。
    *   `src` や `tests` を配布パッケージに含めないようにし、サイズを削減かつ明確にする。

### 2. Shebang Verification
*   `src/index.ts` の先頭に `#!/usr/bin/env node` があることを確認する。
*   TypeScriptコンパイラ (`tsc`) は通常コメントを維持するが、設定によっては削除される可能性があるため、出力ファイル (`dist/index.js`) にShebangが含まれているか確認する。
    *   もし `tsc` が削除してしまう場合は、ビルドプロセスで付与する等の対策が必要だが、通常は `module: node16` 等の設定であれば維持されるか、あるいはバナーとして扱う必要がある。
    *   **検証**: 現状の `tsconfig.json` では `removeComments: true` がデフォルトではないため維持される可能性が高いが、念のため確認する。

## Verification Plan
1.  `package.json` を修正。
2.  `pnpm build` を実行。
3.  `dist/index.js` の先頭行を確認。
4.  ローカルで `npm install -g .` または `npx .` を実行して動作確認。
