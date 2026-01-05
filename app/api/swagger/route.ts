import { NextResponse } from 'next/server';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'eBay Connector API',
    version: '1.0.0',
    description: 'Complete API documentation for eBay Connector application - Trading Listing API for creating, updating, relisting, and managing eBay listings',
    contact: {
      name: 'SFX E-commerce',
      email: 'support@sfx-ecommerce.com'
    }
  },
  servers: [
    {
      url: 'https://ebay-connector-187959688255.europe-west1.run.app',
      description: 'Production (Cloud Run)'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development'
    }
  ],
  tags: [
    { name: 'Orders', description: 'Order management, fulfillment & shipping' },
    { name: 'Returns', description: 'Return requests management' },
    { name: 'Cancellations', description: 'Order cancellation handling' },
    { name: 'API Tokens', description: 'API token management for authentication' },
    { name: 'eBay Accounts', description: 'Connected eBay account management' },
    { name: 'Inventory', description: 'Inventory API - Modern REST-based inventory management' },
    { name: 'Offers', description: 'Offer management - Create and publish listings via Inventory API' },
    { name: 'Messages', description: 'eBay messaging and inquiries' },
    { name: 'Trading Listing', description: 'eBay Trading API listing operations - Create, update, relist, and manage listings' },
    { name: 'Legacy Listings', description: 'Trading API legacy listings' },
    { name: 'Migration', description: 'Migration tools from Trading API to Inventory API' }
  ],
  paths: {
    // ============================================
    // Orders API
    // ============================================
    '/api/ebay/{accountId}/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders',
        description: 'Get orders for an eBay account with optional filtering by status, date range, and pagination.',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' }, description: 'eBay account ID' },
          { name: 'orderIds', in: 'query', schema: { type: 'string' }, description: 'Comma-separated order IDs to fetch specific orders' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'FULFILLED'] }, description: 'Filter by fulfillment status' },
          { name: 'creationDateStart', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Filter orders created after this date' },
          { name: 'creationDateEnd', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Filter orders created before this date' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 }, description: 'Max results per page' },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Pagination offset' }
        ],
        responses: {
          '200': {
            description: 'Orders retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        orders: { type: 'array', items: { type: 'object' } },
                        total: { type: 'integer', example: 42 },
                        limit: { type: 'integer', example: 50 },
                        offset: { type: 'integer', example: 0 },
                        hasMore: { type: 'boolean', example: false }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/ebay/{accountId}/orders/pending': {
      get: {
        tags: ['Orders'],
        summary: 'Get pending orders',
        description: 'Get orders that are awaiting fulfillment (NOT_STARTED status)',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
        ],
        responses: {
          '200': { description: 'Pending orders retrieved' }
        }
      }
    },
    '/api/ebay/{accountId}/orders/{orderId}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order details',
        description: 'Get detailed information about a specific order',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' }, description: 'eBay Order ID' }
        ],
        responses: {
          '200': { description: 'Order details retrieved' },
          '404': { description: 'Order not found' }
        }
      }
    },
    '/api/ebay/{accountId}/orders/{orderId}/ship': {
      post: {
        tags: ['Orders'],
        summary: 'Ship order',
        description: 'Create shipping fulfillment for an order. Marks order as shipped with tracking info.',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['trackingNumber', 'carrierCode'],
                properties: {
                  trackingNumber: { type: 'string', description: 'Tracking number', example: 'JJD0001234567890' },
                  carrierCode: { type: 'string', description: 'Shipping carrier', enum: ['DHL', 'DPD', 'GLS', 'HERMES', 'UPS', 'FEDEX', 'DHL_EXPRESS', 'DEUTSCHE_POST'], example: 'DHL' },
                  shippedDate: { type: 'string', format: 'date-time', description: 'Ship date (defaults to now)' },
                  lineItems: {
                    type: 'array',
                    description: 'Optional: Ship specific line items only',
                    items: {
                      type: 'object',
                      properties: {
                        lineItemId: { type: 'string' },
                        quantity: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Shipping fulfillment created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Shipping fulfillment created successfully' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          },
          '400': { description: 'Missing tracking number or carrier code' }
        }
      }
    },
    '/api/ebay/{accountId}/orders/{orderId}/messages': {
      post: {
        tags: ['Orders'],
        summary: 'Send order message',
        description: 'Send a message to the buyer for this order',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', description: 'Message text to send to buyer' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Message sent successfully' }
        }
      }
    },

    // ============================================
    // Returns API
    // ============================================
    '/api/ebay/{accountId}/returns': {
      get: {
        tags: ['Returns'],
        summary: 'List returns',
        description: 'Search return requests for an eBay account',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'state', in: 'query', schema: { type: 'string', enum: ['RETURN_REQUESTED', 'RETURN_ACCEPTED', 'RETURN_RECEIVED', 'RETURN_CLOSED', 'REFUND_ISSUED'] }, description: 'Filter by return state' },
          { name: 'creationDateStart', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'creationDateEnd', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: {
          '200': {
            description: 'Returns retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        returns: { type: 'array', items: { type: 'object' } },
                        total: { type: 'integer' },
                        limit: { type: 'integer' },
                        offset: { type: 'integer' },
                        hasMore: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/ebay/{accountId}/returns/{returnId}': {
      get: {
        tags: ['Returns'],
        summary: 'Get return details',
        description: 'Get detailed information about a specific return request',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'returnId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Return details retrieved' },
          '404': { description: 'Return not found' }
        }
      }
    },

    // ============================================
    // Cancellations API
    // ============================================
    '/api/ebay/{accountId}/cancellations': {
      get: {
        tags: ['Cancellations'],
        summary: 'List cancellations',
        description: 'Get order cancellation requests',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: {
          '200': { description: 'Cancellations retrieved' }
        }
      }
    },
    '/api/ebay/{accountId}/cancellations/check-eligibility': {
      post: {
        tags: ['Cancellations'],
        summary: 'Check cancellation eligibility',
        description: 'Check if an order is eligible for cancellation',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId'],
                properties: {
                  orderId: { type: 'string', description: 'Order ID to check' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Eligibility status returned' }
        }
      }
    },

    // ============================================
    // API Tokens
    // ============================================
    '/api/tokens': {
      get: {
        tags: ['API Tokens'],
        summary: 'List API tokens',
        description: 'Get all API tokens for the authenticated user. Token strings are masked for security.',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'all'], default: 'all' }, description: 'Filter by token status' }
        ],
        responses: {
          '200': {
            description: 'Tokens retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          token: { type: 'string', description: 'Masked token (first 12 + last 4 chars)' },
                          permissions: {
                            type: 'object',
                            properties: {
                              endpoints: { type: 'array', items: { type: 'string' } },
                              rateLimit: { type: 'integer' },
                              ebayAccountIds: { type: 'array', items: { type: 'string' } }
                            }
                          },
                          isActive: { type: 'boolean' },
                          lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
                          expiresAt: { type: 'string', format: 'date-time', nullable: true },
                          createdAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        security: []
      },
      post: {
        tags: ['API Tokens'],
        summary: 'Create API token',
        description: 'Create a new API token. The full token is only shown once in the response!',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', maxLength: 100, description: 'Token name', example: 'Production API Token' },
                  permissions: {
                    type: 'object',
                    properties: {
                      endpoints: { type: 'array', items: { type: 'string' }, description: 'Allowed API endpoints' },
                      rateLimit: { type: 'integer', default: 1000, description: 'Requests per hour' },
                      ebayAccountIds: { type: 'array', items: { type: 'string' }, description: 'Restrict to specific eBay accounts (empty = all)' }
                    }
                  },
                  expiresAt: { type: 'string', format: 'date-time', description: 'Optional expiration date' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Token created - SAVE THE TOKEN NOW!',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        token: { type: 'string', description: 'Full token - only shown once!' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': { description: 'Invalid name or token limit reached' }
        },
        security: []
      }
    },
    '/api/tokens/{id}': {
      get: {
        tags: ['API Tokens'],
        summary: 'Get token details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Token details' } },
        security: []
      },
      put: {
        tags: ['API Tokens'],
        summary: 'Update token',
        description: 'Update token name, permissions, or expiration',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  permissions: { type: 'object' },
                  expiresAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Token updated' } },
        security: []
      },
      delete: {
        tags: ['API Tokens'],
        summary: 'Delete token',
        description: 'Soft-delete an API token (marks as deleted)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Token deleted' } },
        security: []
      }
    },
    '/api/tokens/{id}/status': {
      patch: {
        tags: ['API Tokens'],
        summary: 'Activate/Deactivate token',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: {
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Status updated' } },
        security: []
      }
    },

    // ============================================
    // eBay Accounts
    // ============================================
    '/api/ebay-accounts': {
      get: {
        tags: ['eBay Accounts'],
        summary: 'List eBay accounts',
        description: 'Get all connected eBay accounts for the authenticated user',
        responses: {
          '200': {
            description: 'Accounts retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          ebayUserId: { type: 'string' },
                          ebayUsername: { type: 'string' },
                          friendlyName: { type: 'string' },
                          status: { type: 'string', enum: ['active', 'disabled', 'inactive'] },
                          environment: { type: 'string', enum: ['sandbox', 'production'] },
                          scopes: { type: 'array', items: { type: 'string' } },
                          tags: { type: 'array', items: { type: 'string' } },
                          expiresAt: { type: 'string', format: 'date-time' },
                          lastUsedAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        security: []
      },
      post: {
        tags: ['eBay Accounts'],
        summary: 'Create eBay account placeholder',
        description: 'Create a placeholder account to initiate OAuth connection',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  friendlyName: { type: 'string', example: 'My eBay Store' },
                  selectedScopes: { type: 'array', items: { type: 'string' } },
                  tags: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Account placeholder created' } },
        security: []
      }
    },
    '/api/ebay-accounts/{id}': {
      get: {
        tags: ['eBay Accounts'],
        summary: 'Get account details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Account details' } },
        security: []
      },
      put: {
        tags: ['eBay Accounts'],
        summary: 'Update account',
        description: 'Update friendly name, tags, or status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  friendlyName: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  status: { type: 'string', enum: ['active', 'disabled'] }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Account updated' } },
        security: []
      },
      delete: {
        tags: ['eBay Accounts'],
        summary: 'Delete account',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Account deleted' } },
        security: []
      }
    },

    // ============================================
    // Inventory API
    // ============================================
    '/api/ebay/{accountId}/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'List inventory items',
        description: 'Get inventory items using the modern Inventory API',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 25, maximum: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: { '200': { description: 'Inventory items retrieved' } }
      },
      post: {
        tags: ['Inventory'],
        summary: 'Create inventory item',
        description: 'Create a new inventory item (SKU-based)',
        parameters: [{ name: 'accountId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sku', 'product', 'availability'],
                properties: {
                  sku: { type: 'string', example: 'PROD-001' },
                  product: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      imageUrls: { type: 'array', items: { type: 'string' } },
                      aspects: { type: 'object' }
                    }
                  },
                  availability: {
                    type: 'object',
                    properties: {
                      shipToLocationAvailability: {
                        type: 'object',
                        properties: {
                          quantity: { type: 'integer' }
                        }
                      }
                    }
                  },
                  condition: { type: 'string', enum: ['NEW', 'LIKE_NEW', 'NEW_OTHER', 'NEW_WITH_DEFECTS', 'MANUFACTURER_REFURBISHED', 'CERTIFIED_REFURBISHED', 'EXCELLENT_REFURBISHED', 'VERY_GOOD_REFURBISHED', 'GOOD_REFURBISHED', 'SELLER_REFURBISHED', 'USED_EXCELLENT', 'USED_VERY_GOOD', 'USED_GOOD', 'USED_ACCEPTABLE', 'FOR_PARTS_OR_NOT_WORKING'] }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Inventory item created' } }
      }
    },
    '/api/ebay/{accountId}/inventory/{sku}': {
      get: {
        tags: ['Inventory'],
        summary: 'Get inventory item by SKU',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'sku', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Inventory item details' }, '404': { description: 'Item not found' } }
      },
      put: {
        tags: ['Inventory'],
        summary: 'Update inventory item',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'sku', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Item updated' } }
      },
      delete: {
        tags: ['Inventory'],
        summary: 'Delete inventory item',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'sku', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Item deleted' } }
      }
    },

    // ============================================
    // Offers API
    // ============================================
    '/api/ebay/{accountId}/offers': {
      get: {
        tags: ['Offers'],
        summary: 'List offers',
        description: 'Get all offers for inventory items',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'sku', in: 'query', schema: { type: 'string' }, description: 'Filter by SKU' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 25 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: { '200': { description: 'Offers retrieved' } }
      },
      post: {
        tags: ['Offers'],
        summary: 'Create offer',
        description: 'Create an offer for an inventory item (unpublished listing)',
        parameters: [{ name: 'accountId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sku', 'marketplaceId', 'format', 'pricingSummary', 'categoryId'],
                properties: {
                  sku: { type: 'string' },
                  marketplaceId: { type: 'string', enum: ['EBAY_US', 'EBAY_DE', 'EBAY_UK', 'EBAY_AU', 'EBAY_CA', 'EBAY_FR', 'EBAY_IT', 'EBAY_ES'] },
                  format: { type: 'string', enum: ['FIXED_PRICE', 'AUCTION'] },
                  pricingSummary: {
                    type: 'object',
                    properties: {
                      price: {
                        type: 'object',
                        properties: {
                          value: { type: 'string', example: '99.99' },
                          currency: { type: 'string', example: 'EUR' }
                        }
                      }
                    }
                  },
                  categoryId: { type: 'string', example: '139973' },
                  listingDuration: { type: 'string', default: 'GTC' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Offer created (not yet published)' } }
      }
    },
    '/api/ebay/{accountId}/offers/{offerId}': {
      get: {
        tags: ['Offers'],
        summary: 'Get offer details',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'offerId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Offer details' } }
      },
      put: {
        tags: ['Offers'],
        summary: 'Update offer',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'offerId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Offer updated' } }
      },
      delete: {
        tags: ['Offers'],
        summary: 'Delete/Withdraw offer',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'offerId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Offer deleted' } }
      }
    },
    '/api/ebay/{accountId}/offers/{offerId}/publish': {
      post: {
        tags: ['Offers'],
        summary: 'Publish offer',
        description: 'Publish an unpublished offer to create an active listing',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'offerId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Listing created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        listingId: { type: 'string', description: 'eBay ItemID' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/ebay/{accountId}/offers/{offerId}/withdraw': {
      post: {
        tags: ['Offers'],
        summary: 'Withdraw offer',
        description: 'End a published listing',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'offerId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Listing ended' } }
      }
    },

    // ============================================
    // Messages & Inquiries
    // ============================================
    '/api/ebay/{accountId}/messages': {
      get: {
        tags: ['Messages'],
        summary: 'List messages',
        description: 'Get buyer/seller messages',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'folder', in: 'query', schema: { type: 'string', enum: ['INBOX', 'SENT'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
        ],
        responses: { '200': { description: 'Messages retrieved' } }
      }
    },
    '/api/ebay/{accountId}/messages/{messageId}': {
      get: {
        tags: ['Messages'],
        summary: 'Get message details',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'messageId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Message details' } }
      }
    },
    '/api/ebay/{accountId}/inquiries': {
      get: {
        tags: ['Messages'],
        summary: 'List inquiries',
        description: 'Get buyer inquiries (Item Not Received, etc.)',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
        ],
        responses: { '200': { description: 'Inquiries retrieved' } }
      }
    },
    '/api/ebay/{accountId}/inquiries/{inquiryId}': {
      get: {
        tags: ['Messages'],
        summary: 'Get inquiry details',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'inquiryId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Inquiry details' } }
      },
      post: {
        tags: ['Messages'],
        summary: 'Respond to inquiry',
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'inquiryId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  action: { type: 'string', enum: ['RESPOND', 'ESCALATE', 'CLOSE'] }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Response sent' } }
      }
    },

    // ============================================
    // Trading Listing API - Single Operations
    // ============================================
    '/api/ebay/{accountId}/trading/listing': {
      post: {
        tags: ['Trading Listing'],
        summary: 'Create new listing (AddFixedPriceItem)',
        description: `Creates a new eBay listing using Trading API. Features:
- Auto-detects marketplace from country code
- Auto-translates item specifics for EBAY_DE
- Flexible condition format (ID or string)
- Business policy fallback with defaults
- Supports all eBay listing fields`,
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'eBay account ID'
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] },
            description: 'Enable debug logging'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'primaryCategory', 'startPrice', 'quantity'],
                properties: {
                  title: { type: 'string', maxLength: 80, description: 'Item title' },
                  description: { type: 'string', description: 'HTML description (wrapped in CDATA)' },
                  primaryCategory: {
                    type: 'object',
                    required: ['categoryId'],
                    properties: {
                      categoryId: { type: 'string', example: '139973' }
                    }
                  },
                  startPrice: { type: 'number', description: 'Fixed price or starting bid', example: 99.99 },
                  quantity: { type: 'integer', description: 'Available quantity', example: 10 },
                  sku: { type: 'string', description: 'Your SKU', example: 'PROD-001' },
                  country: { type: 'string', description: '2-letter country code (auto-infers marketplace)', example: 'DE' },
                  marketplace: { type: 'string', enum: ['EBAY_US', 'EBAY_UK', 'EBAY_DE', 'EBAY_AU', 'EBAY_CA', 'EBAY_FR', 'EBAY_IT', 'EBAY_ES'], example: 'EBAY_DE' },
                  currency: { type: 'string', description: 'Auto-set based on marketplace', example: 'EUR' },
                  conditionId: { type: 'integer', description: '1000=New, 3000=Used', example: 1000 },
                  condition: { type: 'string', description: 'Alternative: "New", "Used" (case-insensitive)', example: 'New' },
                  pictureDetails: {
                    type: 'object',
                    properties: {
                      pictureURL: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Image URLs (first is gallery)',
                        example: ['https://example.com/image1.jpg']
                      }
                    }
                  },
                  itemSpecifics: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: 'Auto-translated for EBAY_DE', example: 'Brand' },
                        value: { description: 'String or array', example: 'Apple' }
                      }
                    }
                  },
                  productListingDetails: {
                    type: 'object',
                    properties: {
                      upc: { type: 'string' },
                      ean: { type: 'string' },
                      brandMPN: {
                        type: 'object',
                        properties: {
                          brand: { type: 'string' },
                          mpn: { type: 'string' }
                        }
                      }
                    }
                  },
                  shippingDetails: {
                    type: 'object',
                    description: 'Shipping configuration (auto-defaults if missing)'
                  },
                  returnPolicy: {
                    type: 'object',
                    description: 'Return policy (auto-defaults if missing)'
                  },
                  regulatory: {
                    type: 'object',
                    description: 'EU compliance (manufacturer, responsible persons)',
                    properties: {
                      manufacturer: { type: 'object' },
                      responsiblePersons: { type: 'array' }
                    }
                  },
                  verifyOnly: { type: 'boolean', description: 'Validate without creating', default: false }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Listing created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Listing created successfully on eBay' },
                    data: {
                      type: 'object',
                      properties: {
                        itemId: { type: 'string', example: '123456789012' },
                        sku: { type: 'string' },
                        startTime: { type: 'string', format: 'date-time' },
                        endTime: { type: 'string', format: 'date-time' },
                        fees: { type: 'array' },
                        listingUrl: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Trading Listing'],
        summary: 'Update existing listing (ReviseFixedPriceItem)',
        description: `Updates an active listing. Non-updatable fields are automatically filtered out.

Can update: title, price, quantity, images, item specifics, shipping, return policy
Cannot update: category, condition ID, listing type, country, currency`,
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  itemId: { type: 'string', description: 'eBay ItemID (or use sku)', example: '123456789012' },
                  sku: { type: 'string', description: 'Your SKU (or use itemId)' },
                  title: { type: 'string', description: 'Updated title' },
                  startPrice: { type: 'number', description: 'Updated price' },
                  quantity: { type: 'integer', description: 'Updated quantity' },
                  pictureDetails: { type: 'object', description: 'Updated images' },
                  itemSpecifics: { type: 'array', description: 'Updated item specifics' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Listing updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        itemId: { type: 'string' },
                        fees: { type: 'array' }
                      }
                    },
                    debug: {
                      type: 'object',
                      properties: {
                        removedFields: { type: 'array', items: { type: 'string' } },
                        note: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      patch: {
        tags: ['Trading Listing'],
        summary: 'Relist ended listing (RelistFixedPriceItem)',
        description: `Re-creates an ended listing with a new ItemID. Must be within 90 days of listing end.

Benefits:
- Preserves watchers from original listing
- May receive insertion fee credits
- Can update any field during relist
- Faster than creating from scratch`,
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['itemId'],
                properties: {
                  itemId: { type: 'string', description: 'Original ended listing ItemID', example: '123456789012' },
                  marketplace: { type: 'string', example: 'EBAY_US' },
                  startPrice: { type: 'number', description: 'New price (optional)' },
                  quantity: { type: 'integer', description: 'New quantity (optional)' },
                  title: { type: 'string', description: 'Updated title (optional)' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Listing relisted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        itemId: { type: 'string', description: 'NEW ItemID' },
                        originalItemId: { type: 'string', description: 'Original ItemID' },
                        fees: { type: 'array' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Trading Listing'],
        summary: 'Get listing details (GetItem)',
        description: 'Retrieves details of a specific listing by ItemID',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'itemId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'eBay ItemID',
            example: '123456789012'
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] }
          }
        ],
        responses: {
          '200': {
            description: 'Listing details retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        itemId: { type: 'string' },
                        title: { type: 'string' },
                        currentPrice: { type: 'string' },
                        quantity: { type: 'string' },
                        sellingStatus: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Trading Listing'],
        summary: 'End listing (EndFixedPriceItem)',
        description: 'Ends an active listing',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'itemId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'eBay ItemID'
          },
          {
            name: 'reason',
            in: 'query',
            schema: { type: 'string', enum: ['Incorrect', 'LostOrBroken', 'NotAvailable', 'OtherListingError', 'ProductDeleted'], default: 'NotAvailable' },
            description: 'Reason for ending'
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] }
          }
        ],
        responses: {
          '200': {
            description: 'Listing ended successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        itemId: { type: 'string' },
                        endTime: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Trading Listing API - Bulk Operations
    '/api/ebay/{accountId}/trading/listing/bulk': {
      post: {
        tags: ['Trading Listing'],
        summary: 'Bulk create listings',
        description: `Creates multiple listings in one request.

- Parallel processing (default) or sequential (?parallel=false)
- Partial success support
- Individual item error tracking
- Recommended batch size: 10-50 items`,
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'parallel',
            in: 'query',
            schema: { type: 'boolean', default: true },
            description: 'Process items in parallel (faster) or sequential'
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  marketplace: { type: 'string', example: 'EBAY_DE' },
                  items: {
                    type: 'array',
                    description: 'Array of listing data (same format as single POST)',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        primaryCategory: { type: 'object' },
                        startPrice: { type: 'number' },
                        quantity: { type: 'integer' },
                        sku: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Bulk operation completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Bulk create completed: 18 successful, 2 failed' },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        successful: { type: 'integer' },
                        failed: { type: 'integer' },
                        results: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              index: { type: 'integer' },
                              success: { type: 'boolean' },
                              sku: { type: 'string' },
                              data: { type: 'object' },
                              error: { type: 'string' }
                            }
                          }
                        }
                      }
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        operation: { type: 'string', example: 'BULK_CREATE' },
                        parallel: { type: 'boolean' },
                        duration: { type: 'string', example: '3450ms' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Trading Listing'],
        summary: 'Bulk update listings',
        description: 'Updates multiple listings. Same format as single PUT, batched.',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'parallel',
            in: 'query',
            schema: { type: 'boolean', default: true }
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  marketplace: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        itemId: { type: 'string', description: 'ItemID or SKU required' },
                        sku: { type: 'string' },
                        startPrice: { type: 'number' },
                        quantity: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Bulk update completed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/paths/~1api~1ebay~1{accountId}~1trading~1listing~1bulk/post/responses/200/content/application~1json/schema'
                }
              }
            }
          }
        }
      },
      patch: {
        tags: ['Trading Listing'],
        summary: 'Bulk relist listings',
        description: 'Relists multiple ended listings. Each creates a new ItemID.',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'parallel',
            in: 'query',
            schema: { type: 'boolean', default: true }
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  marketplace: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['itemId'],
                      properties: {
                        itemId: { type: 'string', description: 'Original ended listing ItemID' },
                        startPrice: { type: 'number', description: 'Optional: new price' },
                        quantity: { type: 'integer', description: 'Optional: new quantity' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Bulk relist completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        successful: { type: 'integer' },
                        failed: { type: 'integer' },
                        results: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              index: { type: 'integer' },
                              success: { type: 'boolean' },
                              originalItemId: { type: 'string' },
                              newItemId: { type: 'string' },
                              error: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Trading Listing'],
        summary: 'Bulk end listings',
        description: 'Ends multiple active listings',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'parallel',
            in: 'query',
            schema: { type: 'boolean', default: true }
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  marketplace: { type: 'string' },
                  reason: { type: 'string', enum: ['Incorrect', 'LostOrBroken', 'NotAvailable', 'OtherListingError', 'ProductDeleted'], description: 'Default reason for all' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        itemId: { type: 'string' },
                        sku: { type: 'string' },
                        reason: { type: 'string', description: 'Optional: override default reason' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Bulk delete completed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/paths/~1api~1ebay~1{accountId}~1trading~1listing~1bulk/post/responses/200/content/application~1json/schema'
                }
              }
            }
          }
        }
      }
    },

    // Trading Listing API - Search
    '/api/ebay/{accountId}/trading/search': {
      get: {
        tags: ['Trading Listing'],
        summary: 'Search items by title and/or SKU',
        description: `Search for items in seller's inventory by title and/or SKU.

Search Behavior:
- **Title only**: Case-insensitive partial match
- **SKU only**: Exact match
- **Both title AND SKU**: Items must match BOTH conditions (AND logic)

Examples:
- \`title=iPhone\` → Finds all items with "iPhone" in title
- \`sku=PROD-001\` → Finds item with exact SKU
- \`title=iPhone&sku=PROD-001\` → Finds items with "iPhone" in title AND SKU "PROD-001"`,
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'eBay account ID'
          },
          {
            name: 'title',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Search by title (case-insensitive, partial match)',
            example: 'iPhone'
          },
          {
            name: 'sku',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Search by SKU (exact match)',
            example: 'PROD-001'
          },
          {
            name: 'marketplace',
            in: 'query',
            schema: { type: 'string', enum: ['EBAY_US', 'EBAY_UK', 'EBAY_DE', 'EBAY_AU', 'EBAY_CA', 'EBAY_FR', 'EBAY_IT', 'EBAY_ES'], default: 'EBAY_DE' },
            description: 'eBay marketplace'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50, maximum: 200 },
            description: 'Maximum number of results to return'
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] },
            description: 'Enable debug logging'
          }
        ],
        responses: {
          '200': {
            description: 'Search completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        searchCriteria: {
                          type: 'object',
                          properties: {
                            title: { type: 'string', example: 'iPhone', nullable: true },
                            sku: { type: 'string', example: 'PROD-001', nullable: true },
                            matchBoth: { type: 'boolean', example: true, description: 'true if both title and SKU were provided' }
                          }
                        },
                        totalFound: { type: 'integer', example: 2, description: 'Number of items found' },
                        items: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              itemId: { type: 'string', example: '123456789012' },
                              sku: { type: 'string', example: 'PROD-001' },
                              title: { type: 'string', example: 'Apple iPhone 13 Pro Max 256GB' },
                              currentPrice: { type: 'number', example: 999.99 },
                              currency: { type: 'string', example: 'EUR' },
                              quantity: {
                                type: 'object',
                                properties: {
                                  total: { type: 'integer', example: 10 },
                                  sold: { type: 'integer', example: 3 },
                                  available: { type: 'integer', example: 7 }
                                }
                              },
                              listingStatus: { type: 'string', example: 'Active' },
                              listingType: { type: 'string', example: 'FixedPriceItem' },
                              startTime: { type: 'string', format: 'date-time' },
                              endTime: { type: 'string', format: 'date-time' },
                              pictureUrls: { type: 'array', items: { type: 'string' } },
                              categoryId: { type: 'string', example: '9355' },
                              categoryName: { type: 'string', example: 'Cell Phones & Smartphones' },
                              listingUrl: { type: 'string', example: 'https://www.ebay.de/itm/123456789012' }
                            }
                          }
                        }
                      }
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        account_used: { type: 'string' },
                        account_id: { type: 'string' },
                        marketplace: { type: 'string' },
                        api_type: { type: 'string', example: 'TRADING' },
                        operation: { type: 'string', example: 'SEARCH_ITEMS' },
                        limit: { type: 'integer' }
                      }
                    }
                  }
                },
                examples: {
                  'Search by Title Only': {
                    value: {
                      success: true,
                      data: {
                        searchCriteria: {
                          title: 'iPhone',
                          sku: null,
                          matchBoth: false
                        },
                        totalFound: 5,
                        items: [
                          {
                            itemId: '123456789012',
                            sku: 'PROD-001',
                            title: 'Apple iPhone 13 Pro Max 256GB',
                            currentPrice: 999.99,
                            currency: 'EUR',
                            quantity: {
                              total: 10,
                              sold: 3,
                              available: 7
                            },
                            listingStatus: 'Active',
                            listingType: 'FixedPriceItem'
                          }
                        ]
                      }
                    }
                  },
                  'Search by Both (AND)': {
                    value: {
                      success: true,
                      data: {
                        searchCriteria: {
                          title: 'iPhone',
                          sku: 'PROD-001',
                          matchBoth: true
                        },
                        totalFound: 1,
                        items: [
                          {
                            itemId: '123456789012',
                            sku: 'PROD-001',
                            title: 'Apple iPhone 13 Pro Max 256GB',
                            currentPrice: 999.99,
                            currency: 'EUR'
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Missing search parameters',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'At least one search parameter is required (title or sku)' },
                    errors: { type: 'array', items: { type: 'object' } },
                    ack: { type: 'string', example: 'Failure' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Trading Listing API - Status Check
    '/api/ebay/{accountId}/trading/status': {
      get: {
        tags: ['Trading Listing'],
        summary: 'Check item status (GetItem)',
        description: `Checks the status of an eBay listing by ItemID.

Returns:
- Listing status (Active, Completed, Ended, NotFound)
- Quantity information (total, sold, available)
- Current pricing
- Listing timing (start/end times)
- Performance metrics (views, watchers)

Use Cases:
- Verify if item is still active
- Check available quantity
- Monitor listing performance
- Detect deleted items`,
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'eBay account ID'
          },
          {
            name: 'itemId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'eBay Item ID to check',
            example: '123456789012'
          },
          {
            name: 'marketplace',
            in: 'query',
            schema: { type: 'string', enum: ['EBAY_US', 'EBAY_UK', 'EBAY_DE', 'EBAY_AU', 'EBAY_CA', 'EBAY_FR', 'EBAY_IT', 'EBAY_ES'], default: 'EBAY_DE' },
            description: 'eBay marketplace'
          },
          {
            name: 'debug',
            in: 'query',
            schema: { type: 'string', enum: ['1'] },
            description: 'Enable debug logging'
          }
        ],
        responses: {
          '200': {
            description: 'Status check successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', example: true },
                        itemId: { type: 'string', example: '123456789012' },
                        sku: { type: 'string', example: 'PROD-001' },
                        title: { type: 'string', example: 'Product Title' },
                        status: {
                          type: 'object',
                          properties: {
                            listingStatus: {
                              type: 'string',
                              enum: ['Active', 'Completed', 'Ended', 'NotFound'],
                              example: 'Active',
                              description: 'Current status of the listing'
                            },
                            isActive: { type: 'boolean', example: true, description: 'Whether item is currently active' },
                            isEnded: { type: 'boolean', example: false, description: 'Whether listing has ended' },
                            isDeleted: { type: 'boolean', description: 'Only present when NotFound' }
                          }
                        },
                        quantity: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer', example: 10, description: 'Total quantity listed' },
                            sold: { type: 'integer', example: 2, description: 'Number sold' },
                            available: { type: 'integer', example: 8, description: 'Remaining quantity' }
                          }
                        },
                        pricing: {
                          type: 'object',
                          properties: {
                            currentPrice: { type: 'number', example: 99.99, description: 'Current item price' },
                            currency: { type: 'string', example: 'EUR', description: 'Price currency' },
                            convertedPrice: { type: 'number', description: 'Price in buyer currency (if applicable)' },
                            convertedCurrency: { type: 'string', description: 'Converted currency code (if applicable)' }
                          }
                        },
                        timing: {
                          type: 'object',
                          properties: {
                            startTime: { type: 'string', format: 'date-time', example: '2024-01-01T10:00:00.000Z' },
                            endTime: { type: 'string', format: 'date-time', example: '2024-12-31T23:59:59.000Z' },
                            listingDuration: { type: 'string', example: 'GTC', description: 'Duration type (GTC, Days_7, Days_30, etc.)' }
                          }
                        },
                        listingType: { type: 'string', example: 'FixedPriceItem', enum: ['FixedPriceItem', 'Auction'] },
                        viewCount: { type: 'integer', example: 150, description: 'Number of views' },
                        watchCount: { type: 'integer', example: 5, description: 'Number of watchers' }
                      }
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        account_used: { type: 'string', example: 'seller_username' },
                        account_id: { type: 'string', example: 'acc_123456' },
                        marketplace: { type: 'string', example: 'EBAY_DE' },
                        api_type: { type: 'string', example: 'TRADING' },
                        operation: { type: 'string', example: 'CHECK_STATUS' }
                      }
                    }
                  }
                },
                examples: {
                  'Active Item': {
                    value: {
                      success: true,
                      data: {
                        success: true,
                        itemId: '123456789012',
                        sku: 'PROD-001',
                        title: 'Product Title',
                        status: {
                          listingStatus: 'Active',
                          isActive: true,
                          isEnded: false
                        },
                        quantity: {
                          total: 10,
                          sold: 2,
                          available: 8
                        },
                        pricing: {
                          currentPrice: 99.99,
                          currency: 'EUR'
                        },
                        timing: {
                          startTime: '2024-01-01T10:00:00.000Z',
                          endTime: '2024-12-31T23:59:59.000Z',
                          listingDuration: 'GTC'
                        },
                        listingType: 'FixedPriceItem',
                        viewCount: 150,
                        watchCount: 5
                      },
                      metadata: {
                        account_used: 'seller_username',
                        account_id: 'acc_123456',
                        marketplace: 'EBAY_DE',
                        api_type: 'TRADING',
                        operation: 'CHECK_STATUS'
                      }
                    }
                  },
                  'Item Not Found': {
                    value: {
                      success: true,
                      data: {
                        success: true,
                        itemId: '999999999999',
                        status: {
                          listingStatus: 'NotFound',
                          isActive: false,
                          isEnded: true,
                          isDeleted: true
                        },
                        message: 'Item not found or has been deleted'
                      },
                      metadata: {
                        account_used: 'seller_username',
                        account_id: 'acc_123456',
                        marketplace: 'EBAY_DE',
                        api_type: 'TRADING',
                        operation: 'CHECK_STATUS'
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request - Missing or invalid ItemID',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Item ID is required' },
                    errors: { type: 'array', items: { type: 'object' } },
                    ack: { type: 'string', example: 'Failure' }
                  }
                },
                examples: {
                  'Missing ItemID': {
                    value: {
                      success: false,
                      message: 'Item ID is required',
                      errors: [],
                      ack: 'Failure'
                    }
                  },
                  'Invalid ItemID': {
                    value: {
                      success: false,
                      message: 'eBay Trading API error: [21917062] Invalid or missing ItemID - ItemID 123 is invalid',
                      errors: [
                        {
                          shortMessage: 'Invalid or missing ItemID',
                          longMessage: 'ItemID 123 is invalid',
                          errorCode: '21917062',
                          severityCode: 'Error',
                          errorClassification: 'RequestError'
                        }
                      ],
                      ack: 'Failure'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Failed to get item status: Network error' },
                    errors: { type: 'array', items: { type: 'object' } },
                    ack: { type: 'string', example: 'Failure' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Legacy Listings (Trading API)
    '/api/ebay/{accountId}/legacy-listings': {
      get: {
        tags: ['Legacy Listings'],
        summary: 'Get listings from Trading API',
        description: 'Retrieves legacy listings using eBay Trading API (SOAP/XML)',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 100, maximum: 200 },
            description: 'Items per page'
          },
          {
            name: 'api',
            in: 'query',
            schema: { type: 'string', enum: ['selling', 'sellerlist'], default: 'selling' },
            description: 'API method to use'
          },
          {
            name: 'startTime',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Start date for sellerlist API'
          },
          {
            name: 'endTime',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'End date for sellerlist API'
          },
          {
            name: 'compare',
            in: 'query',
            schema: { type: 'boolean', default: false },
            description: 'Compare with Inventory API items'
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              itemId: { type: 'string', example: '123456789012' },
                              title: { type: 'string' },
                              sku: { type: 'string' },
                              currentPrice: { type: 'string' },
                              currency: { type: 'string' },
                              quantityAvailable: { type: 'string' },
                              quantitySold: { type: 'string' },
                              sellingStatus: { type: 'string', enum: ['Active', 'Completed', 'Ended'] },
                              listingType: { type: 'string', enum: ['FixedPriceItem', 'Auction'] },
                              startTime: { type: 'string' },
                              endTime: { type: 'string' },
                              pictureUrls: { type: 'array', items: { type: 'string' } }
                            }
                          }
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            pageNumber: { type: 'integer' },
                            entriesPerPage: { type: 'integer' },
                            totalPages: { type: 'integer' },
                            totalEntries: { type: 'integer' }
                          }
                        },
                        apiUsed: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Auth token expired',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'eBay token has expired. Please reconnect your eBay account.' },
                    error: { type: 'string', example: 'eBay Trading API Error 932: Auth token is hard expired.' },
                    suggestion: { type: 'string' },
                    actionRequired: { type: 'string', example: 'reconnect' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Legacy Listings'],
        summary: 'Migrate legacy listings to Inventory API',
        description: 'Migrates Trading API listings to modern Inventory API format',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['itemIds'],
                properties: {
                  itemIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['123456789012', '123456789013']
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Migration completed'
          }
        }
      }
    },

    // Migration APIs
    '/api/ebay/{accountId}/migrate-listings': {
      get: {
        tags: ['Migration'],
        summary: 'Get migration status',
        description: 'Analyzes which listings need migration from Trading API to Inventory API',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Migration analysis',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          type: 'object',
                          properties: {
                            totalLegacyListings: { type: 'integer' },
                            totalInventoryItems: { type: 'integer' },
                            needsMigration: { type: 'integer' },
                            alreadyMigrated: { type: 'integer' }
                          }
                        },
                        needsMigration: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              itemId: { type: 'string' },
                              title: { type: 'string' },
                              sku: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Migration'],
        summary: 'Bulk migrate listings',
        description: 'Migrates multiple Trading API listings to Inventory API',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['listingIds'],
                properties: {
                  listingIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['123456789012', '123456789013'],
                    description: 'Array of item IDs to migrate'
                  },
                  testMode: {
                    type: 'boolean',
                    default: false,
                    description: 'If true, only processes first 5 items'
                  },
                  autoCreateSKU: {
                    type: 'boolean',
                    default: true,
                    description: 'Auto-generate SKUs for items without them'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Migration completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        totalRequested: { type: 'integer' },
                        successCount: { type: 'integer' },
                        failureCount: { type: 'integer' },
                        results: { type: 'array' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Business Policies required but not enabled'
          }
        }
      }
    },
    '/api/ebay/{accountId}/migrate-single': {
      post: {
        tags: ['Migration'],
        summary: 'Migrate single listing',
        description: 'Migrates a single Trading API listing to Inventory API',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['listingId'],
                properties: {
                  listingId: {
                    type: 'string',
                    example: '123456789012',
                    description: 'Item ID to migrate'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Migration successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        listingId: { type: 'string' },
                        inventorySku: { type: 'string' },
                        inventoryItemGroupKey: { type: 'string' },
                        offerId: { type: 'string' },
                        statusCode: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Migration API not available - Business Policies may be required'
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Token',
        description: 'API Token im Format: ebay_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          error: { type: 'string' },
          code: { type: 'string' }
        }
      }
    }
  },
  security: [
    { bearerAuth: [] }
  ]
};

export async function GET() {
  return NextResponse.json(swaggerDocument);
}