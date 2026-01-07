import { NextRequest, NextResponse } from 'next/server';
import { EbayAccountService } from '@/app/lib/services/ebayAccountService';
import { EBAY_SCOPES } from '@/app/lib/config/ebay';

/**
 * Get the public base URL from request headers.
 * Cloud Run sets X-Forwarded-* headers with the public URL.
 */
function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  // Fallback for local development
  const host = request.headers.get('host') || request.nextUrl.host;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

/**
 * Check if this is an API call (fetch) vs direct browser navigation.
 */
function isApiCall(request: NextRequest): boolean {
  return request.headers.get('accept')?.includes('application/json') === true ||
         request.headers.get('x-requested-with') === 'XMLHttpRequest';
}

/**
 * Return either JSON or redirect based on how the endpoint was called.
 */
function respondWithSuccessOrRedirect(
  request: NextRequest,
  baseUrl: string,
  data: Record<string, unknown>
): NextResponse {
  const redirectPath = '/ebay-connections?success=connected';
  
  if (isApiCall(request)) {
    return NextResponse.json({
      success: true,
      ...data,
      redirectTo: redirectPath
    });
  }
  
  const response = NextResponse.redirect(new URL(redirectPath, baseUrl));
  response.cookies.delete('ebay_oauth_state');
  return response;
}

function respondWithErrorOrRedirect(
  request: NextRequest,
  baseUrl: string,
  errorCode: string,
  message: string
): NextResponse {
  const redirectPath = `/ebay-connections?error=${errorCode}`;
  
  if (isApiCall(request)) {
    return NextResponse.json({
      success: false,
      error: errorCode,
      message
    }, { status: 400 });
  }
  
  return NextResponse.redirect(new URL(redirectPath, baseUrl));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDebug = process.env.DEBUG_LOGGING === 'true' || searchParams.get('debug') === '1';
  
  if (isDebug) console.log('========== OAUTH CALLBACK START ==========');
  
  try {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (isDebug) {
      console.log('CALLBACK PARAMS:', { 
        hasCode: !!code, 
        codeLength: code?.length || 0,
        hasState: !!state,
        state: state?.substring(0, 30),
        hasError: !!error 
      });
    }

    const baseUrl = getBaseUrl(request);

    if (error) {
      if (isDebug) console.error('eBay OAuth error received:', error);
      return respondWithErrorOrRedirect(request, baseUrl, 'oauth_failed', 'eBay authorization failed');
    }

    if (!code) {
      if (isDebug) console.error('Missing required parameters:', { code: !!code, state: !!state });
      return respondWithErrorOrRedirect(request, baseUrl, 'missing_params', 'Missing authorization code');
    }

    if (state) {
      const storedState = request.cookies.get('ebay_oauth_state')?.value;

      if (isDebug) {
        console.log('=== STATE PARAMETER DEBUG ===');
        console.log('Received state from eBay:', state);
        console.log('Stored state in cookie:', storedState);
        console.log('States match:', storedState === state);
      }

      if (!storedState || storedState !== state) {
        if (isDebug) console.error('State parameter mismatch or missing');
        return respondWithErrorOrRedirect(request, baseUrl, 'invalid_state', 'State parameter mismatch');
      }
    } else {
      if (isDebug) console.warn('State parameter missing - this might be from consent flow');
    }

    let accountId: string | null = null;

    if (state) {
      accountId = state.split('_')[0];
    } else {
      if (isDebug) console.warn('No state parameter - cannot determine account ID');
      return respondWithErrorOrRedirect(request, baseUrl, 'missing_account_id', 'Cannot determine account');
    }

    if (!accountId) {
      if (isDebug) console.error('Could not extract account ID from state');
      return respondWithErrorOrRedirect(request, baseUrl, 'invalid_account', 'Invalid account ID');
    }

    if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET || !process.env.EBAY_REDIRECT_URI) {
      if (isDebug) console.error('Missing required environment variables');
      return respondWithErrorOrRedirect(request, baseUrl, 'missing_config', 'Server configuration error');
    }

    const tokenUrl = process.env.EBAY_SANDBOX === 'true'
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';

    const credentials = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');
    const redirectValue = process.env.EBAY_REDIRECT_URI;

    if (isDebug) {
      console.log('=== TOKEN EXCHANGE ===');
      console.log('Environment:', process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION');
      console.log('Token URL:', tokenUrl);
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectValue!
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    });

    if (isDebug) console.log('TOKEN EXCHANGE: Response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      if (isDebug) console.error('TOKEN EXCHANGE FAILED:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (isDebug) {
      console.log('TOKEN EXCHANGE SUCCESS:', {
        hasAccessToken: !!tokenData.access_token,
        accessTokenLength: tokenData.access_token?.length || 0,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scopes: tokenData.scope?.split(' ')?.length || 0
      });
    }

    let ebayUserId = `ebay_user_${Date.now()}`;
    let ebayUsername = null;

    try {
      const baseApiUrl = process.env.EBAY_SANDBOX === 'true'
        ? 'https://apiz.sandbox.ebay.com'
        : 'https://apiz.ebay.com';

      const userResponse = await fetch(`${baseApiUrl}/commerce/identity/v1/user/`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        ebayUserId = userData.userId || ebayUserId;
        ebayUsername = userData.username || null;
        
        if (isDebug) {
          console.log('USER INFO:', { userId: ebayUserId, username: ebayUsername });
        }
      } else if (isDebug) {
        console.error('User info request failed:', userResponse.status);
      }
    } catch (userInfoError) {
      if (isDebug) console.warn('Could not fetch user info:', userInfoError);
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    const refreshTokenExpiresAt = tokenData.refresh_token_expires_in 
      ? new Date(Date.now() + (tokenData.refresh_token_expires_in * 1000))
      : new Date(Date.now() + (47304000 * 1000));

    const grantedScopes = tokenData.scope ? tokenData.scope.split(' ') : [EBAY_SCOPES.READ_BASIC];

    const updateData = {
      ebayUserId: ebayUserId,
      ebayUsername: ebayUsername,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || undefined,
      expiresAt: expiresAt,
      refreshTokenExpiresAt: refreshTokenExpiresAt,
      tokenType: tokenData.token_type || 'Bearer',
      scopes: grantedScopes,
      status: 'active',
    };

    if (isDebug) {
      console.log('DATABASE UPDATE:', { accountId, tokenLength: tokenData.access_token?.length || 0 });
    }

    const updatedAccount = await EbayAccountService.updateAccount(accountId, updateData);

    if (isDebug) {
      console.log('DATABASE UPDATE RESULT:', { success: !!updatedAccount, status: updatedAccount?.status });
      console.log('========== OAUTH CALLBACK END ==========');
    }

    return respondWithSuccessOrRedirect(request, baseUrl, {
      message: 'eBay account connected successfully',
      accountId: updatedAccount?.id,
      ebayUsername: ebayUsername
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('OAUTH CALLBACK ERROR:', errorMessage);

    const baseUrl = getBaseUrl(request);
    return respondWithErrorOrRedirect(request, baseUrl, 'callback_failed', errorMessage);
  }
}