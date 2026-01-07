import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/app/lib/services/auth';
import { EbayTokenRefreshService } from '@/app/lib/services/ebayTokenRefresh';
import { EbayAccountService } from '@/app/lib/services/ebayAccountService';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const decoded = TokenService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Find the account that needs token refresh
    const account = await EbayAccountService.getAccountById(accountId);

    if (!account || account.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    if (!account.refreshToken) {
      return NextResponse.json(
        { success: false, message: 'No refresh token available' },
        { status: 400 }
      );
    }

    // Check if token is actually expired (use consolidated service)
    if (!EbayTokenRefreshService.isTokenExpired(account.expiresAt)) {
      return NextResponse.json({
        success: true,
        message: 'Token is still valid',
        data: {
          id: account.id,
          ebayUserId: account.ebayUserId,
          ebayUsername: account.ebayUsername,
          expiresAt: account.expiresAt,
          status: account.status,
        }
      });
    }

    // Refresh the access token using consolidated service (direct HTTP, no hardcoded scopes)
    const newTokenData = await EbayTokenRefreshService.refreshEbayToken(account.refreshToken);

    // Update the account with new token data using consolidated service
    await EbayTokenRefreshService.updateTokenInDatabase(accountId, newTokenData);

    // Get updated account
    const updatedAccount = await EbayAccountService.getAccountById(accountId);

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: updatedAccount,
    });
  } catch (error) {
    console.error('Error refreshing eBay token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
