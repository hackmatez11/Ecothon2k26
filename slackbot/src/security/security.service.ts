/**
 * SecurityService — simplified for government complaint system.
 * No PHI data is stored; crypto-js dependency has been removed.
 */
export class SecurityService {
  /**
   * Validate tool payload (basic type check)
   */
  static validateToolPayload(_tool: string, payload: any): boolean {
    return payload !== null && typeof payload === 'object';
  }

  /**
   * Check role-based permissions for government officers
   */
  static hasPermission(roles: string[], requiredPermission: string): boolean {
    const rolePermissions: Record<string, string[]> = {
      officer:    ['read:complaints', 'write:updates', 'read:doc_requests'],
      supervisor: ['read:*', 'write:*'],
      admin:      ['read:*', 'write:*', 'delete:*'],
    };

    for (const role of roles) {
      const permissions = rolePermissions[role] || [];
      if (
        permissions.includes(requiredPermission) ||
        permissions.includes('read:*') ||
        permissions.includes('write:*')
      ) {
        return true;
      }
    }
    return false;
  }
}
