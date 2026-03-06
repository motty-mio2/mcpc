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

  it('exposes only universal search and execute tools', async () => {
    const tools = await router.getAllTools();
    expect(tools).toHaveLength(2);
    expect(tools.map(t => t.name)).toContain('__mcpc_search_tools');
    expect(tools.map(t => t.name)).toContain('__mcpc_execute_tool');
  });

  // Resources aggregation test (Task 3.2 mentions getAllResources)

  // Resources aggregation test (Task 3.2 mentions getAllResources)
  it('aggregates resources with prefixes', async () => {
      mockClient1.listResources.mockResolvedValue({ 
          resources: [{ uri: 'file:///a', name: 'resA' }] 
      });
      mockClient2.listResources.mockResolvedValue({ 
          resources: [{ uri: 'file:///b', name: 'resB' }] 
      });

      const resources = await router.getAllResources();
      expect(resources).toHaveLength(2);
      expect(resources.map(r => r.name)).toContain('server1_resA');
      expect(resources.map(r => r.name)).toContain('server2_resB');
  });

  describe('dispatching requests', () => {
    it('dispatches execute to correct client', async () => {
      const mockResult = { content: [{ type: 'text', text: 'ok' }] };
      mockClient1.callTool.mockResolvedValue(mockResult);

      const args = {
        server_id: 'server1',
        tool_name: 'toolA',
        arguments: '{"arg": 1}'
      };

      const result = await router.dispatchCallTool('__mcpc_execute_tool', args);
      
      expect(mockClient1.callTool).toHaveBeenCalledWith('toolA', { arg: 1 });
      expect(result).toEqual(mockResult);
    });

    it('handles search tools request', async () => {
      const result = await router.dispatchCallTool('__mcpc_search_tools', {});
      const content = JSON.parse((result.content[0] as any).text);
      expect(content).toHaveProperty('server1');
      expect(content).toHaveProperty('server2');
      expect(content.server1[0].name).toBe('toolA');
    });

    it('throws error for unknown server in execute', async () => {
      const args = {
        server_id: 'unknown_server',
        tool_name: 'toolA',
        arguments: '{}'
      };
      await expect(router.dispatchCallTool('__mcpc_execute_tool', args))
        .rejects.toThrow(/Unknown server ID: unknown_server/);
    });

    it('throws error for unknown tool', async () => {
      await expect(router.dispatchCallTool('unknown_tool', {}))
        .rejects.toThrow(/Unknown tool/);
    });
  });
});
