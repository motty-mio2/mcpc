import { Command } from 'commander';
import { runServe, type ServeOptions } from '../actions/serve.js';
import { runList, type ListOptions } from '../actions/list.js';

export async function runCli(argv: string[]) {
  const program = new Command();

  program
    .name('mcpc')
    .description('MCP Aggregator CLI')
    .version('1.0.0');

  // Command: serve
  program.command('serve')
    .description('Start the MCP Aggregator Server')
    .option('-t, --transport <mode>', 'Transport mode: stdio or sse', 'stdio')
    .option('--tags <tags>', 'Comma-separated list of tags to filter servers', (value) => value.split(','))
    .option('-p, --port <port>', 'Port number for SSE server', (value) => parseInt(value, 10))
    .action(async (options) => {
      const serveOptions: ServeOptions = {
        transport: options.transport,
        tags: options.tags,
        port: options.port
      };
      await runServe(serveOptions);
    });

  // Command: list (Default)
  program.command('list', { isDefault: true })
    .description('List configured servers')
    .option('--tags <tags>', 'Filter list by tags', (value) => value.split(','))
    .action(async (options) => {
        const listOptions: ListOptions = {
            tags: options.tags
        };
        await runList(listOptions);
    });

  await program.parseAsync(argv);
}