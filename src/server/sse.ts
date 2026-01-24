import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Router } from './router.js';

export class HonoSSEServer {
  private app: Hono;
  private server: Server;
  private router: Router;
  private transports: Map<string, SSEServerTransport> = new Map();

  constructor(router: Router) {
    this.router = router;
    this.app = new Hono();
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

    this.setupHandlers();
    this.setupRoutes();
  }

  public getApp(): Hono {
    return this.app;
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.router.getAllTools();
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.router.dispatchCallTool(name, args);
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = await this.router.getAllResources();
      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      return await this.router.dispatchReadResource(uri);
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = await this.router.getAllPrompts();
      return { prompts };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.router.dispatchGetPrompt(name, args);
    });
  }

  private setupRoutes() {
    this.app.get('/sse', async (c) => {
      return streamSSE(c, async (stream) => {
        // SSEServerTransport expects a Node.js-like Response object.
        // We provide a shim that writes to Hono's stream.
        const transport = new SSEServerTransport('/messages', {
          writeHead: (status: number, headers: any) => {
            // Hono handles status and headers via c.header/c.status or stream headers
            // But streamSSE already set up the basics.
            for (const [key, value] of Object.entries(headers || {})) {
                c.header(key, String(value));
            }
          },
          write: (data: string) => {
            // MCP SSEServerTransport writes raw SSE data (event: ..., data: ...)
            // We can write it directly to the stream.
            stream.write(data);
          },
          end: () => {
            stream.close();
          },
          on: (event: string, listener: any) => {
              if (event === 'close') {
                  stream.onAbort(listener);
              }
          }
        } as any);

        this.transports.set(transport.sessionId, transport);
        
        stream.onAbort(() => {
            this.transports.delete(transport.sessionId);
        });

        await this.server.connect(transport);
      });
    });

    this.app.post('/messages', async (c) => {
      const sessionId = c.req.query('sessionId');
      if (!sessionId) {
        return c.text('Missing sessionId', 400);
      }

      const transport = this.transports.get(sessionId);
      if (!transport) {
        return c.text('Invalid sessionId', 404);
      }

      // handlePostMessage expects raw Node objects.
      // We can pass a shim or just use the logic if simple.
      // handlePostMessage reads req.body and calls transport.onMessage.
      // Since we already have the body in Hono, we can just call onMessage?
      // Actually handlePostMessage is private in some versions or complex.
      // But it's usually public.
      
      const body = await c.req.json();
      // Most SSEServerTransport implementations have handlePostMessage(req, res).
      // If we can't use it directly, we might need to call onMessage if it's accessible.
      // In SDK 1.x, handlePostMessage is public.
      
      // Let's use a shim for req/res for handlePostMessage
      await transport.handlePostMessage(
          { body } as any, // req shim
          { 
              writeHead: (s: number) => c.status(s as any),
              end: (data?: string) => { if (data) return c.text(data) }
          } as any // res shim
      );
      
      return c.body(null, 200);
    });
  }
}
