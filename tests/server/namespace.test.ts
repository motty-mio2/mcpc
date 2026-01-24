import { describe, it, expect } from 'vitest';
import { NamespaceUtils } from '../../src/server/namespace.js';

describe('NamespaceUtils', () => {
  it('adds prefix correctly', () => {
    expect(NamespaceUtils.addPrefix('server1', 'toolA')).toBe('server1_toolA');
  });

  it('strips prefix correctly', () => {
    const result = NamespaceUtils.stripPrefix('server1_toolA');
    expect(result).toEqual({ serverId: 'server1', name: 'toolA' });
  });

  it('handles names with multiple underscores', () => {
    // server1_my_complex_tool -> serverId: server1, name: my_complex_tool
    const result = NamespaceUtils.stripPrefix('server1_my_complex_tool');
    expect(result).toEqual({ serverId: 'server1', name: 'my_complex_tool' });
  });

  it('returns null for names without prefix separator', () => {
    // If no underscore, we can't route it (or treat as global? Requirement says prefix is mandatory)
    // Task 3.1 says "Handle edge cases".
    // If it doesn't match the pattern, maybe it's invalid.
    expect(NamespaceUtils.stripPrefix('toolA')).toBeNull();
  });

  it('handles empty server ID or name edge cases', () => {
    // _toolA -> serverId: "", name: "toolA" ? Or invalid?
    // server1_ -> serverId: "server1", name: "" ?
    // Let's assume valid ID and Name are required.
    expect(NamespaceUtils.stripPrefix('_toolA')).toBeNull();
    expect(NamespaceUtils.stripPrefix('server1_')).toBeNull();
  });
});
