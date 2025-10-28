import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/services/database';
import { EbayTradingApiService } from '@/app/lib/services/ebay-trading-api';

interface TradingListingRequest {
  // Required fields
  sku: string;
  title: string;
  description: string;
  categoryId: string;
  price: number;
  quantity: number;

  // Marketplace (defaults to EBAY_US)
  marketplace?: string;

  // Condition
  condition?: string;
  conditionDescription?: string;

  // Location
  location?: string;
  postalCode?: string;

  // Images
  images?: string[];

  // Item specifics (e.g., brand, model, etc.)
  itemSpecifics?: Record<string, string | string[]>;

  // Shipping
  shippingOptions?: Array<{
    service: string;
    cost: number;
    additionalCost?: number;
  }>;

  // Return policy
  returnPolicy?: {
    returnsAccepted: boolean;
    refundOption?: string;
    returnsWithin?: string;
    shippingCostPaidBy?: string;
    description?: string;
  };

  // Payment
  paymentMethods?: string[];
  paypalEmail?: string;

  // Other options
  handlingTime?: number;
  listingDuration?: string;

  // Business policies (if using business accounts)
  sellerProfiles?: {
    paymentProfile?: string;
    returnProfile?: string;
    shippingProfile?: string;
  };

  // Verify only (don't create, just check fees and validation)
  verifyOnly?: boolean;
}

// POST /api/ebay/[accountId]/trading/listing - Create listing using Trading API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;

  try {
    console.log(`[TRADING API] POST request for account: ${accountId}`);

    const body: TradingListingRequest = await request.json();

    // Log request details
    console.log('[TRADING API] ====== REQUEST DETAILS ======');
    console.log('[TRADING API] SKU:', body.sku);
    console.log('[TRADING API] Title:', body.title);
    console.log('[TRADING API] Marketplace:', body.marketplace || 'EBAY_US');
    console.log('[TRADING API] Category:', body.categoryId);
    console.log('[TRADING API] Price:', body.price);
    console.log('[TRADING API] Quantity:', body.quantity);
    console.log('[TRADING API] Condition:', body.condition);
    console.log('[TRADING API] Verify Only:', body.verifyOnly);
    console.log('[TRADING API] ==============================');

    // Validate required fields
    if (!body.sku || !body.title || !body.description || !body.categoryId || !body.price || !body.quantity) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: sku, title, description, categoryId, price, quantity',
        },
        { status: 400 }
      );
    }

    // Get the eBay account with OAuth token
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
    const tradingApi = new EbayTradingApiService(
      account as any,
      body.marketplace || 'EBAY_US'
    );

    console.log('[TRADING API] Using account:', account.ebayUsername || account.ebayUserId);
    console.log('[TRADING API] Token expires at:', account.expiresAt);
    console.log('[TRADING API] Environment:', process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION');

    try {
      let result;

      if (body.verifyOnly) {
        // Verify listing without creating
        console.log('[TRADING API] Verifying listing (not creating)...');
        result = await tradingApi.verifyAddFixedPriceItem(body);

        console.log('[TRADING API] Verification result:', result);

        return NextResponse.json({
          success: true,
          message: 'Listing verified successfully',
          data: {
            fees: result.fees,
            errors: result.errors,
            warnings: result.warnings,
          },
          metadata: {
            account_used: account.ebayUsername || account.ebayUserId,
            account_id: accountId,
            marketplace: body.marketplace || 'EBAY_US',
            api_type: 'TRADING',
            verified_only: true,
          },
        });
      } else {
        // Create actual listing
        console.log('[TRADING API] Creating listing...');
        result = await tradingApi.addFixedPriceItem(body);

        console.log('[TRADING API] Listing created successfully!');
        console.log('[TRADING API] Item ID:', result.itemId);
        console.log('[TRADING API] Fees:', result.fees);

        // Optionally store in database for tracking
        // You can add database storage here if needed

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
            account_used: account.ebayUsername || account.ebayUserId,
            account_id: accountId,
            marketplace: body.marketplace || 'EBAY_US',
            api_type: 'TRADING',
          },
        });
      }
    } catch (apiError: any) {
      console.error('[TRADING API] API Error:', apiError);

      // Parse Trading API errors
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
    console.error('[TRADING API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create listing via Trading API',
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

// GET /api/ebay/[accountId]/trading/listing - Get listing details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Item ID is required',
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

    // Initialize Trading API service
    const tradingApi = new EbayTradingApiService(account as any);

    // Get item details
    const result = await tradingApi.getItem(itemId);

    return NextResponse.json({
      success: true,
      data: result.item,
      metadata: {
        account_used: account.ebayUsername || account.ebayUserId,
        account_id: accountId,
      },
    });
  } catch (error: any) {
    console.error('[TRADING API] GET Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get listing details',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT /api/ebay/[accountId]/trading/listing - Update listing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;

  try {
    console.log(`[TRADING API] PUT request for account: ${accountId}`);

    const body = await request.json();
    const { itemId, sku, marketplace = 'EBAY_US', ...updates } = body;

    // Need either itemId or SKU
    if (!itemId && !sku) {
      return NextResponse.json(
        {
          success: false,
          message: 'Either Item ID or SKU is required',
        },
        { status: 400 }
      );
    }

    console.log('[TRADING API UPDATE] ====== REQUEST DETAILS ======');
    console.log('[TRADING API UPDATE] Item ID:', itemId);
    console.log('[TRADING API UPDATE] SKU:', sku);
    console.log('[TRADING API UPDATE] Marketplace:', marketplace);
    console.log('[TRADING API UPDATE] Updates:', JSON.stringify(updates, null, 2));
    console.log('[TRADING API UPDATE] ==============================');

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

    console.log('[TRADING API UPDATE] Using account:', account.ebayUsername || account.ebayUserId);

    try {
      // If SKU provided instead of itemId, use it
      const identifier = itemId || sku;

      // Update listing
      const result = await tradingApi.reviseFixedPriceItem(identifier, updates);

      console.log('[TRADING API UPDATE] Listing updated successfully');

      return NextResponse.json({
        success: true,
        message: 'Listing updated successfully',
        data: result,
        metadata: {
          account_used: account.ebayUsername || account.ebayUserId,
          account_id: accountId,
          marketplace: marketplace,
          api_type: 'TRADING',
        },
      });
    } catch (apiError: any) {
      console.error('[TRADING API UPDATE] API Error:', apiError);

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
    console.error('[TRADING API UPDATE] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update listing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/ebay/[accountId]/trading/listing - End listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;

  try {
    console.log(`[TRADING API] DELETE request for account: ${accountId}`);

    const { searchParams } = new URL(request.url);
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
        },
        { status: 400 }
      );
    }

    console.log('[TRADING API DELETE] ====== REQUEST DETAILS ======');
    console.log('[TRADING API DELETE] Item ID:', itemId);
    console.log('[TRADING API DELETE] SKU:', sku);
    console.log('[TRADING API DELETE] Reason:', reason);
    console.log('[TRADING API DELETE] Marketplace:', marketplace);
    console.log('[TRADING API DELETE] ==============================');

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
      console.warn(`[TRADING API DELETE] Invalid reason: ${reason}, using default: OtherListingError`);
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

    console.log('[TRADING API DELETE] Using account:', account.ebayUsername || account.ebayUserId);

    try {
      // Use itemId or SKU
      const identifier = itemId || sku;

      // End listing
      const result = await tradingApi.endFixedPriceItem(identifier!, reason);

      console.log('[TRADING API DELETE] Listing ended successfully');

      return NextResponse.json({
        success: true,
        message: 'Listing ended successfully',
        data: {
          ...result,
          reason: reason,
          identifier: identifier,
        },
        metadata: {
          account_used: account.ebayUsername || account.ebayUserId,
          account_id: accountId,
          marketplace: marketplace,
          api_type: 'TRADING',
        },
      });
    } catch (apiError: any) {
      console.error('[TRADING API DELETE] API Error:', apiError);

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
    console.error('[TRADING API DELETE] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to end listing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}