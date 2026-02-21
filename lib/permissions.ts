import type { UserRole } from './auth-context';

// Which route prefixes each role can access
const ROUTE_ACCESS: Record<UserRole, string[]> = {
  admin: ['*'],
  manager: ['/', '/revenue', '/expenses', '/odoo', '/operations/inventory', '/operations/food-cost', '/operations/drinks-cost'],
  staff: ['/operations/inventory', '/operations/food-cost', '/operations/drinks-cost'],
};

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const allowed = ROUTE_ACCESS[role];
  if (allowed.includes('*')) return true;

  return allowed.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(route + '/');
  });
}

// Sidebar nav section IDs visible to each role
export function getVisibleNavIds(role: UserRole): string[] {
  switch (role) {
    case 'admin':
      return ['overview', 'revenue', 'expenses', 'odoo', 'operations', 'admin'];
    case 'manager':
      return ['overview', 'revenue', 'expenses', 'odoo', 'operations'];
    case 'staff':
      return ['operations'];
    default:
      return [];
  }
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin';
}

// Default landing page per role
export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'admin':
    case 'manager':
      return '/';
    case 'staff':
      return '/operations/inventory';
    default:
      return '/login';
  }
}
