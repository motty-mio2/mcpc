import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runServe } from '../../src/actions/serve.js';
import { ConfigLoader } from '../../src/config/loader.js';
import { UpstreamClient } from '../../src/client/upstream.js';
import { StdioServer } from '../../src/server/stdio.js';
import { HonoSSEServer } from '../../src/server/sse.js';
import { serve } from '@hono/node-server';

// Mock everything
vi.mock('../../src/config/loader.js');
vi.mock('../../src/client/upstream.js');
vi.mock('../../src/server/stdio.js');
vi.mock('../../src/server/sse.js');
vi.mock('@hono/node-server');

describe('Serve Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('initializes stdio server by default', async () => {
    vi.mocked(ConfigLoader.loadConfigs).mockResolvedValue([{ id: 's1', command: 'c', args: [], tags: [] }]);
    
    const startMock = vi.fn();
    vi.mocked(StdioServer).mockImplementation(function() {
        return { start: startMock } as any;
    });

    await runServe({ transport: 'stdio' });

    expect(ConfigLoader.loadConfigs).toHaveBeenCalled();
    expect(UpstreamClient).toHaveBeenCalled(); 
    expect(StdioServer).toHaveBeenCalled();
    expect(startMock).toHaveBeenCalled();
  });

  it('initializes sse server when configured', async () => {
    vi.mocked(ConfigLoader.loadConfigs).mockResolvedValue([]);
    
    vi.mocked(HonoSSEServer).mockImplementation(function() {
        return { getApp: () => ({ fetch: vi.fn() }) } as any;
    });

    await runServe({ transport: 'sse', port: 3000 });

    expect(HonoSSEServer).toHaveBeenCalled();
    expect(serve).toHaveBeenCalledWith(expect.objectContaining({ port: 3000 }));
  });
});