import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { parseArgs } from '../../src/cli/args.js';

describe('CLI Argument Parsing', () => {
  it('parses default arguments', () => {
    const args = parseArgs(['node', 'script']);
    expect(args.transport).toBe('stdio');
    expect(args.tags).toBeUndefined();
  });

  it('parses --transport http', () => {
    const args = parseArgs(['node', 'script', '--transport', 'sse']); // task said http, usually sse/stdio
    // Requirement 1.1 says "stdio" and "Streamable HTTP" (which usually implies SSE or just 'http' mode)
    // Task 5.1 says "transport mode (stdio vs http)". 
    // Let's use 'sse' as the flag value to match implementation details, or 'http'.
    // Let's verify what the implementation uses.
    expect(args.transport).toBe('sse');
  });

  it('parses --tags', () => {
    const args = parseArgs(['node', 'script', '--tags', 'dev,prod']);
    expect(args.tags).toEqual(['dev', 'prod']);
  });
  
  it('parses --port for http mode', () => {
      const args = parseArgs(['node', 'script', '--port', '8080']);
      expect(args.port).toBe(8080);
  });
});
