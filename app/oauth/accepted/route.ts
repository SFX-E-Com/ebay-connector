import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Accepted Route - Redirects to the actual callback handler
 *
 * This route exists because the eBay RuName (Redirect URL Name) points here,
 * but the actual callback logic is in /api/ebay/oauth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get all query parameters from eBay
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const expiresIn = searchParams.get('expires_in');

  // Build the callback URL with all parameters
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const callbackUrl = new URL('/api/ebay/oauth/callback', baseUrl);

  // Forward all parameters
  if (code) callbackUrl.searchParams.set('code', code);
  if (state) callbackUrl.searchParams.set('state', state);
  if (error) callbackUrl.searchParams.set('error', error);
  if (errorDescription) callbackUrl.searchParams.set('error_description', errorDescription);
  if (expiresIn) callbackUrl.searchParams.set('expires_in', expiresIn);

  console.log('=== OAUTH ACCEPTED REDIRECT ===');
  console.log('Received at /oauth/accepted');
  console.log('Redirecting to:', callbackUrl.toString());
  console.log('Code present:', !!code);
  console.log('State:', state);

  // Redirect to the actual callback handler
  return NextResponse.redirect(callbackUrl.toString());
}
