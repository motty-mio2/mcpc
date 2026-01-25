import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCli } from '../../src/cli/runner.js';
import { runServe } from '../../src/actions/serve.js';
import { runList } from '../../src/actions/list.js';

vi.mock('../../src/actions/serve.js');
vi.mock('../../src/actions/list.js');

describe('CLI Runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes list action by default', async () => {
    await runCli(['node', 'mcpc']);
    expect(runList).toHaveBeenCalledWith({ tags: undefined });
  });

  it('executes list action with tags', async () => {
    await runCli(['node', 'mcpc', '--tags', 't1,t2']);
    expect(runList).toHaveBeenCalledWith({ tags: ['t1', 't2'] });
  });

  it('executes serve action', async () => {
    await runCli(['node', 'mcpc', 'serve']);
    expect(runServe).toHaveBeenCalledWith(expect.objectContaining({ transport: 'stdio' })); 
  });

  it('executes serve action with options', async () => {
    await runCli(['node', 'mcpc', 'serve', '--transport', 'sse', '--port', '4000', '--tags', 't1']);
    expect(runServe).toHaveBeenCalledWith({ transport: 'sse', port: 4000, tags: ['t1'] });
  });
});
