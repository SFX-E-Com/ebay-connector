import { NextRequest, NextResponse } from 'next/server';
import { EbayTradingApiService } from '@/app/lib/services/ebay-trading-api';
import { RealtimeDebugLogger } from '@/app/lib/services/realtimeDebugLogger';
import { withEbayAuth } from '@/app/lib/middleware/ebayAuth';

// GET /api/ebay/[accountId]/trading/status - Check item status
const getHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';
    const itemId = searchParams.get('itemId');
    const marketplace = searchParams.get('marketplace') || 'EBAY_DE';

    try {
      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_STATUS', 'GET status request received', {
          accountId: authData.ebayAccount.id,
          itemId,
          marketplace,
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
        marketplace,
        debugMode
      );

      if (debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API_STATUS', 'Trading API initialized', {
          account: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          tokenExpiresAt: authData.ebayAccount.expiresAt,
          environment: process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION'
        });
      }

      try {
        // Get item status
        const result = await tradingApi.getItemStatus(itemId);

        if (debugMode) {
          await RealtimeDebugLogger.info('TRADING_API_STATUS', 'Item status retrieved successfully', {
            itemId: result.itemId,
            listingStatus: result.status?.listingStatus,
            isActive: result.status?.isActive
          });
        }

        return NextResponse.json({
          success: true,
          data: result,
          metadata: {
            account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
            account_id: authData.ebayAccount.id,
            marketplace: marketplace,
            api_type: 'TRADING',
            operation: 'CHECK_STATUS',
          },
        });
      } catch (apiError: any) {
        if (debugMode) {
          await RealtimeDebugLogger.error('TRADING_API_STATUS', 'API Error', apiError);
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
        await RealtimeDebugLogger.error('TRADING_API_STATUS', 'Failed to get item status', {
          error: error.message,
          stack: error.stack
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to get item status: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

export const GET = getHandler;
