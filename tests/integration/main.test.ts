import { describe, it, expect, vi, beforeEach } from 'vitest';
import { main } from '../../src/index.js';
import { ConfigLoader } from '../../src/config/loader.js';
import { parseArgs } from '../../src/cli/args.js';
import { UpstreamClient } from '../../src/client/upstream.js';
import { StdioServer } from '../../src/server/stdio.js';
import { HonoSSEServer } from '../../src/server/sse.js';
import { serve } from '@hono/node-server';

// Mock everything
vi.mock('../../src/config/loader.js');
vi.mock('../../src/cli/args.js');
vi.mock('../../src/client/upstream.js');
vi.mock('../../src/server/stdio.js');
vi.mock('../../src/server/sse.js');
vi.mock('@hono/node-server');

describe('Main Entry Point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('initializes stdio server by default', async () => {
    vi.mocked(parseArgs).mockReturnValue({ transport: 'stdio' });
    vi.mocked(ConfigLoader.loadConfigs).mockResolvedValue([{ id: 's1', command: 'c', args: [], tags: [] }]);
    
    // Mock StdioServer instance
    const startMock = vi.fn();
    // When new StdioServer() is called, return an object with start() method
    vi.mocked(StdioServer).mockImplementation(function() {
        return { start: startMock } as any;
    });

    await main();

    expect(ConfigLoader.loadConfigs).toHaveBeenCalled();
    expect(UpstreamClient).toHaveBeenCalled(); // connecting to upstream
    expect(StdioServer).toHaveBeenCalled();
    expect(startMock).toHaveBeenCalled();
  });

  it('initializes sse server when configured', async () => {
    vi.mocked(parseArgs).mockReturnValue({ transport: 'sse', port: 3000 });
    vi.mocked(ConfigLoader.loadConfigs).mockResolvedValue([]);
    
    // Mock HonoSSEServer and serve
    vi.mocked(HonoSSEServer).mockImplementation(function() {
        return { getApp: () => ({ fetch: vi.fn() }) } as any;
    });

    await main();

    expect(HonoSSEServer).toHaveBeenCalled();
    expect(serve).toHaveBeenCalledWith(expect.objectContaining({ port: 3000 }));
  });
});
