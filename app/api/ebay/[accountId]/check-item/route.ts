import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/services/database';
import { EbayListingService } from '../../../../lib/services/ebay-listing';

// GET /api/ebay/[accountId]/check-item - Check if item exists by SKU or Item ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const itemId = searchParams.get('itemId');

    if (!sku && !itemId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Either SKU or Item ID is required',
        },
        { status: 400 }
      );
    }

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

    const ebayService = new EbayListingService(account);
    let exists = false;
    let itemData = null;
    let location = null;

    // Check by SKU in Inventory API
    if (sku) {
      try {
        console.log(`[CHECK ITEM] Checking for SKU: ${sku}`);
        const item = await ebayService.getInventoryItem(sku);
        if (item) {
          exists = true;
          itemData = item;
          location = 'inventory_api';
        }
      } catch (error: any) {
        if (!error.message.includes('404')) {
          throw error;
        }
        // Item not found in Inventory API, continue checking
      }
    }

    // If SKU not found and itemId provided, check Trading API
    if (!exists && itemId) {
      try {
        const { EbayTradingService } = await import('../../../../lib/services/ebay-trading');
        const tradingService = new EbayTradingService(account);
        const tradingItem = await tradingService.getItem(itemId);

        if (tradingItem.items && tradingItem.items.length > 0) {
          exists = true;
          itemData = tradingItem.items[0];
          location = 'trading_api';
        }
      } catch (error: any) {
        console.log(`[CHECK ITEM] Item not found in Trading API: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        exists,
        location,
        item: itemData,
        searchCriteria: {
          sku: sku || null,
          itemId: itemId || null
        }
      },
      metadata: {
        account_used: account.friendlyName || account.ebayUsername,
        account_id: accountId,
        environment: process.env.EBAY_SANDBOX === 'true' ? 'sandbox' : 'production'
      }
    });

  } catch (error: any) {
    console.error('[CHECK ITEM] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check item existence',
        error: error.message
      },
      { status: 500 }
    );
  }
}