import { serve } from '@hono/node-server';
import { ConfigLoader } from '../config/loader.js';
import { UpstreamClient } from '../client/upstream.js';
import { Router } from '../server/router.js';
import { StdioServer } from '../server/stdio.js';
import { HonoSSEServer } from '../server/sse.js';

export interface ServeOptions {
  transport: 'stdio' | 'sse';
  tags?: string[];
  port?: number;
}

export async function runServe(options: ServeOptions): Promise<void> {
  console.log('DEBUG: runServe options:', JSON.stringify(options));
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
    // Keep running even if 0 upstreams, or maybe exit? 
    // Original implementation continued (or at least didn't throw).
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
}