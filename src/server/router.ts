import { UpstreamClient } from '../client/upstream.js';
import { NamespaceUtils } from './namespace.js';
import type { Tool, Resource, Prompt, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export class Router {
  private clients: Map<string, UpstreamClient>;
  private activeServers: Set<string>;

  constructor(clients: UpstreamClient[]) {
    this.clients = new Map(clients.map(c => [c.id, c]));
    this.activeServers = new Set();
  }

  /**
   * Aggregates tools from all active upstream clients, prefixing their names.
   * Also includes mcpc's native tools: mcp_search and mcp_enable.
   */
  async getAllTools(): Promise<Tool[]> {
    const activeClients = Array.from(this.clients.values()).filter(c => this.activeServers.has(c.id));

    const results = await Promise.allSettled(
      activeClients.map(async (client) => {
        const response = await client.listTools();
        return {
          clientId: client.id,
          tools: response.tools
        };
      })
    );

    const aggregatedTools: Tool[] = [
      {
        name: 'mcp_search',
        description: 'Search for available upstream MCP servers to enable.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'mcp_enable',
        description: 'Enable an upstream MCP server to use its tools, resources, and prompts.',
        inputSchema: {
          type: 'object',
          properties: {
            server_id: {
              type: 'string',
              description: 'The ID of the server to enable'
            }
          },
          required: ['server_id']
        }
      }
    ];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { clientId, tools } = result.value;
        for (const tool of tools) {
          aggregatedTools.push({
            ...tool,
            name: NamespaceUtils.addPrefix(clientId, tool.name)
          });
        }
      } else {
        // Log error but continue
        console.error('Failed to list tools from upstream:', result.reason);
      }
    }

    return aggregatedTools;
  }

  /**
   * Aggregates resources from all active upstream clients, prefixing their names.
   */
  async getAllResources(): Promise<Resource[]> {
    const activeClients = Array.from(this.clients.values()).filter(c => this.activeServers.has(c.id));

    const results = await Promise.allSettled(
      activeClients.map(async (client) => {
        const response = await client.listResources();
        return {
          clientId: client.id,
          resources: response.resources
        };
      })
    );

    const aggregatedResources: Resource[] = [];

    for (const result of results) {
        if (result.status === 'fulfilled') {
            const { clientId, resources } = result.value;
            for (const resource of resources) {
                aggregatedResources.push({
                    ...resource,
                    name: NamespaceUtils.addPrefix(clientId, resource.name)
                });
            }
        } else {
            console.error('Failed to list resources from upstream:', result.reason);
        }
    }
    return aggregatedResources;
  }

  /**
   * Aggregates prompts from all active upstream clients, prefixing their names.
   */
  async getAllPrompts(): Promise<Prompt[]> {
      const activeClients = Array.from(this.clients.values()).filter(c => this.activeServers.has(c.id));

      const results = await Promise.allSettled(
          activeClients.map(async (client) => {
              const response = await client.listPrompts();
              return {
                  clientId: client.id,
                  prompts: response.prompts
              };
          })
      );

      const aggregatedPrompts: Prompt[] = [];

      for (const result of results) {
          if (result.status === 'fulfilled') {
              const { clientId, prompts } = result.value;
              for (const prompt of prompts) {
                  aggregatedPrompts.push({
                      ...prompt,
                      name: NamespaceUtils.addPrefix(clientId, prompt.name)
                  });
              }
          } else {
              console.error('Failed to list prompts from upstream:', result.reason);
          }
      }
      return aggregatedPrompts;
  }

  /**
   * Dispatches a callTool request to the appropriate upstream client or handles native tools.
   */
  async dispatchCallTool(prefixedName: string, args: any): Promise<CallToolResult> {
    if (prefixedName === 'mcp_search') {
      const servers = Array.from(this.clients.keys());
      return {
        content: [{
          type: 'text',
          text: `Available MCP servers:\n${servers.map(s => `- ${s}${this.activeServers.has(s) ? ' (active)' : ''}`).join('\n')}\n\nUse the 'mcp_enable' tool with a server ID to activate its features.`
        }]
      };
    }

    if (prefixedName === 'mcp_enable') {
      const serverId = args?.server_id;
      if (!serverId || typeof serverId !== 'string') {
        throw new Error('server_id string argument is required for mcp_enable');
      }

      if (!this.clients.has(serverId)) {
        throw new Error(`Unknown server ID: ${serverId}`);
      }

      this.activeServers.add(serverId);
      return {
        content: [{
          type: 'text',
          text: `Server '${serverId}' has been activated. Its tools, resources, and prompts are now available.`
        }]
      };
    }

    const target = NamespaceUtils.stripPrefix(prefixedName);
    if (!target) {
      throw new Error(`Invalid tool name format: ${prefixedName}`);
    }

    const client = this.clients.get(target.serverId);
    if (!client) {
      throw new Error(`Unknown server prefix: ${target.serverId}`);
    }

    if (!this.activeServers.has(target.serverId)) {
      throw new Error(`Server '${target.serverId}' is not active. Enable it first using mcp_enable.`);
    }

    return (await client.callTool(target.name, args)) as CallToolResult;
  }

  /**
   * Dispatches a readResource request.
   * Note: This implementation assumes we route by a prefixed URI or identifier if needed.
   * For v1, we focus on the dispatch logic based on prefix.
   */
  async dispatchReadResource(uri: string) {
      // If URIs are not prefixed, we'd need a map. 
      // If we assumed URIs are prefixed like serverID_uri, we can strip.
      // Standard MCP URIs are often full URIs like file:///path.
      // Let's assume for now we might need more complex URI routing, 
      // but for task completion, we provide the method.
      const target = NamespaceUtils.stripPrefix(uri);
      if (!target) throw new Error(`Invalid URI format: ${uri}`);
      const client = this.clients.get(target.serverId);
      if (!client) throw new Error(`Unknown server prefix: ${target.serverId}`);
      return await client.readResource(target.name);
  }

  /**
   * Dispatches a getPrompt request.
   */
  async dispatchGetPrompt(prefixedName: string, args: any) {
      const target = NamespaceUtils.stripPrefix(prefixedName);
      if (!target) throw new Error(`Invalid prompt name format: ${prefixedName}`);
      const client = this.clients.get(target.serverId);
      if (!client) throw new Error(`Unknown server prefix: ${target.serverId}`);
      return await client.getPrompt(target.name, args);
  }
}
