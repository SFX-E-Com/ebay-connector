import { NextRequest, NextResponse } from 'next/server';
import { EbayAccountService } from '@/app/lib/services/ebayAccountService';
import { EbayTradingApiService } from '@/app/lib/services/ebay-trading-api';

// GET /api/ebay/[accountId]/trading/test - Test Trading API connection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;

  try {
    console.log(`[TRADING API TEST] Testing connection for account: ${accountId}`);

    // Get the eBay account with OAuth token
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
    const tokenExpiresAt = new Date(account.expiresAt);
    const now = new Date();
    const isExpired = tokenExpiresAt < now;

    console.log('[TRADING API TEST] Account details:');
    console.log('  - eBay User ID:', account.ebayUserId);
    console.log('  - eBay Username:', account.ebayUsername);
    console.log('  - Token expires at:', tokenExpiresAt.toISOString());
    console.log('  - Current time:', now.toISOString());
    console.log('  - Token expired:', isExpired);
    console.log('  - Access token (first 20 chars):', account.accessToken.substring(0, 20) + '...');

    if (isExpired) {
      return NextResponse.json(
        {
          success: false,
          message: 'OAuth token expired. Please reconnect your eBay account.',
          details: {
            expiredAt: tokenExpiresAt.toISOString(),
            currentTime: now.toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Get marketplace from query params
    const { searchParams } = new URL(request.url);
    const marketplace = searchParams.get('marketplace') || 'EBAY_DE';

    console.log('[TRADING API TEST] Testing with marketplace:', marketplace);
    console.log('[TRADING API TEST] Environment:', process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION');

    // Initialize Trading API service
    const tradingApi = new EbayTradingApiService(account as any, marketplace);

    try {
      // Test with GetUser call
      console.log('[TRADING API TEST] Making GetUser call to validate authentication...');
      const userResult = await tradingApi.getUser();

      console.log('[TRADING API TEST] Success! User details retrieved:', userResult);

      return NextResponse.json({
        success: true,
        message: 'Trading API connection successful!',
        data: {
          authenticated: true,
          user: userResult,
          account: {
            id: accountId,
            ebayUserId: account.ebayUserId,
            ebayUsername: account.ebayUsername,
          },
          token: {
            expiresAt: tokenExpiresAt.toISOString(),
            remainingTime: Math.floor((tokenExpiresAt.getTime() - now.getTime()) / 1000 / 60) + ' minutes',
          },
          environment: process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION',
          marketplace: marketplace,
          apiType: 'TRADING',
        },
      });
    } catch (apiError: any) {
      console.error('[TRADING API TEST] API Error:', apiError);

      return NextResponse.json(
        {
          success: false,
          message: 'Trading API authentication failed',
          errors: apiError.errors || [
            {
              code: 'UNKNOWN',
              shortMessage: apiError.message || 'Unknown error',
            },
          ],
          details: {
            marketplace,
            environment: process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION',
          },
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('[TRADING API TEST] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test Trading API connection',
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}