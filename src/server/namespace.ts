export class NamespaceUtils {
  static addPrefix(serverId: string, name: string): string {
    return `${serverId}_${name}`;
  }

  static stripPrefix(prefixedName: string): { serverId: string; name: string } | null {
    const separatorIndex = prefixedName.indexOf('_');
    if (separatorIndex === -1) {
      return null;
    }

    const serverId = prefixedName.substring(0, separatorIndex);
    const name = prefixedName.substring(separatorIndex + 1);

    if (!serverId || !name) {
      return null;
    }

    return { serverId, name };
  }
}
