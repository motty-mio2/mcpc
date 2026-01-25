import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runList } from '../../src/actions/list.js';
import { ConfigLoader } from '../../src/config/loader.js';

vi.mock('../../src/config/loader.js');

describe('List Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('lists configured servers', async () => {
    vi.mocked(ConfigLoader.loadConfigs).mockResolvedValue([
        { id: 'server1', command: '', args: [], tags: ['tag1'] },
        { id: 'server2', command: '', args: [], tags: [] }
    ]);

    await runList({});

    expect(ConfigLoader.loadConfigs).toHaveBeenCalledWith(undefined);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('server1 [tag1]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('server2'));
  });

  it('handles empty config', async () => {
    vi.mocked(ConfigLoader.loadConfigs).mockResolvedValue([]);
    await runList({});
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No configured servers'));
  });
});
