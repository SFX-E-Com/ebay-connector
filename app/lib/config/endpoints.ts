// API Endpoint Permissions Configuration
// This file defines all available API endpoints and their metadata

export interface EndpointConfig {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'advanced' | 'premium';
  requiredPlan?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
}

export const AVAILABLE_ENDPOINTS: EndpointConfig[] = [
  // Core eBay API Endpoints - Orders
  {
    id: 'ebay:orders:read',
    name: 'Orders (Read)',
    description: 'View orders, fulfillment status, and order details',
    category: 'core',
    requiredPlan: 'FREE'
  },
  {
    id: 'ebay:orders:write',
    name: 'Orders (Write)',
    description: 'Ship orders, update tracking, send buyer messages',
    category: 'core',
    requiredPlan: 'FREE'
  },
  // Inventory & Listings
  {
    id: 'ebay:inventory:read',
    name: 'Inventory (Read)',
    description: 'View inventory items, stock levels, and SKUs',
    category: 'core',
    requiredPlan: 'FREE'
  },
  {
    id: 'ebay:inventory:write',
    name: 'Inventory (Write)',
    description: 'Create and update inventory items',
    category: 'core',
    requiredPlan: 'FREE'
  },
  {
    id: 'ebay:listings:read',
    name: 'Listings (Read)',
    description: 'View active listings and offers',
    category: 'core',
    requiredPlan: 'FREE'
  },
  {
    id: 'ebay:listings:write',
    name: 'Listings (Write)',
    description: 'Create, update, and end listings',
    category: 'core',
    requiredPlan: 'FREE'
  },
  // Trading API
  {
    id: 'ebay:trading:read',
    name: 'Trading API (Read)',
    description: 'View items via legacy Trading API',
    category: 'core',
    requiredPlan: 'FREE'
  },
  {
    id: 'ebay:trading:write',
    name: 'Trading API (Write)',
    description: 'Create and manage listings via Trading API',
    category: 'core',
    requiredPlan: 'FREE'
  },
  // Returns & Cancellations
  {
    id: 'ebay:returns:read',
    name: 'Returns (Read)',
    description: 'View return requests and status',
    category: 'core',
    requiredPlan: 'FREE'
  },
  {
    id: 'ebay:returns:write',
    name: 'Returns (Write)',
    description: 'Accept, decline, or process returns',
    category: 'core',
    requiredPlan: 'FREE'
  },
  {
    id: 'ebay:cancellations:read',
    name: 'Cancellations (Read)',
    description: 'View cancellation requests',
    category: 'core',
    requiredPlan: 'FREE'
  },
  {
    id: 'ebay:cancellations:write',
    name: 'Cancellations (Write)',
    description: 'Approve or reject cancellation requests',
    category: 'core',
    requiredPlan: 'FREE'
  },
  // Messages & Inquiries
  {
    id: 'ebay:inquiries:read',
    name: 'Inquiries (Read)',
    description: 'View buyer inquiries and messages',
    category: 'core',
    requiredPlan: 'FREE'
  },
  {
    id: 'ebay:inquiries:write',
    name: 'Inquiries (Write)',
    description: 'Respond to buyer inquiries',
    category: 'core',
    requiredPlan: 'FREE'
  },
  // Account & Settings
  {
    id: 'ebay:account:read',
    name: 'Account (Read)',
    description: 'View account settings and seller policies',
    category: 'core',
    requiredPlan: 'FREE'
  },
  // Advanced Features
  {
    id: 'ebay:finances:read',
    name: 'Finances (Read)',
    description: 'View payment and financial data',
    category: 'advanced',
    requiredPlan: 'BASIC'
  },
  {
    id: 'ebay:marketing:read',
    name: 'Marketing (Read)',
    description: 'View marketing campaigns and promotions',
    category: 'advanced',
    requiredPlan: 'BASIC'
  },
  {
    id: 'ebay:marketing:write',
    name: 'Marketing (Write)',
    description: 'Manage marketing campaigns',
    category: 'advanced',
    requiredPlan: 'BASIC'
  },
  // Premium Features
  {
    id: 'ebay:analytics:read',
    name: 'Analytics (Read)',
    description: 'View selling performance and insights',
    category: 'premium',
    requiredPlan: 'PRO'
  }
];

// Helper functions for working with endpoints
export const getEndpointById = (id: string): EndpointConfig | undefined => {
  return AVAILABLE_ENDPOINTS.find(endpoint => endpoint.id === id);
};

export const getEndpointsByCategory = (category: 'core' | 'advanced' | 'premium'): EndpointConfig[] => {
  return AVAILABLE_ENDPOINTS.filter(endpoint => endpoint.category === category);
};

export const getEndpointsForPlan = (plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'): EndpointConfig[] => {
  const planHierarchy = { 'FREE': 0, 'BASIC': 1, 'PRO': 2, 'ENTERPRISE': 3 };
  const userPlanLevel = planHierarchy[plan];

  return AVAILABLE_ENDPOINTS.filter(endpoint => {
    const requiredLevel = planHierarchy[endpoint.requiredPlan || 'FREE'];
    return userPlanLevel >= requiredLevel;
  });
};

export const getEndpointIds = (): string[] => {
  return AVAILABLE_ENDPOINTS.map(endpoint => endpoint.id);
};

// Default endpoints for new tokens
export const DEFAULT_ENDPOINTS = [
  'ebay:orders:read',
  'ebay:orders:write',
  'ebay:inventory:read',
  'ebay:inventory:write',
  'ebay:listings:read',
  'ebay:listings:write',
  'ebay:trading:read',
  'ebay:trading:write',
  'ebay:returns:read',
  'ebay:cancellations:read',
  'ebay:inquiries:read',
  'ebay:account:read'
];

// Rate limiting tiers based on endpoint categories
export const RATE_LIMITS = {
  core: 1000,      // requests per hour
  advanced: 500,   // requests per hour
  premium: 200     // requests per hour
};