// Centralised permission catalog. Each dashboard action maps to a
// permission key; each role has a set. Adding a new permission means
// updating exactly this file — endpoints and UI then reference the key
// instead of role names directly, so the rules stay coherent.
//
// Role grants are deliberately conservative for `staff` — they can run
// daily operations (process orders, edit products, moderate reviews,
// reply to customers) but can't issue refunds, delete records, manage
// the team, or change site settings. Admins have everything. Drivers
// see only the delivery queue and have no permissions in this catalog
// (their gate is path-based in the dashboard layout).
import type { AdminRole } from './admin-auth'

export type Permission =
  // Orders
  | 'orders.view'
  | 'orders.edit'        // change status, edit address, edit items
  | 'orders.refund'      // issue Stripe / COD refunds — money-moving
  | 'orders.cancel'
  // Products + catalog
  | 'products.view'
  | 'products.edit'      // create + update existing
  | 'products.delete'    // hard delete (vs deactivate)
  | 'categories.edit'
  | 'inventory.adjust'   // stock-history manual adjustments
  // Customers
  | 'customers.view'
  | 'customers.message'  // send one-off email/SMS
  | 'customers.delete'   // GDPR deletion
  | 'customers.notes'    // admin notes on a customer
  // Reviews
  | 'reviews.moderate'
  | 'reviews.delete'
  | 'reviews.reply'
  // Marketing
  | 'broadcasts.send'
  // Operations
  | 'pick.view'          // picker queue
  | 'deliveries.view'    // delivery queue (drivers get this via path gate)
  | 'packing_slips.view'
  // Configuration
  | 'team.manage'
  | 'settings.edit'
  | 'delivery_slots.manage'
  | 'integrations.manage'
  | 'accounting.export'
  // Other
  | 'audit_log.view'
  | 'analytics.view'

const ADMIN_PERMISSIONS: Permission[] = [
  'orders.view', 'orders.edit', 'orders.refund', 'orders.cancel',
  'products.view', 'products.edit', 'products.delete',
  'categories.edit', 'inventory.adjust',
  'customers.view', 'customers.message', 'customers.delete', 'customers.notes',
  'reviews.moderate', 'reviews.delete', 'reviews.reply',
  'broadcasts.send',
  'pick.view', 'deliveries.view', 'packing_slips.view',
  'team.manage', 'settings.edit', 'delivery_slots.manage',
  'integrations.manage', 'accounting.export',
  'audit_log.view', 'analytics.view',
]

const STAFF_PERMISSIONS: Permission[] = [
  'orders.view', 'orders.edit', 'orders.cancel',
  'products.view', 'products.edit',
  'categories.edit', 'inventory.adjust',
  'customers.view', 'customers.message', 'customers.notes',
  'reviews.moderate', 'reviews.reply',
  'pick.view', 'deliveries.view', 'packing_slips.view',
  'audit_log.view', 'analytics.view',
]

// Drivers don't get dashboard-wide permissions — the layout gates them
// to /dashboard/deliveries by path. Listed here so the matrix UI is
// honest about what they can/can't do.
const DRIVER_PERMISSIONS: Permission[] = ['deliveries.view']

export const PERMISSIONS_BY_ROLE: Record<AdminRole, Set<Permission>> = {
  // super_admin has the same catalog permissions as admin; its extra power
  // (managing other admins/super_admins) is enforced directly in the team route.
  super_admin: new Set(ADMIN_PERMISSIONS),
  admin: new Set(ADMIN_PERMISSIONS),
  staff: new Set(STAFF_PERMISSIONS),
  driver: new Set(DRIVER_PERMISSIONS),
}

export function hasPermission(role: AdminRole | undefined, permission: Permission): boolean {
  if (!role) return false
  return PERMISSIONS_BY_ROLE[role]?.has(permission) ?? false
}

// Human-readable groupings for the matrix UI on /dashboard/team.
export const PERMISSION_GROUPS: Array<{
  title: string
  items: Array<{ key: Permission; label: string; hint?: string }>
}> = [
  {
    title: 'Orders',
    items: [
      { key: 'orders.view', label: 'View orders' },
      { key: 'orders.edit', label: 'Edit orders', hint: 'Status, address, items' },
      { key: 'orders.cancel', label: 'Cancel orders' },
      { key: 'orders.refund', label: 'Issue refunds', hint: 'Stripe + COD — money-moving' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { key: 'products.view', label: 'View products' },
      { key: 'products.edit', label: 'Edit products', hint: 'Create + update' },
      { key: 'products.delete', label: 'Delete products' },
      { key: 'categories.edit', label: 'Edit categories' },
      { key: 'inventory.adjust', label: 'Adjust stock' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { key: 'customers.view', label: 'View customers' },
      { key: 'customers.message', label: 'Message customers' },
      { key: 'customers.notes', label: 'Edit customer notes' },
      { key: 'customers.delete', label: 'Delete customers', hint: 'GDPR removal' },
    ],
  },
  {
    title: 'Reviews',
    items: [
      { key: 'reviews.moderate', label: 'Approve / reject' },
      { key: 'reviews.reply', label: 'Reply publicly' },
      { key: 'reviews.delete', label: 'Delete reviews' },
    ],
  },
  {
    title: 'Marketing & Operations',
    items: [
      { key: 'broadcasts.send', label: 'Send broadcasts', hint: 'Email + SMS to all customers' },
      { key: 'pick.view', label: 'Picker queue' },
      { key: 'deliveries.view', label: 'Delivery queue' },
      { key: 'packing_slips.view', label: 'Print packing slips' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { key: 'team.manage', label: 'Manage team' },
      { key: 'settings.edit', label: 'Edit store settings' },
      { key: 'delivery_slots.manage', label: 'Manage delivery slots' },
      { key: 'integrations.manage', label: 'Integrations (Stripe, Resend, Twilio)' },
      { key: 'accounting.export', label: 'Accounting exports' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { key: 'audit_log.view', label: 'Audit log' },
      { key: 'analytics.view', label: 'Search analytics' },
    ],
  },
]
