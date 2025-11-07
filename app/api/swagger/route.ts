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
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.yourdomain.com',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'Trading Listing', description: 'eBay Trading API listing operations - Create, update, relist, and manage listings' },
    { name: 'Legacy Listings', description: 'Trading API legacy listings' },
    { name: 'Migration', description: 'Migration tools from Trading API to Inventory API' }
  ],
  paths: {
    // Trading Listing API - Single Operations
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
        scheme: 'bearer'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
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
    { bearerAuth: [] },
    { apiKey: [] }
  ]
};

export async function GET() {
  return NextResponse.json(swaggerDocument);
}