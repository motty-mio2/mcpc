import { runCli } from './cli/runner.js';

export async function main() {
  try {
    await runCli(process.argv);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Only run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}