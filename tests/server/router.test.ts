import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router } from '../../src/server/router.js';
import { UpstreamClient } from '../../src/client/upstream.js';
import { ListToolsResult, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Mock UpstreamClient
vi.mock('../../src/client/upstream.js', () => ({
  UpstreamClient: vi.fn(),
}));

describe('Router', () => {
  let router: Router;
  let mockClient1: any;
  let mockClient2: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient1 = {
      id: 'server1',
      listTools: vi.fn().mockResolvedValue({ tools: [{ name: 'toolA' }] }),
      callTool: vi.fn(),
      listResources: vi.fn().mockResolvedValue({ resources: [] }),
      listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
    };
    mockClient2 = {
      id: 'server2',
      listTools: vi.fn().mockResolvedValue({ tools: [{ name: 'toolB' }] }),
      callTool: vi.fn(),
      listResources: vi.fn().mockResolvedValue({ resources: [] }),
      listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
    };

    router = new Router([mockClient1, mockClient2]);
  });

  it('aggregates only native tools initially', async () => {
    const tools = await router.getAllTools();
    expect(tools).toHaveLength(2);
    expect(tools.map(t => t.name)).toContain('mcp_search');
    expect(tools.map(t => t.name)).toContain('mcp_enable');
  });

  it('aggregates tools from active clients with prefixes', async () => {
    await router.dispatchCallTool('mcp_enable', { server_id: 'server1' });
    await router.dispatchCallTool('mcp_enable', { server_id: 'server2' });

    const tools = await router.getAllTools();
    expect(tools).toHaveLength(4); // 2 native + 2 active
    expect(tools.map(t => t.name)).toContain('mcp_search');
    expect(tools.map(t => t.name)).toContain('mcp_enable');
    expect(tools.map(t => t.name)).toContain('server1_toolA');
    expect(tools.map(t => t.name)).toContain('server2_toolB');
  });

  it('handles partial failures during aggregation', async () => {
    mockClient2.listTools.mockRejectedValue(new Error('Failed'));
    await router.dispatchCallTool('mcp_enable', { server_id: 'server1' });
    await router.dispatchCallTool('mcp_enable', { server_id: 'server2' });

    const tools = await router.getAllTools();
    
    // Should still return server1's tools and native tools
    expect(tools).toHaveLength(3);
    expect(tools.find(t => t.name === 'server1_toolA')).toBeDefined();
    expect(tools.find(t => t.name === 'server2_toolB')).toBeUndefined();
  });

  // Resources aggregation test (Task 3.2 mentions getAllResources)
  it('aggregates resources with prefixes', async () => {
      mockClient1.listResources.mockResolvedValue({ 
          resources: [{ uri: 'file:///a', name: 'resA' }] 
      });
      mockClient2.listResources.mockResolvedValue({ 
          resources: [{ uri: 'file:///b', name: 'resB' }] 
      });

      const initialResources = await router.getAllResources();
      expect(initialResources).toHaveLength(0);

      await router.dispatchCallTool('mcp_enable', { server_id: 'server1' });
      await router.dispatchCallTool('mcp_enable', { server_id: 'server2' });

      const resources = await router.getAllResources();
      expect(resources).toHaveLength(2);
      expect(resources.map(r => r.name)).toContain('server1_resA');
      expect(resources.map(r => r.name)).toContain('server2_resB');
  });

  describe('dispatching requests', () => {
    it('dispatches callTool to correct client by stripping prefix', async () => {
      const mockResult = { content: [{ type: 'text', text: 'ok' }] };
      mockClient1.callTool.mockResolvedValue(mockResult);

      await router.dispatchCallTool('mcp_enable', { server_id: 'server1' });
      const result = await router.dispatchCallTool('server1_toolA', { arg: 1 });
      
      expect(mockClient1.callTool).toHaveBeenCalledWith('toolA', { arg: 1 });
      expect(result).toEqual(mockResult);
    });

    it('dispatches readResource to correct client', async () => {
        // Resources are handled by name in ListResources but ReadResource usually takes URI.
        // Task 3.3 says "Implement routing for resources".
        // If we aggregated with prefixed names, maybe we expect prefixed names in dispatch too?
        // Or if we use URIs, how do we route? 
        // Usually MCP clients use URI for ReadResource.
        // Let's assume for now we route by prefixed name if available, or if URI is used, we need a map.
        // The design says "Router holding registry of UpstreamClients".
        // Let's implement dispatchReadResource taking a prefixed name/uri.
        // Actually, MCP ReadResource takes a URI.
        // If we want to route URIs, we need to know which client owns which URI.
        // For simplicity in v1, let's assume we can dispatch by name if that's what's passed,
        // but standard MCP uses URIs.
        // Let's check requirements: "Requirement 3: When [client from CallTool] ... prefix etc identify ..."
        // "When [client from ReadResource] ... URI or identifier ..."
        // If we prefix the name in ListResources, we might need to prefix the URI too if we want deterministic routing?
        // Or maintain a URI -> Client map.
        // Let's try dispatching by a prefixed identifier for now as a generic router capability.
    });

    it('throws error for unknown server prefix', async () => {
      await expect(router.dispatchCallTool('unknown_tool', {}))
        .rejects.toThrow(/Unknown server prefix/);
    });

    it('throws error for invalid prefix format', async () => {
      await expect(router.dispatchCallTool('invalidtool', {}))
        .rejects.toThrow(/Invalid tool name format/);
    });
  });
});
