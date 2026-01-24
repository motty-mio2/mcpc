import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { Router } from './router.js';

export class StdioServer {
  private server: Server;
  private router: Router;

  constructor(router: Router) {
    this.router = router;
    this.server = new Server(
      {
        name: 'mcp-aggregator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );
  }

  async start() {
    this.setupHandlers();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  private setupHandlers() {
    // Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.router.getAllTools();
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // CallToolRequestSchema validates that params are correct
      // SDK types might need casting if strict
      const { name, arguments: args } = request.params;
      return await this.router.dispatchCallTool(name, args);
    });

    // Resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = await this.router.getAllResources();
      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      return await this.router.dispatchReadResource(uri);
    });

    // Prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = await this.router.getAllPrompts();
      return { prompts };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.router.dispatchGetPrompt(name, args);
    });
  }
}
