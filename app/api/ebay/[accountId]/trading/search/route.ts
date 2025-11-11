import { NextRequest, NextResponse } from 'next/server';
import { EbayTradingApiService } from '@/app/lib/services/ebay-trading-api';
import { RealtimeDebugLogger } from '@/app/lib/services/realtimeDebugLogger';
import { withEbayAuth } from '@/app/lib/middleware/ebayAuth';

// GET /api/ebay/[accountId]/trading/search - Search item by SKU and validate title
// HYBRID STRATEGY: Tries exact SKU match first (fast), then falls back to partial SKU match (slower)
// Supports optional filters: categoryId and createdAt for optimal performance
const getHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';
    const title = searchParams.get('title');
    const sku = searchParams.get('sku');
    const categoryId = searchParams.get('categoryId'); // Optional category filter for performance
    const createdAt = searchParams.get('createdAt'); // Optional creation date for HUGE performance boost
    const marketplace = searchParams.get('marketplace') || 'EBAY_DE';

    try {
      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_SEARCH', 'Search request received', {
          accountId: authData.ebayAccount.id,
          title,
          sku,
          categoryId,
          createdAt,
          marketplace,
          url: request.url,
          method: 'GET'
        });
      }

      // Require BOTH title AND sku
      if (!title || !sku) {
        return NextResponse.json(
          {
            success: false,
            message: 'Both title and sku parameters are required',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      // Initialize Trading API service
      const tradingApi = new EbayTradingApiService(
        authData.ebayAccount as any,
        marketplace,
        debugMode
      );

      if (debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API_SEARCH', 'Trading API initialized', {
          account: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          tokenExpiresAt: authData.ebayAccount.expiresAt,
          environment: process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION',
          categoryFilter: categoryId || 'none',
          createdAtFilter: createdAt || 'none (will be slower)'
        });
      }

      try {
        // Search items by SKU and title (with optional filters for performance)
        // Returns array of items that match BOTH SKU and title
        const items = await tradingApi.searchItemBySkuAndTitle(
          sku,
          title,
          categoryId || undefined,
          createdAt || undefined
        );

        if (debugMode) {
          await RealtimeDebugLogger.info('TRADING_API_SEARCH', 'Search completed', {
            title,
            sku,
            itemsFound: items.length
          });
        }

        if (items.length === 0) {
          // No items found
          return NextResponse.json({
            success: true,
            data: {
              searchCriteria: {
                title,
                sku,
                categoryId: categoryId || null,
                createdAt: createdAt || null
              },
              found: false,
              totalFound: 0,
              message: 'No items found matching BOTH SKU and title'
            },
            metadata: {
              account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
              account_id: authData.ebayAccount.id,
              marketplace: marketplace,
              category_filter: categoryId || null,
              created_at_filter: createdAt || null,
              api_type: 'TRADING',
              operation: 'SEARCH_BY_SKU_AND_TITLE'
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            searchCriteria: {
              title,
              sku,
              categoryId: categoryId || null,
              createdAt: createdAt || null
            },
            found: true,
            totalFound: items.length,
            items: items
          },
          metadata: {
            account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
            account_id: authData.ebayAccount.id,
            marketplace: marketplace,
            category_filter: categoryId || null,
            created_at_filter: createdAt || null,
            api_type: 'TRADING',
            operation: 'SEARCH_BY_SKU_AND_TITLE'
          },
        });
      } catch (apiError: any) {
        if (debugMode) {
          await RealtimeDebugLogger.error('TRADING_API_SEARCH', 'API Error', apiError);
        }

        // Check if it's an eBay API error
        if (apiError.errors) {
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
              ack: apiError.ack || 'Failure'
            },
            { status: 400 }
          );
        }

        throw apiError;
      }
    } catch (error: any) {
      if (debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_SEARCH', 'Failed to search items', {
          error: error.message,
          stack: error.stack
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to search items: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

export const GET = getHandler;
