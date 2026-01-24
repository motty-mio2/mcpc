import { Command } from 'commander';

export interface CliOptions {
  transport: 'stdio' | 'sse';
  tags?: string[];
  port?: number;
}

export function parseArgs(argv: string[]): CliOptions {
  const program = new Command();

  program
    .option('-t, --transport <mode>', 'Transport mode: stdio or sse', 'stdio')
    .option('--tags <tags>', 'Comma-separated list of tags to filter servers', (value) => value.split(','))
    .option('-p, --port <port>', 'Port number for SSE server', (value) => parseInt(value, 10));

  program.parse(argv);
  
  const options = program.opts();
  
  return {
      transport: options.transport,
      tags: options.tags,
      port: options.port
  };
}
