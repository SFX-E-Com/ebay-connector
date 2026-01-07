import { NextRequest, NextResponse } from 'next/server';

function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  const host = request.headers.get('host') || request.nextUrl.host;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (process.env.DEBUG_LOGGING === 'true') {
      console.error('eBay OAuth declined:', { error, errorDescription });
    }

    const baseUrl = getBaseUrl(request);
    const response = NextResponse.redirect(
      new URL('/ebay-connections?error=oauth_declined', baseUrl)
    );
    response.cookies.delete('ebay_oauth_state');

    return response;
  } catch (err) {
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(
      new URL('/ebay-connections?error=oauth_error', baseUrl)
    );
  }
}