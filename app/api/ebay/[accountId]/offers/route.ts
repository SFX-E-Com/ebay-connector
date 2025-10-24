import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/services/database';
import { EbayListingService, OfferRequest, validateOfferRequest } from '../../../../lib/services/ebay-listing';

// GET /api/ebay/[accountId]/offers - Get all offers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;
  try {
    console.log(`[OFFERS API] GET request for account: ${accountId}`);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sku = searchParams.get('sku') || undefined;

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

    // Initialize eBay service
    const ebayService = new EbayListingService(account);

    // Get offers from eBay
    const offers = await ebayService.getOffers(limit, offset, sku);

    console.log(`[OFFERS API] Retrieved ${offers.offers?.length || 0} offers`);

    return NextResponse.json({
      success: true,
      data: offers,
      metadata: {
        account_used: account.friendlyName || account.ebayUsername,
        account_id: accountId,
        query_params: { limit, offset, sku },
      },
    });
  } catch (error: any) {
    console.error('[OFFERS API] GET Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve offers',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/ebay/[accountId]/offers - Create new offer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;
  try {
    console.log(`[OFFERS API] POST request for account: ${accountId}`);

    const body = await request.json();

    console.log('[OFFERS API] ====== CREATE OFFER REQUEST ======');
    console.log('[OFFERS API] SKU:', body.sku);
    console.log('[OFFERS API] Marketplace:', body.marketplaceId);
    console.log('[OFFERS API] Format:', body.format);
    console.log('[OFFERS API] Category:', body.categoryId);
    console.log('[OFFERS API] Full request body:', JSON.stringify(body, null, 2));
    console.log('[OFFERS API] ===================================');

    // Validate offer request
    const validationErrors = validateOfferRequest(body);
    if (validationErrors.length > 0) {
      console.error('[OFFERS API] Validation errors:', validationErrors);
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
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

    console.log('[OFFERS API] Using account:', account.friendlyName || account.ebayUsername);
    console.log('[OFFERS API] Environment:', process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION');

    // Initialize eBay service
    const ebayService = new EbayListingService(account);

    // First verify the inventory item exists
    console.log('[OFFERS API] Verifying inventory item exists...');
    let inventoryItem;
    try {
      inventoryItem = await ebayService.getInventoryItem(body.sku);
      console.log('[OFFERS API] ✅ Inventory item found');
      console.log('[OFFERS API] Inventory details:', JSON.stringify(inventoryItem, null, 2).substring(0, 500));
    } catch (invError: any) {
      console.error('[OFFERS API] ❌ Inventory item not found:', invError.message);
      return NextResponse.json(
        {
          success: false,
          message: `Inventory item with SKU ${body.sku} not found. Please create the inventory item first.`,
          error: invError.message,
          suggestion: 'Use the /api/ebay/{accountId}/inventory/{sku} endpoint to create the inventory item first',
        },
        { status: 404 }
      );
    }

    // Update inventory item with German locale if needed
    if (body.marketplaceId === 'EBAY_DE' && inventoryItem.locale !== 'de_DE') {
      console.log('[OFFERS API] Updating inventory item with German locale...');
      try {
        const updatedItem = {
          ...inventoryItem,
          locale: 'de_DE'  // Set German locale
        };

        await ebayService.createOrUpdateInventoryItem({
          sku: body.sku,
          ...updatedItem
        });

        console.log('[OFFERS API] ✅ Inventory item updated with German locale');

        // Wait a bit for the update to propagate
        console.log('[OFFERS API] Waiting 5 seconds for locale update to propagate...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (updateError: any) {
        console.warn('[OFFERS API] Could not update locale:', updateError.message);
      }
    }

    // Create offer on eBay
    console.log('[OFFERS API] Creating offer...');
    const offerData: OfferRequest = body;

    try {
      const result = await ebayService.createOffer(offerData);

      console.log('[OFFERS API] ✅ Offer created successfully!');
      console.log('[OFFERS API] Offer ID:', result.offerId);
      console.log('[OFFERS API] Full response:', JSON.stringify(result, null, 2));

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Offer created successfully',
        metadata: {
          account_used: account.friendlyName || account.ebayUsername,
          account_id: accountId,
          sku: body.sku,
          offer_id: result.offerId,
        },
        next_steps: {
          publish: `POST /api/ebay/${accountId}/offers/${result.offerId}/publish to publish this offer`,
          update: `PUT /api/ebay/${accountId}/offers/${result.offerId} to update this offer`,
          delete: `DELETE /api/ebay/${accountId}/offers/${result.offerId} to delete this offer`,
        }
      });
    } catch (createError: any) {
      console.error('[OFFERS API] ❌ Offer creation failed:', createError.message);

      // Check for specific error scenarios
      if (createError.message.includes('could not be found')) {
        console.error('[OFFERS API] This appears to be a marketplace synchronization issue');
        return NextResponse.json(
          {
            success: false,
            message: 'Inventory item exists but is not yet available for the marketplace',
            error: createError.message,
            suggestion: 'Wait 30-60 seconds for eBay to sync the inventory item across marketplaces, then try again',
            details: {
              sku: body.sku,
              marketplace: body.marketplaceId,
              reason: 'eBay marketplace synchronization delay'
            }
          },
          { status: 503 } // Service Unavailable - temporary issue
        );
      }

      throw createError;
    }
  } catch (error: any) {
    console.error('[OFFERS API] POST Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create offer',
        error: error.message,
      },
      { status: 500 }
    );
  }
}