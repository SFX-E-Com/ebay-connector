import { NextRequest, NextResponse } from 'next/server';
import { EbayAccountService } from '@/app/lib/services/ebayAccountService';
import { EbayTradingApiService } from '@/app/lib/services/ebay-trading-api';

// GET /api/ebay/[accountId]/trading/item - Get item details by ItemID or SKU
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const sku = searchParams.get('sku');
    const marketplace = searchParams.get('marketplace') || 'EBAY_DE';

    // Require either itemId or sku
    if (!itemId && !sku) {
      return NextResponse.json(
        {
          success: false,
          message: 'Either itemId or sku parameter is required',
          example: '/api/ebay/{accountId}/trading/item?itemId=123456789012 or ?sku=YOUR-SKU',
        },
        { status: 400 }
      );
    }

    console.log('[TRADING API ITEM] ====== REQUEST DETAILS ======');
    console.log('[TRADING API ITEM] Account ID:', accountId);
    console.log('[TRADING API ITEM] Item ID:', itemId || 'Not provided');
    console.log('[TRADING API ITEM] SKU:', sku || 'Not provided');
    console.log('[TRADING API ITEM] Marketplace:', marketplace);
    console.log('[TRADING API ITEM] ==============================');

    // Get the eBay account
    const account = await EbayAccountService.getAccountById(accountId);

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

    console.log('[TRADING API ITEM] Using account:', account.ebayUsername || account.ebayUserId);

    try {
      let actualItemId = itemId;
      let foundBySku = false;

      // If SKU is provided but not ItemID, try different methods
      if (sku && !itemId) {
        console.log('[TRADING API ITEM] Attempting to get item directly by SKU:', sku);

        // First, try using GetItem with SKU directly (fastest method)
        try {
          const skuResult = await tradingApi.getItem(sku, true);
          if (skuResult && skuResult.item) {
            console.log('[TRADING API ITEM] Successfully retrieved item using SKU directly');
            actualItemId = skuResult.item.ItemID;
            foundBySku = true;
          }
        } catch (skuError: any) {
          console.log('[TRADING API ITEM] GetItem with SKU failed:', skuError.message || 'Unknown error');
          console.log('[TRADING API ITEM] Falling back to GetSellerList search...');

          const sellerListResult = await tradingApi.getSellerList({
            startTimeFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            startTimeTo: new Date(),
            pagination: { entriesPerPage: 50, pageNumber: 1 },
            includeVariations: true,
          });

          console.log('[TRADING API ITEM] Total items found:', sellerListResult.items.length);
          console.log('[TRADING API ITEM] Available SKUs:', sellerListResult.items.map((item: any) => ({
            sku: item.SKU,
            itemId: item.ItemID,
            title: item.Title?.substring(0, 30)
          })));

          const matchingItem = sellerListResult.items.find((item: any) => item.SKU === sku);

          if (matchingItem) {
            actualItemId = matchingItem.ItemID;
            foundBySku = true;
            console.log('[TRADING API ITEM] Found ItemID from seller list:', actualItemId);
          } else {
            return NextResponse.json(
              {
                success: false,
                message: `No active listing found with SKU: ${sku}`,
                suggestion: 'Use the /trading/items endpoint to see all your active listings with their SKUs',
                debug: {
                  itemsChecked: sellerListResult.items.length,
                  availableSkus: sellerListResult.items.map((item: any) => item.SKU).filter(Boolean)
                }
              },
              { status: 404 }
            );
          }
        }
      }

      // Get item details
      if (!actualItemId) {
        return NextResponse.json(
          {
            success: false,
            message: 'Could not determine item ID',
          },
          { status: 400 }
        );
      }

      console.log('[TRADING API ITEM] Fetching item details for ItemID:', actualItemId);
      const result = await tradingApi.getItem(actualItemId, false);

      // Format the response
      const item = result.item;
      const formattedItem = {
        itemId: item.ItemID,
        sku: item.SKU || null,
        title: item.Title,
        description: item.Description,
        categoryId: item.PrimaryCategory?.CategoryID,
        categoryName: item.PrimaryCategory?.CategoryName,
        price: {
          value: item.StartPrice?._value || item.BuyItNowPrice?._value || 0,
          currency: item.StartPrice?._currencyID || item.BuyItNowPrice?._currencyID || 'USD',
        },
        quantity: {
          available: item.Quantity || 0,
          sold: item.SellingStatus?.QuantitySold || 0,
        },
        condition: {
          id: item.ConditionID,
          displayName: item.ConditionDisplayName,
          description: item.ConditionDescription,
        },
        location: {
          city: item.Location,
          postalCode: item.PostalCode,
          country: item.Country,
        },
        images: item.PictureDetails?.PictureURL || [],
        itemSpecifics: item.ItemSpecifics?.NameValueList
          ? item.ItemSpecifics.NameValueList.reduce((acc: any, spec: any) => {
            acc[spec.Name] = spec.Value;
            return acc;
          }, {})
          : {},
        shipping: {
          shippingType: item.ShippingDetails?.ShippingType,
          services: item.ShippingDetails?.ShippingServiceOptions || [],
        },
        returnPolicy: item.ReturnPolicy ? {
          returnsAccepted: item.ReturnPolicy.ReturnsAcceptedOption === 'ReturnsAccepted',
          refundOption: item.ReturnPolicy.RefundOption,
          returnsWithin: item.ReturnPolicy.ReturnsWithinOption,
          shippingCostPaidBy: item.ReturnPolicy.ShippingCostPaidByOption,
          description: item.ReturnPolicy.Description,
        } : null,
        businessPolicies: item.SellerProfiles ? {
          payment: item.SellerProfiles.SellerPaymentProfile,
          return: item.SellerProfiles.SellerReturnProfile,
          shipping: item.SellerProfiles.SellerShippingProfile,
        } : null,
        listingDetails: {
          startTime: item.ListingDetails?.StartTime,
          endTime: item.ListingDetails?.EndTime,
          viewItemURL: item.ListingDetails?.ViewItemURL,
          listingType: item.ListingType,
          listingDuration: item.ListingDuration,
        },
        sellingStatus: {
          listingStatus: item.SellingStatus?.ListingStatus,
          currentPrice: item.SellingStatus?.CurrentPrice?._value,
          quantitySold: item.SellingStatus?.QuantitySold || 0,
          bidCount: item.SellingStatus?.BidCount || 0,
        },
        hasVariations: item.Variations ? true : false,
        variations: item.Variations?.Variation || [],
      };

      return NextResponse.json({
        success: true,
        message: foundBySku ? `Item found by SKU: ${sku}` : 'Item details retrieved successfully',
        data: formattedItem,
        metadata: {
          account_used: account.ebayUsername || account.ebayUserId,
          account_id: accountId,
          marketplace: marketplace,
          api_type: 'TRADING',
          found_by: foundBySku ? 'SKU' : 'ItemID',
        },
      });
    } catch (apiError: any) {
      console.error('[TRADING API ITEM] API Error:', apiError);

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
    console.error('[TRADING API ITEM] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get item details',
        error: error.message,
      },
      { status: 500 }
    );
  }
}