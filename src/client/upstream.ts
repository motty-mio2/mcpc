import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { ServerConfig } from '../config/schema.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

export class UpstreamClient {
  public readonly id: string;
  private client: Client;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.id = config.id;
    this.config = config;
    
    // Initialize Client with default capabilities
    this.client = new Client(
      {
        name: `mcp-aggregator-client-${config.id}`,
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  /**
   * Connects to the upstream server using the configured transport.
   * Supports stdio and sse.
   */
  async connect(): Promise<void> {
    let transport: Transport;

    if (this.config.url) {
      // SSE Transport
      transport = new SSEClientTransport(new URL(this.config.url));
    } else {
      // Stdio Transport
      // Filter env to remove undefined values to satisfy Record<string, string>
      const env: Record<string, string> = {};
      const mergedEnv = { ...process.env, ...this.config.env };
      
      for (const [key, value] of Object.entries(mergedEnv)) {
          if (value !== undefined) {
              env[key] = value;
          }
      }

      if (!this.config.command) {
          throw new Error(`Invalid configuration for server ${this.id}: 'command' is required for stdio transport.`);
      }

      transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args,
        env
      });
    }

    try {
      await this.client.connect(transport);
    } catch (error) {
      // Log error but rethrow to let caller handle it (e.g., mark as unhealthy)
      // console.error(`Failed to connect to upstream ${this.id}:`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  // Wrappers for Tools
  async listTools(params?: any) {
    return await this.client.listTools(params);
  }

  async callTool(name: string, args: any) {
    return await this.client.callTool({
      name,
      arguments: args
    });
  }

  // Wrappers for Resources
  async listResources(params?: any) {
    return await this.client.listResources(params);
  }

  async readResource(uri: string) {
    return await this.client.readResource({ uri });
  }

  // Wrappers for Prompts
  async listPrompts(params?: any) {
    return await this.client.listPrompts(params);
  }

  async getPrompt(name: string, args: any) {
    return await this.client.getPrompt({
      name,
      arguments: args
    });
  }
}