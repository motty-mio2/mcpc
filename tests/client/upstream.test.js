import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpstreamClient } from '../../src/client/upstream.js';
import { ServerConfig } from '../../src/config/schema.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
// Mock SDK
// We mock the module but let Client be a spy-able class or just use vi.mocked for the import
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => {
    return {
        Client: vi.fn(function () {
            this.connect = vi.fn();
            this.close = vi.fn();
            this.listTools = vi.fn();
            this.callTool = vi.fn();
            this.listResources = vi.fn();
            this.readResource = vi.fn();
            this.listPrompts = vi.fn();
            this.getPrompt = vi.fn();
        }),
    };
});
vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => {
    return {
        StdioClientTransport: vi.fn(),
    };
});
describe('UpstreamClient', () => {
    const mockConfig = {
        id: 'server1',
        command: 'echo',
        args: ['hello'],
        env: { TEST: '1' },
        tags: []
    };
    let client;
    beforeEach(() => {
        vi.clearAllMocks();
        client = new UpstreamClient(mockConfig);
    });
    it('initializes with correct config', () => {
        expect(client.id).toBe('server1');
    });
    it('connects using StdioClientTransport by default', async () => {
        await client.connect();
        expect(StdioClientTransport).toHaveBeenCalledWith({
            command: 'echo',
            args: ['hello'],
            env: expect.objectContaining({ TEST: '1' })
        });
        // Check Client instantiated
        expect(Client).toHaveBeenCalled();
        // Check connect called on the instance
        // Access the mock instance created by the constructor call
        const mockClientInstance = Client.mock.instances[0];
        expect(mockClientInstance.connect).toHaveBeenCalled();
    });
    it('handles connection errors gracefully', async () => {
        const error = new Error('Connection failed');
        // Setup the next instance to reject on connect
        // Since we re-instantiate in beforeEach, this setup is tricky if new UpstreamClient called new Client already.
        // Actually, new UpstreamClient() calls new Client(). 
        // So we need to access the instance that was ALREADY created in beforeEach and mock its connect method.
        // Get the instance created in beforeEach
        const mockClientInstance = Client.mock.instances[0];
        mockClientInstance.connect.mockRejectedValue(error);
        await expect(client.connect()).rejects.toThrow('Connection failed');
    });
});
//# sourceMappingURL=upstream.test.js.map