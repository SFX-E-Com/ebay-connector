import { NextRequest, NextResponse } from 'next/server';
import { EbayAccountService } from '@/app/lib/services/ebayAccountService';
import { EBAY_OAUTH_SCOPES } from '@/app/lib/constants/ebayScopes';
import { EBAY_SCOPES, getEbayConfig, getEbayUrls } from '@/app/lib/config/ebay';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const isDebug = process.env.DEBUG_LOGGING === 'true' || searchParams.get('debug') === '1';

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'Account ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_REDIRECT_URI) {
      return NextResponse.json(
        { success: false, message: 'eBay OAuth configuration missing' },
        { status: 500 }
      );
    }

    const config = getEbayConfig();
    const urls = getEbayUrls(config.isProduction);

    const account = await EbayAccountService.getAccountById(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    const isSandbox = process.env.EBAY_SANDBOX === 'true';

    const allScopeUrls = EBAY_OAUTH_SCOPES
      .filter(scope => !isSandbox || (scope as { sandboxAvailable?: boolean }).sandboxAvailable !== false)
      .map(scope => scope.url);

    const basicScope = EBAY_SCOPES.READ_BASIC;
    if (!allScopeUrls.includes(basicScope)) {
      allScopeUrls.unshift(basicScope);
    }

    const scopes = allScopeUrls.join(' ');
    const state = `${accountId}_${Math.random().toString(36).substring(2, 15)}`;

    const authUrl = new URL(urls.auth);
    authUrl.searchParams.set('client_id', process.env.EBAY_CLIENT_ID!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', process.env.EBAY_REDIRECT_URI!);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'login');

    if (isDebug) {
      console.log('OAuth authorize:', {
        environment: isSandbox ? 'SANDBOX' : 'PRODUCTION',
        scopeCount: allScopeUrls.length,
        state: state.substring(0, 30)
      });
    }

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('ebay_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600
    });

    return response;
  } catch (error) {
    console.error('Error initiating eBay OAuth:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initiate eBay OAuth' },
      { status: 500 }
    );
  }
}