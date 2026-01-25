#!/usr/bin/env node
import { runCli } from './cli/runner.js';

export async function main() {
  try {
    await runCli(process.argv);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();