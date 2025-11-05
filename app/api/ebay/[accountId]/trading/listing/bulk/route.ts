import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth } from '@/app/lib/middleware/ebayAuth';
import { EbayTradingApiService } from '@/app/lib/services/ebay-trading-api';
import { RealtimeDebugLogger } from '@/app/lib/services/realtimeDebugLogger';
import { EbayTradingItem } from '@/app/lib/types/ebay-trading-api.types';

/**
 * Helper function to format eBay API error messages
 */
function formatEbayErrors(errors: any[]): string {
  return errors
    .map((err: any) => {
      const parts = [`[${err.code}]`, err.shortMessage];
      if (err.longMessage && err.longMessage !== err.shortMessage) {
        parts.push(`- ${err.longMessage}`);
      }
      return parts.join(' ');
    })
    .join(' | ');
}

// POST /api/ebay/[accountId]/trading/listing/bulk - Bulk create listings
const postHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';
    const parallel = searchParams.get('parallel') !== 'false'; // Default to parallel

    try {
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

      const { items, marketplace = 'EBAY_US' } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Items array is required and must not be empty',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_BULK_CREATE', 'Bulk create request received', {
          accountId: authData.ebayAccount.id,
          itemCount: items.length,
          marketplace,
          parallel,
          method: 'POST'
        });
      }

      const tradingApi = new EbayTradingApiService(
        authData.ebayAccount as any,
        marketplace,
        debugMode
      );

      const results: any[] = [];
      const startTime = Date.now();

      if (parallel) {
        // Process in parallel
        const promises = items.map(async (item: EbayTradingItem, index: number) => {
          try {
            const verifyOnly = item.verifyOnly || false;
            const result = verifyOnly
              ? await tradingApi.verifyAddFixedPriceItem(item)
              : await tradingApi.addFixedPriceItem(item);

            return {
              index,
              success: true,
              data: result,
              sku: item.sku,
            };
          } catch (error: any) {
            // Format detailed error message
            const errorMessage = error.errors
              ? formatEbayErrors(error.errors)
              : error.message;

            return {
              index,
              success: false,
              error: errorMessage,
              errors: error.errors,
              sku: item.sku,
            };
          }
        });

        const settled = await Promise.allSettled(promises);
        results.push(...settled.map(r => r.status === 'fulfilled' ? r.value : r.reason));
      } else {
        // Process sequentially
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          try {
            const verifyOnly = item.verifyOnly || false;
            const result = verifyOnly
              ? await tradingApi.verifyAddFixedPriceItem(item)
              : await tradingApi.addFixedPriceItem(item);

            results.push({
              index: i,
              success: true,
              data: result,
              sku: item.sku,
            });
          } catch (error: any) {
            // Format detailed error message
            const errorMessage = error.errors
              ? formatEbayErrors(error.errors)
              : error.message;

            results.push({
              index: i,
              success: false,
              error: errorMessage,
              errors: error.errors,
              sku: item.sku,
            });
          }
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const duration = Date.now() - startTime;

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_BULK_CREATE', 'Bulk create completed', {
          total: items.length,
          success: successCount,
          failed: failureCount,
          duration: `${duration}ms`,
          avgPerItem: `${Math.round(duration / items.length)}ms`
        });
      }

      return NextResponse.json({
        success: failureCount === 0,
        message: `Bulk create completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          total: items.length,
          successful: successCount,
          failed: failureCount,
          results,
        },
        metadata: {
          account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          account_id: authData.ebayAccount.id,
          marketplace,
          api_type: 'TRADING',
          operation: 'BULK_CREATE',
          parallel,
          duration: `${duration}ms`,
        },
      });
    } catch (error: any) {
      if (debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_BULK_CREATE', 'Error', {
          error: error.message,
          stack: error.stack
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to process bulk create: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

// PUT /api/ebay/[accountId]/trading/listing/bulk - Bulk update listings
const putHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';
    const parallel = searchParams.get('parallel') !== 'false';

    try {
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

      const { items, marketplace = 'EBAY_US' } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Items array is required and must not be empty',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_BULK_UPDATE', 'Bulk update request received', {
          accountId: authData.ebayAccount.id,
          itemCount: items.length,
          marketplace,
          parallel
        });
      }

      const tradingApi = new EbayTradingApiService(
        authData.ebayAccount as any,
        marketplace,
        debugMode
      );

      const results: any[] = [];
      const startTime = Date.now();

      if (parallel) {
        const promises = items.map(async (item: any, index: number) => {
          try {
            const { itemId, sku, ...updates } = item;
            const identifier = itemId || sku;

            if (!identifier) {
              return {
                index,
                success: false,
                error: 'Either itemId or sku is required',
                item: { itemId, sku }
              };
            }

            const result = await tradingApi.reviseFixedPriceItem(identifier, updates);

            return {
              index,
              success: true,
              data: result,
              itemId,
              sku,
            };
          } catch (error: any) {
            // Format detailed error message
            const errorMessage = error.errors
              ? formatEbayErrors(error.errors)
              : error.message;

            return {
              index,
              success: false,
              error: errorMessage,
              errors: error.errors,
              itemId: item.itemId,
              sku: item.sku,
            };
          }
        });

        const settled = await Promise.allSettled(promises);
        results.push(...settled.map(r => r.status === 'fulfilled' ? r.value : r.reason));
      } else {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          try {
            const { itemId, sku, ...updates } = item;
            const identifier = itemId || sku;

            if (!identifier) {
              results.push({
                index: i,
                success: false,
                error: 'Either itemId or sku is required',
                item: { itemId, sku }
              });
              continue;
            }

            const result = await tradingApi.reviseFixedPriceItem(identifier, updates);

            results.push({
              index: i,
              success: true,
              data: result,
              itemId,
              sku,
            });
          } catch (error: any) {
            // Format detailed error message
            const errorMessage = error.errors
              ? formatEbayErrors(error.errors)
              : error.message;

            results.push({
              index: i,
              success: false,
              error: errorMessage,
              errors: error.errors,
              itemId: item.itemId,
              sku: item.sku,
            });
          }
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const duration = Date.now() - startTime;

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_BULK_UPDATE', 'Bulk update completed', {
          total: items.length,
          success: successCount,
          failed: failureCount,
          duration: `${duration}ms`
        });
      }

      return NextResponse.json({
        success: failureCount === 0,
        message: `Bulk update completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          total: items.length,
          successful: successCount,
          failed: failureCount,
          results,
        },
        metadata: {
          account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          account_id: authData.ebayAccount.id,
          marketplace,
          api_type: 'TRADING',
          operation: 'BULK_UPDATE',
          parallel,
          duration: `${duration}ms`,
        },
      });
    } catch (error: any) {
      if (debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_BULK_UPDATE', 'Error', {
          error: error.message,
          stack: error.stack
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to process bulk update: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

// PATCH /api/ebay/[accountId]/trading/listing/bulk - Bulk relist listings
const patchHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';
    const parallel = searchParams.get('parallel') !== 'false';

    try {
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

      const { items, marketplace = 'EBAY_US' } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Items array is required and must not be empty',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_BULK_RELIST', 'Bulk relist request received', {
          accountId: authData.ebayAccount.id,
          itemCount: items.length,
          marketplace,
          parallel
        });
      }

      const tradingApi = new EbayTradingApiService(
        authData.ebayAccount as any,
        marketplace,
        debugMode
      );

      const results: any[] = [];
      const startTime = Date.now();

      if (parallel) {
        const promises = items.map(async (item: any, index: number) => {
          try {
            const { itemId, ...updates } = item;

            if (!itemId) {
              return {
                index,
                success: false,
                error: 'itemId is required for relist',
                item: { itemId }
              };
            }

            const hasUpdates = Object.keys(updates).length > 0;
            const result = await tradingApi.relistFixedPriceItem(
              itemId,
              hasUpdates ? updates : undefined
            );

            return {
              index,
              success: true,
              data: result,
              originalItemId: itemId,
              newItemId: result.itemId,
            };
          } catch (error: any) {
            // Format detailed error message
            const errorMessage = error.errors
              ? formatEbayErrors(error.errors)
              : error.message;

            return {
              index,
              success: false,
              error: errorMessage,
              errors: error.errors,
              originalItemId: item.itemId,
            };
          }
        });

        const settled = await Promise.allSettled(promises);
        results.push(...settled.map(r => r.status === 'fulfilled' ? r.value : r.reason));
      } else {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          try {
            const { itemId, ...updates } = item;

            if (!itemId) {
              results.push({
                index: i,
                success: false,
                error: 'itemId is required for relist',
                item: { itemId }
              });
              continue;
            }

            const hasUpdates = Object.keys(updates).length > 0;
            const result = await tradingApi.relistFixedPriceItem(
              itemId,
              hasUpdates ? updates : undefined
            );

            results.push({
              index: i,
              success: true,
              data: result,
              originalItemId: itemId,
              newItemId: result.itemId,
            });
          } catch (error: any) {
            // Format detailed error message
            const errorMessage = error.errors
              ? formatEbayErrors(error.errors)
              : error.message;

            results.push({
              index: i,
              success: false,
              error: errorMessage,
              errors: error.errors,
              originalItemId: item.itemId,
            });
          }
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const duration = Date.now() - startTime;

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_BULK_RELIST', 'Bulk relist completed', {
          total: items.length,
          success: successCount,
          failed: failureCount,
          duration: `${duration}ms`
        });
      }

      return NextResponse.json({
        success: failureCount === 0,
        message: `Bulk relist completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          total: items.length,
          successful: successCount,
          failed: failureCount,
          results,
        },
        metadata: {
          account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          account_id: authData.ebayAccount.id,
          marketplace,
          api_type: 'TRADING',
          operation: 'BULK_RELIST',
          parallel,
          duration: `${duration}ms`,
        },
      });
    } catch (error: any) {
      if (debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_BULK_RELIST', 'Error', {
          error: error.message,
          stack: error.stack
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to process bulk relist: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/ebay/[accountId]/trading/listing/bulk - Bulk end listings
const deleteHandler = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request: NextRequest, authData) => {
    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get('debug') === '1';
    const parallel = searchParams.get('parallel') !== 'false';

    try {
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

      const { items, marketplace = 'EBAY_US', reason = 'NotAvailable' } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Items array is required and must not be empty',
            errors: [],
            ack: 'Failure'
          },
          { status: 400 }
        );
      }

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_BULK_DELETE', 'Bulk delete request received', {
          accountId: authData.ebayAccount.id,
          itemCount: items.length,
          marketplace,
          reason,
          parallel
        });
      }

      const tradingApi = new EbayTradingApiService(
        authData.ebayAccount as any,
        marketplace,
        debugMode
      );

      const results: any[] = [];
      const startTime = Date.now();

      if (parallel) {
        const promises = items.map(async (item: any, index: number) => {
          try {
            const identifier = item.itemId || item.sku;
            const itemReason = item.reason || reason;

            if (!identifier) {
              return {
                index,
                success: false,
                error: 'Either itemId or sku is required',
                item
              };
            }

            const result = await tradingApi.endFixedPriceItem(identifier, itemReason);

            return {
              index,
              success: true,
              data: result,
              itemId: item.itemId,
              sku: item.sku,
            };
          } catch (error: any) {
            // Format detailed error message
            const errorMessage = error.errors
              ? formatEbayErrors(error.errors)
              : error.message;

            return {
              index,
              success: false,
              error: errorMessage,
              errors: error.errors,
              itemId: item.itemId,
              sku: item.sku,
            };
          }
        });

        const settled = await Promise.allSettled(promises);
        results.push(...settled.map(r => r.status === 'fulfilled' ? r.value : r.reason));
      } else {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          try {
            const identifier = item.itemId || item.sku;
            const itemReason = item.reason || reason;

            if (!identifier) {
              results.push({
                index: i,
                success: false,
                error: 'Either itemId or sku is required',
                item
              });
              continue;
            }

            const result = await tradingApi.endFixedPriceItem(identifier, itemReason);

            results.push({
              index: i,
              success: true,
              data: result,
              itemId: item.itemId,
              sku: item.sku,
            });
          } catch (error: any) {
            // Format detailed error message
            const errorMessage = error.errors
              ? formatEbayErrors(error.errors)
              : error.message;

            results.push({
              index: i,
              success: false,
              error: errorMessage,
              errors: error.errors,
              itemId: item.itemId,
              sku: item.sku,
            });
          }
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const duration = Date.now() - startTime;

      if (debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_BULK_DELETE', 'Bulk delete completed', {
          total: items.length,
          success: successCount,
          failed: failureCount,
          duration: `${duration}ms`
        });
      }

      return NextResponse.json({
        success: failureCount === 0,
        message: `Bulk delete completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          total: items.length,
          successful: successCount,
          failed: failureCount,
          results,
        },
        metadata: {
          account_used: authData.ebayAccount.ebayUsername || authData.ebayAccount.ebayUserId,
          account_id: authData.ebayAccount.id,
          marketplace,
          api_type: 'TRADING',
          operation: 'BULK_DELETE',
          parallel,
          duration: `${duration}ms`,
        },
      });
    } catch (error: any) {
      if (debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_BULK_DELETE', 'Error', {
          error: error.message,
          stack: error.stack
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to process bulk delete: ${error.message}`,
          errors: [],
          ack: 'Failure'
        },
        { status: 500 }
      );
    }
  }
);

export const POST = postHandler;
export const PUT = putHandler;
export const PATCH = patchHandler;
export const DELETE = deleteHandler;
