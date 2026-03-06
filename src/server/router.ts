import { UpstreamClient } from '../client/upstream.js';
import { NamespaceUtils } from './namespace.js';
import type { Tool, Resource, Prompt, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export class Router {
  private clients: Map<string, UpstreamClient>;

  constructor(clients: UpstreamClient[]) {
    this.clients = new Map(clients.map(c => [c.id, c]));
  }

  /**
   * Exposes universal tools to search and execute upstream tools instead of directly returning them.
   */
  async getAllTools(): Promise<Tool[]> {
    return [
      {
        name: '__mcpc_search_tools',
        description: 'Search for available upstream MCP tools. Returns a list of servers and their available tools along with input schemas.',
        inputSchema: {
          type: 'object',
          properties: {
            server_id: {
              type: 'string',
              description: 'Optional server ID to filter tools for a specific server.'
            }
          }
        }
      },
      {
        name: '__mcpc_execute_tool',
        description: 'Execute a specific tool on an upstream MCP server.',
        inputSchema: {
          type: 'object',
          properties: {
            server_id: {
              type: 'string',
              description: 'The ID of the server to execute the tool on'
            },
            tool_name: {
              type: 'string',
              description: 'The name of the tool to execute'
            },
            arguments: {
              type: 'string',
              description: 'A JSON-encoded string representing the arguments to pass to the tool'
            }
          },
          required: ['server_id', 'tool_name', 'arguments']
        }
      }
    ];
  }

  /**
   * Aggregates resources from all upstream clients, prefixing their names.
   */
  async getAllResources(): Promise<Resource[]> {
    const results = await Promise.allSettled(
      Array.from(this.clients.values()).map(async (client) => {
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
   * Aggregates prompts from all upstream clients, prefixing their names.
   */
  async getAllPrompts(): Promise<Prompt[]> {
      const results = await Promise.allSettled(
          Array.from(this.clients.values()).map(async (client) => {
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
   * Dispatches universal callTool requests for searching or executing upstream tools.
   */
  async dispatchCallTool(name: string, args: any): Promise<CallToolResult> {
    if (name === '__mcpc_search_tools') {
      const serverIdFilter = args?.server_id;
      let targetClients = Array.from(this.clients.values());
      if (serverIdFilter) {
        const client = this.clients.get(serverIdFilter);
        targetClients = client ? [client] : [];
      }

      const results = await Promise.allSettled(
        targetClients.map(async (client) => {
          const response = await client.listTools();
          return { clientId: client.id, tools: response.tools };
        })
      );

      const available: Record<string, any[]> = {};
      for (const result of results) {
        if (result.status === 'fulfilled') {
          available[result.value.clientId] = result.value.tools;
        } else {
          console.error('Failed to list tools:', result.reason);
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(available, null, 2)
        }]
      };
    }

    if (name === '__mcpc_execute_tool') {
      const serverId = args?.server_id;
      const toolName = args?.tool_name;
      const argsJson = args?.arguments;

      if (!serverId || !toolName || !argsJson) {
        throw new Error('server_id, tool_name, and arguments are required for __mcpc_execute_tool');
      }

      const client = this.clients.get(serverId);
      if (!client) {
        throw new Error(`Unknown server ID: ${serverId}`);
      }

      let parsedArgs;
      try {
        parsedArgs = JSON.parse(argsJson);
      } catch (e) {
        throw new Error(`Failed to parse arguments JSON: ${e}`);
      }

      return (await client.callTool(toolName, parsedArgs)) as CallToolResult;
    }

    // Since we only expose __mcpc_search_tools and __mcpc_execute_tool, any other tool call is invalid.
    throw new Error(`Unknown tool: ${name}`);
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
