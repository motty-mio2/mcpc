import { z } from 'zod';

// Zod Schema for the configuration file format
// Supports both Stdio (command, args) and SSE (url)
export const ConfigSchema = z.object({
  tags: z.array(z.string()).default([]),
  mcpServers: z.record(z.string(), z.union([
    z.object({
      command: z.string(),
      args: z.array(z.string()),
      env: z.record(z.string(), z.string()).optional()
    }),
    z.object({
      url: z.string().url(),
      env: z.record(z.string(), z.string()).optional()
    })
  ]))
});

export type RawConfig = z.infer<typeof ConfigSchema>;

// Flattened configuration for internal use
export interface ServerConfig {
  id: string;
  tags: string[];
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

/**
 * Substitutes environment variables in a string.
 * Format: ${VAR_NAME}
 */
function substituteEnv(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    return process.env[varName] ?? `\${${varName}}`; // Keep original if undefined
  });
}

/**
 * Parses and validates a configuration object, performing environment variable substitution.
 * @param config The raw configuration object
 * @returns The validated configuration with env vars substituted
 */
export function parseConfig(config: unknown): RawConfig {
  const parsed = ConfigSchema.parse(config);

  // Perform substitution
  const mergedServers: RawConfig['mcpServers'] = {};

  for (const [id, server] of Object.entries(parsed.mcpServers)) {
    const newEnv: Record<string, string> = {};
    if (server.env) {
      for (const [k, v] of Object.entries(server.env)) {
        newEnv[k] = substituteEnv(v);
      }
    }

    if ('url' in server) {
      // SSE Config
      mergedServers[id] = {
        url: substituteEnv(server.url),
        env: server.env ? newEnv : undefined
      };
    } else {
      // Stdio Config
      mergedServers[id] = {
        command: substituteEnv(server.command),
        args: server.args.map(substituteEnv),
        env: server.env ? newEnv : undefined
      };
    }
  }

  return {
    ...parsed,
    mcpServers: mergedServers
  };
}