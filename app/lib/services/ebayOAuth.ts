const EbayAuthToken = require('ebay-oauth-nodejs-client');

export class EbayOAuthService {
  private ebayAuthToken: any;

  constructor() {
    // Verify required environment variables
    if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET || !process.env.EBAY_REDIRECT_URI) {
      throw new Error('Missing required eBay OAuth environment variables: EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_REDIRECT_URI');
    }

    // Initialize with proper configuration for the eBay OAuth library
    this.ebayAuthToken = new EbayAuthToken({
      clientId: process.env.EBAY_CLIENT_ID,
      clientSecret: process.env.EBAY_CLIENT_SECRET,
      redirectUri: process.env.EBAY_REDIRECT_URI
    });
  }

  /**
   * Generate authorization URL for user consent
   */
  generateUserAuthorizationUrl(state: string, scopes?: string[]): string {
    const defaultScopes = [
      'https://api.ebay.com/oauth/api_scope',
      'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.marketing',
      'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.account',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.finances',
      'https://api.ebay.com/oauth/api_scope/sell.payment.dispute',
      'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly'
    ];

    const environment = process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION';
    const scopesToUse = scopes || defaultScopes;

    return this.ebayAuthToken.generateUserAuthorizationUrl(
      environment,
      scopesToUse,
      { state }
    );
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForAccessToken(code: string): Promise<any> {
    try {
      const token = await this.ebayAuthToken.exchangeCodeForAccessToken(
        process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION',
        code
      );
      return token;
    } catch (error) {
      console.error('Error exchanging code for access token:', error);
      throw error;
    }
  }

  /**
   * Get application token (for app-only API calls)
   */
  async getApplicationToken(scopes?: string[]): Promise<string> {
    try {
      const defaultScopes = [
        'https://api.ebay.com/oauth/api_scope',
        'https://api.ebay.com/oauth/api_scope/buy.product.feed'
      ];

      const token = await this.ebayAuthToken.getApplicationToken(
        process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION',
        scopes || defaultScopes
      );
      return token;
    } catch (error) {
      console.error('Error getting application token:', error);
      throw error;
    }
  }

  /**
   * Refresh an expired access token
   */
  async refreshUserAccessToken(refreshToken: string, scopes?: string[]): Promise<any> {
    try {
      const defaultScopes = [
        'https://api.ebay.com/oauth/api_scope',
        'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.marketing',
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.account',
        'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
        'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.finances',
        'https://api.ebay.com/oauth/api_scope/sell.payment.dispute',
        'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly'
      ];

      const token = await this.ebayAuthToken.getAccessToken(
        process.env.EBAY_SANDBOX === 'true' ? 'SANDBOX' : 'PRODUCTION',
        refreshToken,
        scopes || defaultScopes
      );
      return token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const baseUrl = process.env.EBAY_SANDBOX === 'true'
        ? 'https://apiz.sandbox.ebay.com'
        : 'https://apiz.ebay.com';

      const response = await fetch(`${baseUrl}/commerce/identity/v1/user/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  /**
   * Validate if token is expired
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() >= new Date(expiresAt);
  }

  /**
   * Calculate expiration date from expires_in seconds
   */
  calculateExpirationDate(expiresInSeconds: number): Date {
    return new Date(Date.now() + (expiresInSeconds * 1000));
  }
}

// Lazy initialization to prevent build-time errors
let _ebayOAuthService: EbayOAuthService | null = null;

export function getEbayOAuthService(): EbayOAuthService {
  if (!_ebayOAuthService) {
    _ebayOAuthService = new EbayOAuthService();
  }
  return _ebayOAuthService;
}

// For backward compatibility - will throw at runtime if env vars missing
export const ebayOAuthService = {
  get instance() {
    return getEbayOAuthService();
  },
  generateUserAuthorizationUrl(state: string, scopes?: string[]) {
    return getEbayOAuthService().generateUserAuthorizationUrl(state, scopes);
  },
  exchangeCodeForAccessToken(code: string) {
    return getEbayOAuthService().exchangeCodeForAccessToken(code);
  },
  getApplicationToken(scopes?: string[]) {
    return getEbayOAuthService().getApplicationToken(scopes);
  },
  refreshUserAccessToken(refreshToken: string, scopes?: string[]) {
    return getEbayOAuthService().refreshUserAccessToken(refreshToken, scopes);
  },
  getUserInfo(accessToken: string) {
    return getEbayOAuthService().getUserInfo(accessToken);
  },
  isTokenExpired(expiresAt: Date) {
    return getEbayOAuthService().isTokenExpired(expiresAt);
  },
  calculateExpirationDate(expiresInSeconds: number) {
    return getEbayOAuthService().calculateExpirationDate(expiresInSeconds);
  }
};