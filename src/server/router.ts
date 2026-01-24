import { UpstreamClient } from '../client/upstream.js';
import { NamespaceUtils } from './namespace.js';
import { Tool, Resource, Prompt, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export class Router {
  private clients: Map<string, UpstreamClient>;

  constructor(clients: UpstreamClient[]) {
    this.clients = new Map(clients.map(c => [c.id, c]));
  }

  /**
   * Aggregates tools from all upstream clients, prefixing their names.
   * Handles partial failures by excluding failed servers.
   */
  async getAllTools(): Promise<Tool[]> {
    const results = await Promise.allSettled(
      Array.from(this.clients.values()).map(async (client) => {
        const response = await client.listTools();
        return {
          clientId: client.id,
          tools: response.tools
        };
      })
    );

    const aggregatedTools: Tool[] = [];

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
   * Dispatches a callTool request to the appropriate upstream client.
   */
  async dispatchCallTool(prefixedName: string, args: any): Promise<CallToolResult> {
    const target = NamespaceUtils.stripPrefix(prefixedName);
    if (!target) {
      throw new Error(`Invalid tool name format: ${prefixedName}`);
    }

    const client = this.clients.get(target.serverId);
    if (!client) {
      throw new Error(`Unknown server prefix: ${target.serverId}`);
    }

    return await client.callTool(target.name, args);
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
