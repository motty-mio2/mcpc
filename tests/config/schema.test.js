import { describe, it, expect, vi } from 'vitest';
import { ConfigSchema, parseConfig } from '../../src/config/schema.js';
describe('ConfigSchema', () => {
    it('validates a correct configuration', () => {
        const validConfig = {
            tags: ['production'],
            mcpServers: {
                server1: {
                    command: 'echo',
                    args: ['hello'],
                    env: { KEY: 'VALUE' }
                }
            }
        };
        const result = ConfigSchema.safeParse(validConfig);
        expect(result.success).toBe(true);
    });
    it('rejects invalid configuration', () => {
        const invalidConfig = {
            tags: 'not-an-array', // Invalid type
            mcpServers: {}
        };
        const result = ConfigSchema.safeParse(invalidConfig);
        expect(result.success).toBe(false);
    });
});
describe('parseConfig (Env Substitution)', () => {
    it('substitutes environment variables in command and args', () => {
        process.env.TEST_CMD = 'grep';
        process.env.TEST_ARG = 'search';
        const rawConfig = {
            tags: [],
            mcpServers: {
                s1: {
                    command: '${TEST_CMD}',
                    args: ['-r', '${TEST_ARG}', '.']
                }
            }
        };
        const parsed = parseConfig(rawConfig);
        expect(parsed.mcpServers.s1.command).toBe('grep');
        expect(parsed.mcpServers.s1.args).toEqual(['-r', 'search', '.']);
    });
    it('substitutes environment variables in env map', () => {
        process.env.API_KEY = '12345';
        const rawConfig = {
            tags: [],
            mcpServers: {
                s1: {
                    command: 'cmd',
                    args: [],
                    env: { TOKEN: '${API_KEY}' }
                }
            }
        };
        const parsed = parseConfig(rawConfig);
        expect(parsed.mcpServers.s1.env?.TOKEN).toBe('12345');
    });
    it('leaves unknown variables as is', () => {
        const rawConfig = {
            tags: [],
            mcpServers: {
                s1: {
                    command: '${UNKNOWN_VAR}',
                    args: []
                }
            }
        };
        const parsed = parseConfig(rawConfig);
        expect(parsed.mcpServers.s1.command).toBe('${UNKNOWN_VAR}');
    });
    it('handles recursive or multiple substitutions', () => {
        process.env.HOST = 'localhost';
        process.env.PORT = '8080';
        const rawConfig = {
            tags: [],
            mcpServers: {
                s1: {
                    command: 'server',
                    args: ['http://${HOST}:${PORT}/api']
                }
            }
        };
        const parsed = parseConfig(rawConfig);
        expect(parsed.mcpServers.s1.args[0]).toBe('http://localhost:8080/api');
    });
});
//# sourceMappingURL=schema.test.js.map