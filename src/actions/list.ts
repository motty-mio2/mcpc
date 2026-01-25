import { ConfigLoader } from '../config/loader.js';

export interface ListOptions {
  tags?: string[];
}

export async function runList(options: ListOptions): Promise<void> {
  const configs = await ConfigLoader.loadConfigs(options.tags);
  
  if (configs.length === 0) {
    console.log('No configured servers found.');
    return;
  }

  console.log('Configured MCP Servers:');
  for (const config of configs) {
    const tagsStr = config.tags.length > 0 ? ` [${config.tags.join(', ')}]` : '';
    console.log(`- ${config.id}${tagsStr}`);
  }
}
