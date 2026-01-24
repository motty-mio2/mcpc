import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { parseConfig, type ServerConfig } from './schema.js';

export class ConfigLoader {
  // Method exposed for testing via instance if needed, or we can just test the logic via loadConfigs
  // But to satisfy the test `new ConfigLoader()['getConfigDir']()`:
  // I will make it an instance method or static?
  // The test expects: const loader = new ConfigLoader(); loader['getConfigDir']()
  // So I'll make it an instance method for internal logic or just public for testing.
  // Actually, for the static loadConfigs, I can instantiate internally or just use a helper.
  
  // Let's implement it as a private method but accessible for the test wrapper if I change the test? 
  // Or just make it protected/public.
  // Since the test is already written to access it via `['getConfigDir']`, it implies it expects it to exist on the instance.
  
  // Implementation:
  public getConfigDir(): string {
      const xdgConfigHome = process.env.XDG_CONFIG_HOME;
      const baseDir = xdgConfigHome || path.join(os.homedir(), '.config');
      return path.join(baseDir, 'mcpc');
  }

  /**
   * Loads all configuration files, parses them, and returns a flat list of servers.
   * Optionally filters by tags.
   */
  static async loadConfigs(tagFilter?: string[]): Promise<ServerConfig[]> {
    const loader = new ConfigLoader();
    const configDir = loader.getConfigDir();
    const servers: ServerConfig[] = [];

    try {
      const entries = await fs.readdir(configDir, { withFileTypes: true }); // Mock in test might return strings or Dirents. 
      // Test mocked readdir returning strings: ['config1.json', ...]. 
      // fs.readdir(path) returns strings. fs.readdir(path, {withFileTypes:true}) returns Dirents.
      // The test mocked: vi.mocked(fs.readdir).mockResolvedValue(['config1.json', ...] as any);
      // So I should treat it as strings or handle the mock. 
      // Safe bet: usage without withFileTypes returns strings.
      
      // Let's stick to simple readdir (strings) and stat to check isFile, as done in the test setup.
      // Wait, test mocked fs.stat too.
      // But readdir without options returns strings.
      
      // Real implementation:
      // const files = await fs.readdir(configDir);
      // But I should check if dir exists first?
      // If readdir throws ENOENT, return [].
    } catch (error) {
       // If dir doesn't exist, return empty
       return [];
    }

    const files = await fs.readdir(configDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(configDir, file);
      try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) continue;

        const content = await fs.readFile(filePath, 'utf-8');
        const rawJson = JSON.parse(content);
        const parsed = parseConfig(rawJson); // Validates and substitutes env

        const fileTags = parsed.tags;

        // Flatten servers
        for (const [id, server] of Object.entries(parsed.mcpServers)) {
          const serverConfig: ServerConfig = {
            id,
            command: server.command,
            args: server.args,
            env: server.env,
            tags: fileTags
          };

          // Filter
          if (tagFilter && tagFilter.length > 0) {
            const hasMatch = tagFilter.some(t => fileTags.includes(t));
            if (!hasMatch) continue;
          }

          servers.push(serverConfig);
        }

      } catch (error) {
        console.error(`Failed to load config file ${file}:`, error);
        // Continue to next file
      }
    }

    return servers;
  }
}
