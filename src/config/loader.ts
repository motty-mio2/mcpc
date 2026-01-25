import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { parseConfig, type ServerConfig } from './schema.js';

export class ConfigLoader {
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
      // If dir doesn't exist, return empty
      await fs.readdir(configDir);
    } catch (error) {
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
          let serverConfig: ServerConfig;
          
          if ('url' in server) {
             serverConfig = {
                id,
                tags: fileTags,
                url: server.url,
                ...(server.env ? { env: server.env } : {})
             };
          } else {
             serverConfig = {
                id,
                tags: fileTags,
                command: server.command,
                args: server.args,
                ...(server.env ? { env: server.env } : {})
             };
          }

          // Filter
          if (tagFilter && tagFilter.length > 0) {
            const hasMatch = tagFilter.some(t => fileTags.includes(t));
            if (!hasMatch) continue;
          }

          servers.push(serverConfig);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to load config file ${file}: ${errorMessage}`);
        // Continue to next file
      }
    }

    return servers;
  }
}