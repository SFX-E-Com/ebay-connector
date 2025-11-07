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
    const marketplace = searchParams.get('marketplace') || 'EBAY_DE';
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

      // Format the response with comprehensive data
      const items = result.items.map((item: any) => ({
        // Basic Information
        itemId: item.ItemID,
        sku: item.SKU || null,
        title: item.Title,
        subTitle: item.SubTitle || null,
        description: item.Description,

        // Pricing
        price: {
          startPrice: item.StartPrice?._value || null,
          buyItNowPrice: item.BuyItNowPrice?._value || null,
          reservePrice: item.ReservePrice?._value || null,
          currency: item.StartPrice?._currencyID || item.BuyItNowPrice?._currencyID || 'USD',
        },

        // Quantity
        quantity: {
          available: item.Quantity || 0,
          sold: item.SellingStatus?.QuantitySold || 0,
        },
        lotSize: item.LotSize || null,

        // Status and Listing Details
        status: item.SellingStatus?.ListingStatus,
        listingType: item.ListingType,
        listingDuration: item.ListingDuration,
        currentPrice: item.SellingStatus?.CurrentPrice?._value || null,
        bidCount: item.SellingStatus?.BidCount || 0,

        // URLs
        viewUrl: item.ListingDetails?.ViewItemURL,
        galleryURL: item.GalleryURL || null,

        // Categories
        primaryCategory: {
          categoryId: item.PrimaryCategory?.CategoryID,
          categoryName: item.PrimaryCategory?.CategoryName,
        },
        secondaryCategory: item.SecondaryCategory ? {
          categoryId: item.SecondaryCategory?.CategoryID,
          categoryName: item.SecondaryCategory?.CategoryName,
        } : null,

        // Condition
        condition: {
          conditionId: item.ConditionID || null,
          conditionDisplayName: item.ConditionDisplayName || null,
          conditionDescription: item.ConditionDescription || null,
        },

        // Location
        location: {
          location: item.Location,
          postalCode: item.PostalCode || null,
          country: item.Country || null,
        },

        // Time
        startTime: item.ListingDetails?.StartTime,
        endTime: item.ListingDetails?.EndTime,

        // Images
        images: item.PictureDetails?.PictureURL || [],
        pictureDetails: item.PictureDetails || null,

        // Variations
        hasVariations: item.Variations ? true : false,
        variations: item.Variations?.Variation || [],

        // Item Specifics
        itemSpecifics: item.ItemSpecifics?.NameValueList ?
          item.ItemSpecifics.NameValueList.reduce((acc: any, spec: any) => {
            acc[spec.Name] = Array.isArray(spec.Value) ? spec.Value : [spec.Value];
            return acc;
          }, {}) : {},

        // Product Identifiers
        productListingDetails: item.ProductListingDetails ? {
          upc: item.ProductListingDetails.UPC || null,
          ean: item.ProductListingDetails.EAN || null,
          isbn: item.ProductListingDetails.ISBN || null,
          brandMPN: item.ProductListingDetails.BrandMPN ? {
            brand: item.ProductListingDetails.BrandMPN.Brand,
            mpn: item.ProductListingDetails.BrandMPN.MPN,
          } : null,
        } : null,

        // Shipping
        shippingDetails: item.ShippingDetails ? {
          shippingType: item.ShippingDetails.ShippingType,
          shippingServiceOptions: item.ShippingDetails.ShippingServiceOptions || [],
          internationalShippingServiceOption: item.ShippingDetails.InternationalShippingServiceOption || [],
          excludeShipToLocation: item.ShippingDetails.ExcludeShipToLocation || [],
          globalShipping: item.ShippingDetails.GlobalShipping || false,
        } : null,

        // Return Policy
        returnPolicy: item.ReturnPolicy ? {
          returnsAcceptedOption: item.ReturnPolicy.ReturnsAcceptedOption,
          refundOption: item.ReturnPolicy.RefundOption || null,
          returnsWithinOption: item.ReturnPolicy.ReturnsWithinOption || null,
          shippingCostPaidByOption: item.ReturnPolicy.ShippingCostPaidByOption || null,
          description: item.ReturnPolicy.Description || null,
        } : null,

        // Business Policies
        businessPolicies: item.SellerProfiles ? {
          paymentProfileId: item.SellerProfiles.SellerPaymentProfile?.PaymentProfileID || null,
          paymentProfileName: item.SellerProfiles.SellerPaymentProfile?.PaymentProfileName || null,
          returnProfileId: item.SellerProfiles.SellerReturnProfile?.ReturnProfileID || null,
          returnProfileName: item.SellerProfiles.SellerReturnProfile?.ReturnProfileName || null,
          shippingProfileId: item.SellerProfiles.SellerShippingProfile?.ShippingProfileID || null,
          shippingProfileName: item.SellerProfiles.SellerShippingProfile?.ShippingProfileName || null,
        } : null,

        // Store Information
        storefront: item.Storefront ? {
          storeCategoryID: item.Storefront.StoreCategoryID || null,
          storeCategoryName: item.Storefront.StoreCategoryName || null,
          storeCategory2ID: item.Storefront.StoreCategory2ID || null,
          storeCategory2Name: item.Storefront.StoreCategory2Name || null,
          storeURL: item.Storefront.StoreURL || null,
        } : null,

        // Best Offer
        bestOfferDetails: item.BestOfferDetails ? {
          bestOfferEnabled: item.BestOfferDetails.BestOfferEnabled || false,
          newBestOffer: item.BestOfferDetails.NewBestOffer || false,
          bestOfferCount: item.BestOfferDetails.BestOfferCount || 0,
        } : null,

        // Discount Price Info
        discountPriceInfo: item.DiscountPriceInfo ? {
          originalRetailPrice: item.DiscountPriceInfo.OriginalRetailPrice?._value || null,
          minimumAdvertisedPrice: item.DiscountPriceInfo.MinimumAdvertisedPrice?._value || null,
          minimumAdvertisedPriceExposure: item.DiscountPriceInfo.MinimumAdvertisedPriceExposure || null,
        } : null,

        // VAT Details
        vatDetails: item.VATDetails ? {
          businessSeller: item.VATDetails.BusinessSeller || false,
          vatPercent: item.VATDetails.VATPercent || null,
        } : null,

        // Additional Fields
        dispatchTimeMax: item.DispatchTimeMax || null,
        hitCount: item.HitCount || null,
        watchCount: item.WatchCount || null,
        privateListing: item.PrivateListing || false,
        listingEnhancement: item.ListingEnhancement || [],
        uuid: item.UUID || null,
        topRatedListing: item.TopRatedListing || false,

        // Raw data (for any fields we might have missed)
        _raw: item
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