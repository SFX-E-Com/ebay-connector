import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/services/database';
import { EbayTradingApiService } from '@/app/lib/services/ebay-trading-api';

// GET /api/ebay/[accountId]/trading/items - Get seller's active listings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;

  try {
    console.log(`[TRADING API] Getting seller's items for account: ${accountId}`);

    const { searchParams } = new URL(request.url);
    const marketplace = searchParams.get('marketplace') || 'EBAY_US';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sku = searchParams.get('sku'); // Optional: filter by specific SKU

    // Get the eBay account
    const account = await prisma.ebayUserToken.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message: 'eBay account not found',
        },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (account.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: 'OAuth token expired. Please reconnect your eBay account.',
        },
        { status: 401 }
      );
    }

    // Initialize Trading API service
    const tradingApi = new EbayTradingApiService(account as any, marketplace);

    console.log('[TRADING API ITEMS] Using account:', account.ebayUsername || account.ebayUserId);
    console.log('[TRADING API ITEMS] Marketplace:', marketplace);
    console.log('[TRADING API ITEMS] Page:', page, 'Limit:', limit);
    if (sku) {
      console.log('[TRADING API ITEMS] Filtering by SKU:', sku);
    }

    try {
      // Get seller's items
      const result = await tradingApi.getSellerList({
        startTimeFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        startTimeTo: new Date(),
        pagination: {
          entriesPerPage: limit,
          pageNumber: page,
        },
        sku: sku || undefined, // Optional SKU filter - convert null to undefined
        includeVariations: true,
      });

      // Format the response
      const items = result.items.map((item: any) => ({
        itemId: item.ItemID,
        sku: item.SKU || null,
        title: item.Title,
        price: item.StartPrice?._value || item.BuyItNowPrice?._value || 0,
        currency: item.StartPrice?._currencyID || item.BuyItNowPrice?._currencyID || 'USD',
        quantity: item.Quantity || 0,
        quantitySold: item.SellingStatus?.QuantitySold || 0,
        status: item.SellingStatus?.ListingStatus,
        viewUrl: item.ListingDetails?.ViewItemURL,
        categoryId: item.PrimaryCategory?.CategoryID,
        categoryName: item.PrimaryCategory?.CategoryName,
        condition: item.ConditionDisplayName || item.ConditionDescription,
        location: item.Location,
        startTime: item.ListingDetails?.StartTime,
        endTime: item.ListingDetails?.EndTime,
        images: item.PictureDetails?.PictureURL || [],
        hasVariations: item.Variations ? true : false,
        variations: item.Variations?.Variation || [],
      }));

      // Find specific SKU if requested
      const foundItem = sku ? items.find((item: any) => item.sku === sku) : null;

      return NextResponse.json({
        success: true,
        message: sku && !foundItem
          ? `No active listing found with SKU: ${sku}`
          : 'Items retrieved successfully',
        data: {
          items: sku && foundItem ? [foundItem] : items,
          pagination: {
            page: result.pagination.pageNumber,
            limit: result.pagination.entriesPerPage,
            totalPages: result.pagination.totalNumberOfPages,
            totalItems: result.pagination.totalNumberOfEntries,
            hasMore: result.pagination.hasMoreItems,
          },
        },
        metadata: {
          account_used: account.ebayUsername || account.ebayUserId,
          account_id: accountId,
          marketplace: marketplace,
          api_type: 'TRADING',
        },
        debug: sku && !foundItem ? {
          message: 'SKU not found in active listings',
          suggestion: 'Make sure the SKU exactly matches what was used when creating the listing',
          availableSkus: items.filter((item: any) => item.sku).map((item: any) => item.sku).slice(0, 10),
        } : undefined,
      });
    } catch (apiError: any) {
      console.error('[TRADING API ITEMS] API Error:', apiError);

      if (apiError.errors) {
        return NextResponse.json(
          {
            success: false,
            message: 'eBay Trading API error',
            errors: apiError.errors,
            ack: apiError.ack,
          },
          { status: 400 }
        );
      }

      throw apiError;
    }
  } catch (error: any) {
    console.error('[TRADING API ITEMS] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get seller items',
        error: error.message,
      },
      { status: 500 }
    );
  }
}