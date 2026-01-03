import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '../../lib/services/auth';
import { EbayAccountService } from '../../lib/services/ebayAccountService';

export async function GET(request: NextRequest) {
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

    // Fetch eBay accounts for the user
    const ebayAccounts = await EbayAccountService.getUserAccounts(decoded.userId);

    return NextResponse.json({
      success: true,
      data: ebayAccounts,
    });
  } catch (error: any) {
    console.error('Error fetching eBay accounts:', error);
    // Log additional details if available
    if (error.code) console.error('Error code:', error.code);
    if (error.details) console.error('Error details:', error.details);

    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

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

    const {
      ebayUserId,
      ebayUsername,
      accessToken,
      refreshToken,
      expiresAt,
      tokenType = 'Bearer',
      scopes = [],
      selectedScopes = [],
      status = 'inactive', // Default to inactive until OAuth is completed
      friendlyName,
      tags = [],
    } = await request.json();

    // Use selectedScopes if provided, otherwise fall back to scopes
    const finalScopes = selectedScopes.length > 0 ? selectedScopes : scopes;

    // For manual account creation (without OAuth tokens initially)
    if (!ebayUserId && !accessToken) {
      // Create a placeholder account that will be completed later via OAuth
      const placeholderAccount = await EbayAccountService.createAccount({
        userId: decoded.userId,
        ebayUserId: `placeholder_${Date.now()}`, // Temporary placeholder
        ebayUsername: ebayUsername || undefined,
        accessToken: 'pending_oauth', // Placeholder token
        refreshToken: 'pending_oauth', // Placeholder token
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        tokenType,
        scopes: finalScopes,
        userSelectedScopes: selectedScopes,
        status: 'inactive', // Inactive until OAuth is completed
        friendlyName: friendlyName || 'New eBay Account',
        tags,
      });

      return NextResponse.json({
        success: true,
        message: 'eBay account placeholder created successfully',
        data: placeholderAccount,
      });
    }

    // Validation for OAuth-based account creation
    if (!ebayUserId || !accessToken || !expiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: 'ebayUserId, accessToken, and expiresAt are required',
        },
        { status: 400 }
      );
    }

    // Create or update eBay account
    const ebayAccount = await EbayAccountService.upsertAccount({
      userId: decoded.userId,
      ebayUserId,
      ebayUsername,
      accessToken,
      refreshToken,
      expiresAt: new Date(expiresAt),
      tokenType,
      scopes: finalScopes,
      userSelectedScopes: selectedScopes,
      status,
      friendlyName,
      tags,
    });

    return NextResponse.json({
      success: true,
      message: 'eBay account saved successfully',
      data: ebayAccount,
    });
  } catch (error) {
    console.error('Error saving eBay account:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}