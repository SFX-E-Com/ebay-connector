import { NextResponse } from 'next/server';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'eBay Connector API',
    version: '1.0.0',
    description: 'Complete API documentation for eBay Connector application including Inventory, Trading, and OAuth APIs',
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
    { name: 'Inventory', description: 'eBay Inventory API operations' },
    { name: 'Listings', description: 'eBay Listings management' },
    { name: 'Legacy Listings', description: 'Trading API legacy listings' },
    { name: 'Offers', description: 'eBay Offers (active listings) management' },
    { name: 'Migration', description: 'Migration tools from Trading API to Inventory API' },
    { name: 'Locations', description: 'Merchant location management' },
    { name: 'Policies', description: 'Business policies management' },
    { name: 'Item Management', description: 'Item existence check and variations' }
  ],
  paths: {
    // Inventory Items
    '/api/ebay/{accountId}/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'Get all inventory items',
        description: 'Retrieves all inventory items for the specified eBay account with pagination support',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'eBay account ID',
            example: 'cmggns0dk0001jr04tb7ljtkk'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 25, maximum: 200 },
            description: 'Number of items to return'
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 0 },
            description: 'Number of items to skip'
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
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 150 },
                        limit: { type: 'integer', example: 25 },
                        offset: { type: 'integer', example: 0 },
                        inventoryItems: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              sku: { type: 'string', example: 'PROD-001' },
                              product: {
                                type: 'object',
                                properties: {
                                  title: { type: 'string', example: 'iPhone Case' },
                                  description: { type: 'string' },
                                  imageUrls: { type: 'array', items: { type: 'string' } },
                                  aspects: { type: 'object' }
                                }
                              },
                              condition: { type: 'string', example: 'NEW' },
                              availability: {
                                type: 'object',
                                properties: {
                                  shipToLocationAvailability: {
                                    type: 'object',
                                    properties: {
                                      quantity: { type: 'integer', example: 10 }
                                    }
                                  }
                                }
                              }
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
                        environment: { type: 'string', enum: ['sandbox', 'production'] }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Authentication failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'eBay authentication failed. Please reconnect your eBay account.' },
                    error: { type: 'string' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Account not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'eBay account not found' }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string' },
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Inventory'],
        summary: 'Create new inventory item',
        description: 'Creates a new inventory item in eBay. This does not create a listing - use offers API to list the item.',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'eBay account ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sku', 'product', 'condition', 'availability'],
                properties: {
                  sku: { type: 'string', example: 'PROD-001', description: 'Unique SKU for the item' },
                  product: {
                    type: 'object',
                    required: ['title'],
                    properties: {
                      title: { type: 'string', example: 'Apple iPhone 15 Case' },
                      description: { type: 'string', example: 'High quality protective case' },
                      imageUrls: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['https://example.com/image1.jpg']
                      },
                      aspects: {
                        type: 'object',
                        example: {
                          Brand: 'Apple',
                          Color: 'Black',
                          'Compatible Model': 'iPhone 15'
                        }
                      },
                      brand: { type: 'string', example: 'Apple' },
                      mpn: { type: 'string', example: 'MPN123' },
                      ean: { type: 'array', items: { type: 'string' } },
                      upc: { type: 'array', items: { type: 'string' } }
                    }
                  },
                  condition: {
                    type: 'string',
                    enum: ['NEW', 'LIKE_NEW', 'USED_EXCELLENT', 'USED_GOOD', 'USED_ACCEPTABLE', 'FOR_PARTS_OR_NOT_WORKING'],
                    example: 'NEW'
                  },
                  conditionDescription: { type: 'string' },
                  availability: {
                    type: 'object',
                    properties: {
                      shipToLocationAvailability: {
                        type: 'object',
                        properties: {
                          quantity: { type: 'integer', example: 100 }
                        }
                      }
                    }
                  },
                  packageWeightAndSize: {
                    type: 'object',
                    properties: {
                      weight: {
                        type: 'object',
                        properties: {
                          value: { type: 'number', example: 0.5 },
                          unit: { type: 'string', enum: ['POUND', 'KILOGRAM', 'OUNCE', 'GRAM'] }
                        }
                      },
                      dimensions: {
                        type: 'object',
                        properties: {
                          length: { type: 'number' },
                          width: { type: 'number' },
                          height: { type: 'number' },
                          unit: { type: 'string', enum: ['INCH', 'CENTIMETER'] }
                        }
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
            description: 'Item created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Inventory item created successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        sku: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request - Invalid input data'
          },
          '401': {
            description: 'Authentication failed'
          },
          '409': {
            description: 'Conflict - SKU already exists'
          }
        }
      }
    },
    '/api/ebay/{accountId}/inventory/{sku}': {
      get: {
        tags: ['Inventory'],
        summary: 'Get specific inventory item by SKU',
        description: 'Retrieves a single inventory item by its SKU',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'eBay account ID'
          },
          {
            name: 'sku',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'SKU of the inventory item',
            example: 'PROD-001'
          }
        ],
        responses: {
          '200': {
            description: 'Successful response'
          },
          '404': {
            description: 'Item not found'
          }
        }
      },
      put: {
        tags: ['Inventory'],
        summary: 'Update inventory item',
        description: 'Updates an existing inventory item',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'sku',
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
                description: 'Same structure as POST /inventory'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Item updated successfully'
          }
        }
      },
      delete: {
        tags: ['Inventory'],
        summary: 'Delete inventory item',
        description: 'Deletes an inventory item. Item must not have active offers.',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'sku',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Item deleted successfully'
          },
          '400': {
            description: 'Cannot delete - item has active offers'
          }
        }
      }
    },

    // Listings Management
    '/api/ebay/{accountId}/listings': {
      get: {
        tags: ['Listings'],
        summary: 'Get all listings',
        description: 'Wrapper endpoint for inventory items - returns all listings with additional formatting',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 25 }
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 0 }
          },
          {
            name: 'sku',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by specific SKU'
          }
        ],
        responses: {
          '200': {
            description: 'Successful response'
          }
        }
      }
    },
    '/api/ebay/{accountId}/listings/{sku}': {
      get: {
        tags: ['Listings'],
        summary: 'Get specific listing by SKU',
        description: 'Retrieves a single listing by its SKU',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'sku',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response'
          }
        }
      }
    },
    '/api/ebay/{accountId}/listings/create': {
      post: {
        tags: ['Listings'],
        summary: 'Create complete listing',
        description: 'Creates both inventory item and offer in one API call',
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
                required: ['inventoryItem', 'offer'],
                properties: {
                  inventoryItem: {
                    type: 'object',
                    description: 'Inventory item data (see POST /inventory)'
                  },
                  offer: {
                    type: 'object',
                    properties: {
                      marketplaceId: { type: 'string', example: 'EBAY_US' },
                      format: { type: 'string', enum: ['FIXED_PRICE', 'AUCTION'], example: 'FIXED_PRICE' },
                      pricingSummary: {
                        type: 'object',
                        properties: {
                          price: {
                            type: 'object',
                            properties: {
                              value: { type: 'string', example: '29.99' },
                              currency: { type: 'string', example: 'USD' }
                            }
                          }
                        }
                      },
                      listingPolicies: {
                        type: 'object',
                        properties: {
                          fulfillmentPolicyId: { type: 'string' },
                          paymentPolicyId: { type: 'string' },
                          returnPolicyId: { type: 'string' }
                        }
                      }
                    }
                  },
                  publishOffer: { type: 'boolean', default: false, description: 'Auto-publish the offer after creation' }
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
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        sku: { type: 'string' },
                        offerId: { type: 'string' },
                        listingId: { type: 'string' },
                        status: { type: 'string' }
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

    // Offers APIs
    '/api/ebay/{accountId}/offers': {
      get: {
        tags: ['Offers'],
        summary: 'Get all offers',
        description: 'Retrieves all offers (active listings) for the account',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'sku',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by SKU'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 }
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 0 }
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
                        total: { type: 'integer' },
                        limit: { type: 'integer' },
                        offers: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              offerId: { type: 'string' },
                              sku: { type: 'string' },
                              marketplaceId: { type: 'string' },
                              format: { type: 'string' },
                              listingDescription: { type: 'string' },
                              status: { type: 'string', enum: ['PUBLISHED', 'UNPUBLISHED'] },
                              pricingSummary: { type: 'object' },
                              listing: {
                                type: 'object',
                                properties: {
                                  listingId: { type: 'string' },
                                  listingStatus: { type: 'string' }
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
          }
        }
      },
      post: {
        tags: ['Offers'],
        summary: 'Create new offer',
        description: 'Creates a new offer from an existing inventory item',
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
                required: ['sku', 'marketplaceId', 'format', 'pricingSummary'],
                properties: {
                  sku: { type: 'string', example: 'PROD-001' },
                  marketplaceId: { type: 'string', example: 'EBAY_US' },
                  format: { type: 'string', enum: ['FIXED_PRICE', 'AUCTION'] },
                  listingDescription: { type: 'string' },
                  availableQuantity: { type: 'integer', example: 10 },
                  pricingSummary: {
                    type: 'object',
                    properties: {
                      price: {
                        type: 'object',
                        properties: {
                          value: { type: 'string', example: '49.99' },
                          currency: { type: 'string', example: 'USD' }
                        }
                      }
                    }
                  },
                  listingPolicies: {
                    type: 'object',
                    properties: {
                      fulfillmentPolicyId: { type: 'string' },
                      paymentPolicyId: { type: 'string' },
                      returnPolicyId: { type: 'string' }
                    }
                  },
                  categoryId: { type: 'string', example: '15032' },
                  merchantLocationKey: { type: 'string' },
                  tax: {
                    type: 'object',
                    properties: {
                      vatPercentage: { type: 'number' },
                      applyTax: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Offer created successfully',
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
                        offerId: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request - Invalid input'
          },
          '404': {
            description: 'SKU not found in inventory'
          }
        }
      }
    },
    '/api/ebay/{accountId}/offers/{offerId}': {
      get: {
        tags: ['Offers'],
        summary: 'Get specific offer',
        description: 'Retrieves a single offer by ID',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'offerId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response'
          }
        }
      },
      put: {
        tags: ['Offers'],
        summary: 'Update offer',
        description: 'Updates price, quantity, or other offer details',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'offerId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  availableQuantity: { type: 'integer' },
                  pricingSummary: {
                    type: 'object',
                    properties: {
                      price: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          currency: { type: 'string' }
                        }
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
            description: 'Offer updated successfully'
          }
        }
      },
      delete: {
        tags: ['Offers'],
        summary: 'Delete offer',
        description: 'Deletes an unpublished offer',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'offerId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '204': {
            description: 'Offer deleted successfully'
          },
          '400': {
            description: 'Cannot delete published offer - withdraw first'
          }
        }
      }
    },
    '/api/ebay/{accountId}/offers/{offerId}/publish': {
      post: {
        tags: ['Offers'],
        summary: 'Publish offer',
        description: 'Publishes an offer to make it live on eBay',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'offerId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Offer published successfully',
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
                        listingId: { type: 'string' }
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
        description: 'Withdraws a published offer from eBay',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'offerId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Offer withdrawn successfully'
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
    },

    // Location APIs
    '/api/ebay/{accountId}/locations': {
      get: {
        tags: ['Locations'],
        summary: 'Get all merchant locations',
        description: 'Retrieves all merchant location definitions',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 100 }
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 0 }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response'
          }
        }
      },
      post: {
        tags: ['Locations'],
        summary: 'Create new location',
        description: 'Creates a new merchant location',
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
                required: ['merchantLocationKey', 'name', 'location'],
                properties: {
                  merchantLocationKey: { type: 'string', example: 'WAREHOUSE-01' },
                  name: { type: 'string', example: 'Main Warehouse' },
                  location: {
                    type: 'object',
                    properties: {
                      address: {
                        type: 'object',
                        properties: {
                          addressLine1: { type: 'string' },
                          addressLine2: { type: 'string' },
                          city: { type: 'string' },
                          stateOrProvince: { type: 'string' },
                          postalCode: { type: 'string' },
                          country: { type: 'string' }
                        }
                      }
                    }
                  },
                  locationTypes: {
                    type: 'array',
                    items: { type: 'string', enum: ['STORE', 'WAREHOUSE'] }
                  },
                  merchantLocationStatus: {
                    type: 'string',
                    enum: ['ENABLED', 'DISABLED']
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Location created successfully'
          }
        }
      }
    },
    '/api/ebay/{accountId}/locations/{locationKey}': {
      get: {
        tags: ['Locations'],
        summary: 'Get specific location',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'locationKey',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response'
          }
        }
      },
      put: {
        tags: ['Locations'],
        summary: 'Update location',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'locationKey',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Location updated'
          }
        }
      },
      delete: {
        tags: ['Locations'],
        summary: 'Delete location',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'locationKey',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '204': {
            description: 'Location deleted'
          }
        }
      }
    },

    // Policies API
    '/api/ebay/{accountId}/policies': {
      get: {
        tags: ['Policies'],
        summary: 'Get business policies',
        description: 'Retrieves payment, return, and fulfillment policies',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['payment', 'return', 'fulfillment']
            },
            description: 'Filter by policy type'
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
                        paymentPolicies: { type: 'array' },
                        returnPolicies: { type: 'array' },
                        fulfillmentPolicies: { type: 'array' }
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

    // Item Management APIs
    '/api/ebay/{accountId}/check-item': {
      get: {
        tags: ['Item Management'],
        summary: 'Check if item exists',
        description: 'Checks if an item exists by SKU or Item ID in both Inventory and Trading APIs',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'sku',
            in: 'query',
            schema: { type: 'string' },
            description: 'SKU to check',
            example: 'PROD-001'
          },
          {
            name: 'itemId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Item ID to check',
            example: '123456789012'
          }
        ],
        responses: {
          '200': {
            description: 'Check completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        exists: { type: 'boolean', example: true },
                        location: {
                          type: 'string',
                          enum: ['inventory_api', 'trading_api'],
                          description: 'Where the item was found'
                        },
                        item: { type: 'object', description: 'Item details if found' },
                        searchCriteria: {
                          type: 'object',
                          properties: {
                            sku: { type: 'string' },
                            itemId: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request - SKU or Item ID required'
          }
        }
      }
    },
    '/api/ebay/{accountId}/inventory-group': {
      post: {
        tags: ['Item Management'],
        summary: 'Create inventory item group',
        description: 'Creates an inventory item group for product variations',
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
                required: ['inventoryItemGroupKey', 'variantSKUs'],
                properties: {
                  inventoryItemGroupKey: {
                    type: 'string',
                    example: 'SHIRT-GROUP-001',
                    description: 'Unique key for the group'
                  },
                  title: { type: 'string', example: 'Cotton T-Shirt' },
                  description: { type: 'string' },
                  imageUrls: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  aspects: {
                    type: 'object',
                    example: {
                      Brand: 'YourBrand',
                      Material: 'Cotton'
                    }
                  },
                  variantSKUs: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['SHIRT-RED-S', 'SHIRT-RED-M', 'SHIRT-BLUE-S'],
                    description: 'SKUs of inventory items to group'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Group created successfully'
          },
          '400': {
            description: 'Invalid input or SKUs not found'
          }
        }
      },
      put: {
        tags: ['Item Management'],
        summary: 'Create multiple variations',
        description: 'Creates multiple inventory items as variations with different SKUs',
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
                required: ['baseSKU', 'variations', 'commonData'],
                properties: {
                  baseSKU: {
                    type: 'string',
                    example: 'SHIRT',
                    description: 'Base SKU prefix'
                  },
                  commonData: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', example: 'Cotton T-Shirt' },
                      description: { type: 'string' },
                      imageUrls: { type: 'array', items: { type: 'string' } },
                      condition: { type: 'string', example: 'NEW' },
                      aspects: {
                        type: 'object',
                        example: {
                          Brand: 'YourBrand',
                          Material: '100% Cotton'
                        }
                      }
                    }
                  },
                  variations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        suffix: { type: 'string', example: 'RED-S' },
                        name: { type: 'string', example: 'Red Small' },
                        quantity: { type: 'integer', example: 10 },
                        aspects: {
                          type: 'object',
                          example: {
                            Color: 'Red',
                            Size: 'Small'
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
        responses: {
          '200': {
            description: 'Variations created',
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
                        baseSKU: { type: 'string' },
                        variations: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              sku: { type: 'string' },
                              success: { type: 'boolean' },
                              variation: { type: 'string' },
                              error: { type: 'string' }
                            }
                          }
                        },
                        summary: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer' },
                            succeeded: { type: 'integer' },
                            failed: { type: 'integer' }
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