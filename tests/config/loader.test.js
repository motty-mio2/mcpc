import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigLoader } from '../../src/config/loader.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
// Mock fs and os
vi.mock('fs/promises');
vi.mock('os');
describe('ConfigLoader', () => {
    const mockConfigDir = '/mock/home/.config/mcpc';
    beforeEach(() => {
        vi.resetAllMocks();
        // Default XDG setup
        vi.mocked(os.homedir).mockReturnValue('/mock/home');
        process.env.XDG_CONFIG_HOME = ''; // Ensure fallback
    });
    afterEach(() => {
        delete process.env.XDG_CONFIG_HOME;
    });
    it('resolves configuration directory correctly (XDG_CONFIG_HOME)', () => {
        process.env.XDG_CONFIG_HOME = '/custom/config';
        const loader = new ConfigLoader();
        expect(loader['getConfigDir']()).toBe('/custom/config/mcpc');
    });
    it('resolves configuration directory correctly (Fallback)', () => {
        const loader = new ConfigLoader();
        expect(loader['getConfigDir']()).toBe('/mock/home/.config/mcpc');
    });
    it('loads and merges configuration files', async () => {
        const file1 = {
            tags: ['work'],
            mcpServers: {
                s1: { command: 'cmd1', args: [] }
            }
        };
        const file2 = {
            tags: ['personal'],
            mcpServers: {
                s2: { command: 'cmd2', args: [] }
            }
        };
        vi.mocked(fs.readdir).mockResolvedValue(['config1.json', 'config2.json', 'ignored.txt']);
        vi.mocked(fs.readFile).mockImplementation(async (path) => {
            if (String(path).endsWith('config1.json'))
                return JSON.stringify(file1);
            if (String(path).endsWith('config2.json'))
                return JSON.stringify(file2);
            return '';
        });
        // Mock stat to return file
        vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true });
        const result = await ConfigLoader.loadConfigs();
        expect(result).toHaveLength(2);
        expect(result.find(s => s.id === 's1')?.tags).toContain('work');
        expect(result.find(s => s.id === 's2')?.tags).toContain('personal');
    });
    it('filters servers by tag (ANY match)', async () => {
        const file1 = {
            tags: ['work', 'dev'],
            mcpServers: { s1: { command: 'c', args: [] } }
        };
        const file2 = {
            tags: ['personal'],
            mcpServers: { s2: { command: 'c', args: [] } }
        };
        vi.mocked(fs.readdir).mockResolvedValue(['f1.json', 'f2.json']);
        vi.mocked(fs.readFile).mockImplementation(async (path) => {
            if (String(path).endsWith('f1.json'))
                return JSON.stringify(file1);
            return JSON.stringify(file2);
        });
        vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true });
        // Filter for 'dev' -> should include s1, exclude s2
        const result = await ConfigLoader.loadConfigs(['dev']);
        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe('s1');
    });
    it('ignores invalid JSON files', async () => {
        vi.mocked(fs.readdir).mockResolvedValue(['bad.json']);
        vi.mocked(fs.readFile).mockResolvedValue('invalid json');
        vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true });
        // Should not throw, just log and return empty
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const result = await ConfigLoader.loadConfigs();
        expect(result).toHaveLength(0);
        expect(consoleSpy).toHaveBeenCalled();
    });
});
//# sourceMappingURL=loader.test.js.map