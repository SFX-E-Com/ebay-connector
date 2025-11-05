import { NextRequest, NextResponse } from 'next/server';
import { EbayTradingApiService } from '@/app/lib/services/ebay-trading-api';
import { RealtimeDebugLogger } from '@/app/lib/services/realtimeDebugLogger';
import { withEbayAuth } from '@/app/lib/middleware/ebayAuth';
import { EbayTradingItem } from '@/app/lib/types/ebay-trading-api.types';

// POST /api/ebay/[accountId]/trading/listing - Create listing using Trading API
const postHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    // Check for debug mode
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';

    try {
      // Use body from authData (already parsed in middleware)
      const body: EbayTradingItem = authData.requestBody;

      if (!body) {
        return NextResponse.json(
          {
            success: false,
            message: 'Request body is required',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      // Log request details if debug mode is enabled
      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_CREATE', 'POST request received', {
          accountId: authData.ebayAccount.id,
          sku: body.sku,
          title: body.title,
          categoryId: body.primaryCategory?.categoryId,
          price: body.startPrice,
          quantity: body.quantity,
          condition: body.conditionId,
          url: request.url,
          method: 'POST'
        });
      }

      // Validate required fields
      if (!body.title || !body.description || !body.primaryCategory?.categoryId || !body.startPrice || !body.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: 'Missing required fields: title, description, primaryCategory.categoryId, startPrice, quantity',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      // Infer marketplace from country if not specified
      let marketplace = body.marketplace;
      if (!marketplace && body.country) {
        const countryToMarketplace: Record<string, string> = {
          'US': 'EBAY_US',
          'GB': 'EBAY_UK',
          'UK': 'EBAY_UK',
          'DE': 'EBAY_DE',
          'AU': 'EBAY_AU',
          'CA': 'EBAY_CA',
          'FR': 'EBAY_FR',
          'IT': 'EBAY_IT',
          'ES': 'EBAY_ES',
          'CH': 'EBAY_CH',
          'AT': 'EBAY_AT',
          'BE': 'EBAY_BE',
          'NL': 'EBAY_NL',
        };
        marketplace = countryToMarketplace[body.country] || 'EBAY_US';

        if (debugMode) {
          await RealtimeDebugLogger.info('TRADING_API_CREATE', 'Inferred marketplace from country', {
            country: body.country,
            marketplace
          });
        }
      } else if (!marketplace) {
        marketplace = 'EBAY_US';
      }

      // Initialize Trading API service with debug mode
      // The authData.ebayAccount already has a refreshed token from the middleware
      const tradingApi = new EbayTradingApiService(
        authData.ebayAccount as any,
        marketplace,
        debugMode
      );

      if (debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API_CREATE', 'Trading API initialized', {
          account: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          tokenExpiresAt: authData.ebayAccount.expiresAt,
          environment: process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION'
        });
      }

      try {
        let result;

        if (body.verifyOnly) {
          // Verify listing without creating
          if (debugMode) {
            await RealtimeDebugLogger.info('TRADING_API_CREATE', 'Verifying listing (not creating)', { sku: body.sku });
          }
          result = await tradingApi.verifyAddFixedPriceItem(body);

          if (debugMode) {
            await RealtimeDebugLogger.info('TRADING_API_CREATE', 'Verification completed', result);
          }

          return NextResponse.json({
            success: true,
            message: 'Listing verified successfully',
            data: {
              fees: result.fees,
              errors: result.errors,
              warnings: result.warnings,
            },
            metadata: {
              account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
              account_id: authData.ebayAccount.id,
              marketplace: marketplace,
              api_type: 'TRADING',
              verified_only: true,
            },
          });
        } else {
          // Create actual listing
          if (debugMode) {
            await RealtimeDebugLogger.info('TRADING_API_CREATE', 'Creating listing', { sku: body.sku });
          }
          result = await tradingApi.addFixedPriceItem(body);

          if (debugMode) {
            await RealtimeDebugLogger.info('TRADING_API_CREATE', 'Listing created successfully', {
              itemId: result.itemId,
              fees: result.fees
            });
          }

          return NextResponse.json({
            success: true,
            message: 'Listing created successfully on eBay',
            data: {
              itemId: result.itemId,
              sku: result.sku,
              startTime: result.startTime,
              endTime: result.endTime,
              fees: result.fees,
              warnings: result.warnings,
              listingUrl: `https://www.ebay${process.env.EBAY_SANDBOX === 'true' ? '.sandbox' : ''}.com/itm/${result.itemId}`,
            },
            metadata: {
              account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
              account_id: authData.ebayAccount.id,
              marketplace: marketplace,
              api_type: 'TRADING',
            },
          });
        }
      } catch (apiError: any) {
        if (debugMode) {
          await RealtimeDebugLogger.error('TRADING_API_CREATE', 'API Error', apiError);
        }

        // Parse Trading API errors
        if (apiError.errors) {
          // Extract detailed error messages from eBay errors array
          const errorMessages = apiError.errors
            .map((err: any) => {
              const parts = [`[${err.code}]`, err.shortMessage];
              if (err.longMessage && err.longMessage !== err.shortMessage) {
                parts.push(`- ${err.longMessage}`);
              }
              return parts.join(' ');
            })
            .join(' | ');

          return NextResponse.json(
            {
              success: false,
              message: `eBay Trading API error: ${errorMessages}`,
              errors: apiError.errors,
              ack: apiError.ack,
            },
            { status: 400 }
          );
        }

        throw apiError;
      }
    } catch (error: any) {
      if (debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_CREATE', 'Unexpected error', {
          error: error.message,
          stack: error.stack
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to create listing via Trading API: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

// GET /api/ebay/[accountId]/trading/listing - Get listing details
const getHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';
    const itemId = searchParams.get('itemId');

    try {
      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_GET', 'GET request received', {
          accountId: authData.ebayAccount.id,
          itemId,
          url: request.url,
          method: 'GET'
        });
      }

      if (!itemId) {
        return NextResponse.json(
          {
            success: false,
            message: 'Item ID is required',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      // Initialize Trading API service with debug mode
      const tradingApi = new EbayTradingApiService(
        authData.ebayAccount as any,
        'EBAY_US',
        debugMode
      );

      if (debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API_GET', 'Trading API initialized', {
          account: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          tokenExpiresAt: authData.ebayAccount.expiresAt,
          environment: process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION'
        });
      }

      // Get item details
      const result = await tradingApi.getItem(itemId);

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_GET', 'Item retrieved successfully', {
          itemId: result.item?.ItemID,
          sku: result.item?.SKU
        });
      }

      return NextResponse.json({
        success: true,
        data: result.item,
        metadata: {
          account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          account_id: authData.ebayAccount.id,
        },
      });
    } catch (error: any) {
      if (debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_GET', 'Failed to get listing', {
          error: error.message,
          stack: error.stack
        });
      }

      // Check if it's an eBay API error
      if (error.errors) {
        const errorMessages = error.errors
          .map((err: any) => {
            const parts = [`[${err.code}]`, err.shortMessage];
            if (err.longMessage && err.longMessage !== err.shortMessage) {
              parts.push(`- ${err.longMessage}`);
            }
            return parts.join(' ');
          })
          .join(' | ');

        return NextResponse.json(
          {
            success: false,
            message: `eBay Trading API error: ${errorMessages}`,
            errors: error.errors,
            ack: error.ack || 'Failure'
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to get listing details: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

// PUT /api/ebay/[accountId]/trading/listing - Update listing
const putHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';

    try {
      // Use body from authData (already parsed in middleware)
      const body = authData.requestBody;

      if (!body) {
        return NextResponse.json(
          {
            success: false,
            message: 'Request body is required',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      const { itemId, sku, marketplace = 'EBAY_US', ...updates } = body;

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_UPDATE', 'PUT request received', {
          accountId: authData.ebayAccount.id,
          itemId,
          sku,
          marketplace,
          url: request.url,
          method: 'PUT'
        });
      }

      // Need either itemId or SKU
      if (!itemId && !sku) {
        return NextResponse.json(
          {
            success: false,
            message: 'Either Item ID or SKU is required',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      if (debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API_UPDATE', 'Request details', {
          itemId,
          sku,
          marketplace,
          updates
        });
      }

      // Initialize Trading API service
      const tradingApi = new EbayTradingApiService(
        authData.ebayAccount as any,
        marketplace,
        debugMode
      );

      if (debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API_UPDATE', 'Using account', {
          account: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId
        });
      }

      try {
        // If SKU provided instead of itemId, use it
        const identifier = itemId || sku;

        // Update listing
        const result = await tradingApi.reviseFixedPriceItem(identifier, updates);

        if (debugMode) {
          await RealtimeDebugLogger.info('TRADING_API_UPDATE', 'Listing updated successfully', result);
        }

        return NextResponse.json({
          success: true,
          message: 'Listing updated successfully',
          data: result,
          metadata: {
            account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
            account_id: authData.ebayAccount.id,
            marketplace: marketplace,
            api_type: 'TRADING',
          },
        });
      } catch (apiError: any) {
        if (debugMode) {
          await RealtimeDebugLogger.error('TRADING_API_UPDATE', 'API Error', apiError);
        }

        if (apiError.errors) {
          // Extract detailed error messages from eBay errors array
          const errorMessages = apiError.errors
            .map((err: any) => {
              const parts = [`[${err.code}]`, err.shortMessage];
              if (err.longMessage && err.longMessage !== err.shortMessage) {
                parts.push(`- ${err.longMessage}`);
              }
              return parts.join(' ');
            })
            .join(' | ');

          return NextResponse.json(
            {
              success: false,
              message: `eBay Trading API error: ${errorMessages}`,
              errors: apiError.errors,
              ack: apiError.ack,
            },
            { status: 400 }
          );
        }

        throw apiError;
      }
    } catch (error: any) {
      if (debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_UPDATE', 'Error', {
          error: error.message,
          stack: error.stack
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to update listing: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/ebay/[accountId]/trading/listing - End listing
const deleteHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';

    try {
      const itemId = searchParams.get('itemId');
      const sku = searchParams.get('sku');
      const reason = searchParams.get('reason') || 'NotAvailable';
      const marketplace = searchParams.get('marketplace') || 'EBAY_US';

      // Need either itemId or SKU
      if (!itemId && !sku) {
        return NextResponse.json(
          {
            success: false,
            message: 'Either Item ID or SKU is required',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_DELETE', 'DELETE request received', {
          accountId: authData.ebayAccount.id,
          itemId,
          sku,
          reason,
          marketplace,
          url: request.url,
          method: 'DELETE'
        });
      }

      // Valid ending reasons
      const validReasons = [
        'Incorrect',           // The listing contained an error
        'LostOrBroken',       // Item is no longer available
        'NotAvailable',       // Item is out of stock
        'OtherListingError',  // Other listing error
        'ProductDeleted',     // Product was deleted
        'SellToHighBidder'    // For auction items
      ];

      if (!validReasons.includes(reason)) {
        if (debugMode) {
          await RealtimeDebugLogger.warn('TRADING_API_DELETE', 'Invalid reason provided', {
            providedReason: reason,
            defaultReason: 'OtherListingError'
          });
        }
      }

      // Initialize Trading API service
      const tradingApi = new EbayTradingApiService(
        authData.ebayAccount as any,
        marketplace,
        debugMode
      );

      if (debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API_DELETE', 'Using account', {
          account: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          tokenExpiresAt: authData.ebayAccount.expiresAt,
          environment: process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION'
        });
      }

      try {
        // Use itemId or SKU
        const identifier = itemId || sku;

        // End listing
        const result = await tradingApi.endFixedPriceItem(identifier!, reason);

        if (debugMode) {
          await RealtimeDebugLogger.info('TRADING_API_DELETE', 'Listing ended successfully', result);
        }

        return NextResponse.json({
          success: true,
          message: 'Listing ended successfully',
          data: {
            ...result,
            reason: reason,
            identifier: identifier,
          },
          metadata: {
            account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
            account_id: authData.ebayAccount.id,
            marketplace: marketplace,
            api_type: 'TRADING',
          },
        });
      } catch (apiError: any) {
        if (debugMode) {
          await RealtimeDebugLogger.error('TRADING_API_DELETE', 'API Error', apiError);
        }

        if (apiError.errors) {
          // Extract detailed error messages from eBay errors array
          const errorMessages = apiError.errors
            .map((err: any) => {
              const parts = [`[${err.code}]`, err.shortMessage];
              if (err.longMessage && err.longMessage !== err.shortMessage) {
                parts.push(`- ${err.longMessage}`);
              }
              return parts.join(' ');
            })
            .join(' | ');

          return NextResponse.json(
            {
              success: false,
              message: `eBay Trading API error: ${errorMessages}`,
              errors: apiError.errors,
              ack: apiError.ack,
            },
            { status: 400 }
          );
        }

        throw apiError;
      }
    } catch (error: any) {
      if (debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_DELETE', 'Error', {
          error: error.message,
          stack: error.stack
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to end listing: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

// PATCH /api/ebay/[accountId]/trading/listing - Relist ended listing
const patchHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';

    try {
      // Use body from authData (already parsed in middleware)
      const body = authData.requestBody;

      if (!body) {
        return NextResponse.json(
          {
            success: false,
            message: 'Request body is required',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      const { itemId, marketplace = 'EBAY_US', ...updates } = body;

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_RELIST', 'PATCH request received', {
          accountId: authData.ebayAccount.id,
          itemId,
          marketplace,
          hasUpdates: Object.keys(updates).length > 0,
          url: request.url,
          method: 'PATCH'
        });
      }

      // ItemID is required for relist
      if (!itemId) {
        return NextResponse.json(
          {
            success: false,
            message: 'Item ID is required for relisting',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      if (debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API_RELIST', 'Relist request details', {
          itemId,
          marketplace,
          updates: Object.keys(updates)
        });
      }

      // Initialize Trading API service
      const tradingApi = new EbayTradingApiService(
        authData.ebayAccount as any,
        marketplace,
        debugMode
      );

      if (debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API_RELIST', 'Using account', {
          account: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          tokenExpiresAt: authData.ebayAccount.expiresAt,
          environment: process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION'
        });
      }

      try {
        // Relist the item with optional updates
        const hasUpdates = Object.keys(updates).length > 0;
        const result = await tradingApi.relistFixedPriceItem(
          itemId,
          hasUpdates ? updates : undefined
        );

        if (debugMode) {
          await RealtimeDebugLogger.info('TRADING_API_RELIST', 'Item relisted successfully', {
            newItemId: result.itemId,
            originalItemId: itemId,
            fees: result.fees
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Listing relisted successfully on eBay',
          data: {
            itemId: result.itemId,              // New ItemID
            originalItemId: result.originalItemId, // Original ItemID
            sku: result.sku,
            startTime: result.startTime,
            endTime: result.endTime,
            fees: result.fees,
            warnings: result.warnings,
            listingUrl: `https://www.ebay${process.env.EBAY_SANDBOX === 'true' ? '.sandbox' : ''}.com/itm/${result.itemId}`,
          },
          metadata: {
            account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
            account_id: authData.ebayAccount.id,
            marketplace: marketplace,
            api_type: 'TRADING',
            operation: 'RELIST',
          },
        });
      } catch (apiError: any) {
        if (debugMode) {
          await RealtimeDebugLogger.error('TRADING_API_RELIST', 'API Error', apiError);
        }

        if (apiError.errors) {
          // Extract detailed error messages from eBay errors array
          const errorMessages = apiError.errors
            .map((err: any) => {
              const parts = [`[${err.code}]`, err.shortMessage];
              if (err.longMessage && err.longMessage !== err.shortMessage) {
                parts.push(`- ${err.longMessage}`);
              }
              return parts.join(' ');
            })
            .join(' | ');

          return NextResponse.json(
            {
              success: false,
              message: `eBay Trading API error: ${errorMessages}`,
              errors: apiError.errors,
              ack: apiError.ack,
            },
            { status: 400 }
          );
        }

        throw apiError;
      }
    } catch (error: any) {
      if (debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_RELIST', 'Error', {
          error: error.message,
          stack: error.stack
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to relist listing: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

// Export the handlers
export const POST = postHandler;
export const GET = getHandler;
export const PUT = putHandler;
export const DELETE = deleteHandler;
export const PATCH = patchHandler;