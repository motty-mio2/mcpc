import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpstreamClient } from '../../src/client/upstream.js';
import { ServerConfig } from '../../src/config/schema.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
// Mock SDK
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
describe('UpstreamClient Wrappers', () => {
    const mockConfig = {
        id: 'server1',
        command: 'echo',
        args: ['hello'],
        env: { TEST: '1' },
        tags: []
    };
    let client;
    let mockClientInstance;
    beforeEach(() => {
        vi.clearAllMocks();
        client = new UpstreamClient(mockConfig);
        mockClientInstance = Client.mock.instances[0];
    });
    it('listTools proxies to SDK client', async () => {
        const mockTools = { tools: [{ name: 'tool1' }] };
        mockClientInstance.listTools.mockResolvedValue(mockTools);
        const result = await client.listTools();
        expect(mockClientInstance.listTools).toHaveBeenCalled();
        expect(result).toEqual(mockTools);
    });
    it('callTool proxies to SDK client', async () => {
        const mockResult = { content: [{ type: 'text', text: 'result' }] };
        mockClientInstance.callTool.mockResolvedValue(mockResult);
        const result = await client.callTool('tool1', { arg: 'val' });
        expect(mockClientInstance.callTool).toHaveBeenCalledWith({ name: 'tool1', arguments: { arg: 'val' } });
        expect(result).toEqual(mockResult);
    });
    it('propagates errors from upstream', async () => {
        const error = new Error('Upstream error');
        mockClientInstance.listTools.mockRejectedValue(error);
        await expect(client.listTools()).rejects.toThrow('Upstream error');
    });
    // Similarly for listResources, readResource, listPrompts, getPrompt
    it('listResources proxies to SDK client', async () => {
        mockClientInstance.listResources.mockResolvedValue({ resources: [] });
        await client.listResources();
        expect(mockClientInstance.listResources).toHaveBeenCalled();
    });
    it('readResource proxies to SDK client', async () => {
        mockClientInstance.readResource.mockResolvedValue({ contents: [] });
        await client.readResource('uri');
        expect(mockClientInstance.readResource).toHaveBeenCalledWith({ uri: 'uri' });
    });
    it('listPrompts proxies to SDK client', async () => {
        mockClientInstance.listPrompts.mockResolvedValue({ prompts: [] });
        await client.listPrompts();
        expect(mockClientInstance.listPrompts).toHaveBeenCalled();
    });
    it('getPrompt proxies to SDK client', async () => {
        mockClientInstance.getPrompt.mockResolvedValue({ messages: [] });
        await client.getPrompt('prompt1', { arg: 'val' });
        expect(mockClientInstance.getPrompt).toHaveBeenCalledWith({ name: 'prompt1', arguments: { arg: 'val' } });
    });
});
//# sourceMappingURL=accessors.test.js.map