// Canonical sample data used by the in-app "Load sample" menus.
// The same content is written to /public/samples and /samples as .json files
// so the deliverable ships ready-to-open test files too.

const userA = {
  id: 1042,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  active: true,
  roles: ['admin', 'editor'],
  profile: { age: 28, country: 'UK', newsletter: true },
  lastLogin: '2026-05-01T09:30:00Z',
};

const userB = {
  id: 1042,
  name: 'Ada Lovelace',
  email: 'ada.lovelace@example.com',
  active: false,
  roles: ['admin', 'viewer'],
  profile: { age: 29, country: 'UK', timezone: 'Europe/London' },
  lastLogin: '2026-05-18T17:05:00Z',
};

const cartA = {
  cartId: 'CART-9001',
  currency: 'USD',
  items: [
    { sku: 'A-100', name: 'Mechanical Keyboard', qty: 1, price: 89.99 },
    { sku: 'B-220', name: 'USB-C Cable', qty: 2, price: 9.5 },
    { sku: 'C-330', name: 'Laptop Stand', qty: 1, price: 39.0 },
  ],
  total: 147.99,
};

const cartB = {
  cartId: 'CART-9001',
  currency: 'USD',
  items: [
    { sku: 'A-100', name: 'Mechanical Keyboard', qty: 2, price: 89.99 },
    { sku: 'B-220', name: 'USB-C Cable', qty: 2, price: 8.75 },
    { sku: 'D-440', name: 'Wireless Mouse', qty: 1, price: 24.99 },
  ],
  total: 213.72,
};

// Five levels deep: company > department > team > member > skills
const orgA = {
  company: {
    name: 'Northwind R&D',
    department: {
      name: 'Engineering',
      team: {
        name: 'Platform',
        lead: {
          name: 'Grace Hopper',
          contact: { email: 'grace@northwind.dev', phone: '+1-202-555-0100' },
          skills: ['Go', 'Kubernetes', 'gRPC'],
        },
        headcount: 8,
      },
    },
    founded: 2019,
  },
};

const orgB = {
  company: {
    name: 'Northwind R&D',
    department: {
      name: 'Engineering',
      team: {
        name: 'Platform',
        lead: {
          name: 'Grace Hopper',
          contact: { email: 'grace.hopper@northwind.dev', phone: '+1-202-555-0199' },
          skills: ['Go', 'Kubernetes', 'Rust'],
        },
        headcount: 11,
      },
    },
    founded: 2019,
    remoteFriendly: true,
  },
};

const formatValid = {
  service: 'orders-api',
  version: '2.4.1',
  enabled: true,
  replicas: 3,
  endpoints: ['/health', '/orders', '/orders/{id}'],
  limits: { rps: 500, burst: 1000, timeoutMs: 2500 },
  tags: { team: 'commerce', tier: 'gold', regions: ['us-east', 'eu-west'] },
  metadata: null,
};

// Intentionally broken JSON for demonstrating validation errors:
// trailing comma + an unquoted property name.
const formatInvalid = `{
  "service": "orders-api",
  "version": "2.4.1",
  "enabled": true,
  "replicas": 3,
  endpoints: ["/health", "/orders"],
  "limits": { "rps": 500, "burst": 1000, },
}`;

const pretty = (v) => JSON.stringify(v, null, 2);

export const COMPARE_SAMPLES = [
  {
    id: 'user',
    label: 'User profile (object changes)',
    description: 'Changed values plus an added/removed key.',
    leftName: 'user-v1.json',
    rightName: 'user-v2.json',
    left: pretty(userA),
    right: pretty(userB),
  },
  {
    id: 'cart',
    label: 'Shopping cart (array by index)',
    description: 'Array elements compared position-by-position.',
    leftName: 'cart-v1.json',
    rightName: 'cart-v2.json',
    left: pretty(cartA),
    right: pretty(cartB),
  },
  {
    id: 'org',
    label: 'Org config (5 levels deep)',
    description: 'Deeply nested object differences.',
    leftName: 'org-v1.json',
    rightName: 'org-v2.json',
    left: pretty(orgA),
    right: pretty(orgB),
  },
];

export const FORMAT_SAMPLES = [
  { id: 'valid', label: 'Valid service config', value: pretty(formatValid) },
  { id: 'invalid', label: 'Invalid JSON (see errors)', value: formatInvalid },
];
