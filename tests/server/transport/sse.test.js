import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HonoSSEServer } from '../../../src/server/sse.js';
import { Router } from '../../../src/server/router.js';
import { Hono } from 'hono';
// Mock SDK
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
    return {
        Server: vi.fn(function () {
            this.connect = vi.fn();
            this.setRequestHandler = vi.fn();
            this.close = vi.fn();
        })
    };
});
vi.mock('@modelcontextprotocol/sdk/server/sse.js', () => {
    return {
        SSEServerTransport: vi.fn(function () {
            this.handlePostMessage = vi.fn();
            this.start = vi.fn();
            this.sessionId = 'test-session';
        }),
    };
});
describe('HonoSSEServer', () => {
    let router;
    let sseServer;
    beforeEach(() => {
        vi.clearAllMocks();
        router = {
            getAllTools: vi.fn().mockResolvedValue([]),
            getAllResources: vi.fn().mockResolvedValue([]),
            getAllPrompts: vi.fn().mockResolvedValue([]),
            dispatchCallTool: vi.fn(),
            dispatchReadResource: vi.fn(),
            dispatchGetPrompt: vi.fn(),
        };
        sseServer = new HonoSSEServer(router);
    });
    it('initializes Hono app', () => {
        expect(sseServer.getApp()).toBeDefined();
    });
    it('defines /sse and /messages endpoints', () => {
        const app = sseServer.getApp();
        // We can't easily check internal routes without executing or using private access
        // But we can check if routes were added.
        const routes = app.routes;
        expect(routes.some(r => r.path === '/sse')).toBe(true);
        expect(routes.some(r => r.path === '/messages')).toBe(true);
    });
});
//# sourceMappingURL=sse.test.js.map