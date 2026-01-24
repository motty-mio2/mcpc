import { serve } from '@hono/node-server';
import { parseArgs } from './cli/args.js';
import { ConfigLoader } from './config/loader.js';
import { UpstreamClient } from './client/upstream.js';
import { Router } from './server/router.js';
import { StdioServer } from './server/stdio.js';
import { HonoSSEServer } from './server/sse.js';

export async function main() {
  try {
    const options = parseArgs(process.argv);
    
    // Load configs
    const configs = await ConfigLoader.loadConfigs(options.tags);
    console.error(`Loaded ${configs.length} upstream server configurations.`);

    // Connect to upstreams
    const clients: UpstreamClient[] = [];
    for (const config of configs) {
      const client = new UpstreamClient(config);
      try {
        await client.connect();
        clients.push(client);
        console.error(`Connected to upstream: ${config.id}`);
      } catch (error) {
        console.error(`Failed to connect to upstream ${config.id}:`, error);
        // Continue, partial availability
      }
    }

    if (clients.length === 0) {
      console.error('No upstream servers available. Exiting.');
      // Depending on policy, we might stay alive or exit. 
      // Requirement 1.3 says "System failure avoided", but if nothing to aggregate...
      // Let's assume we continue running the server even with 0 upstreams (empty list).
    }

    const router = new Router(clients);

    // Start Downstream Server
    if (options.transport === 'sse') {
      const port = options.port || 3000;
      const sseServer = new HonoSSEServer(router);
      console.error(`Starting SSE server on port ${port}...`);
      serve({
        fetch: sseServer.getApp().fetch,
        port
      });
    } else {
      console.error('Starting Stdio server...');
      const stdioServer = new StdioServer(router);
      await stdioServer.start();
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Only run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
