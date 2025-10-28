// eBay Trading API Configuration

export const TRADING_API_CONFIG = {
  production: {
    url: 'https://api.ebay.com/ws/api.dll',
    version: '1157',
  },
  sandbox: {
    url: 'https://api.sandbox.ebay.com/ws/api.dll',
    version: '1157',
  },
  siteIds: {
    'EBAY_US': 0,
    'EBAY_CA': 2,
    'EBAY_GB': 3,
    'EBAY_AU': 15,
    'EBAY_AT': 16,
    'EBAY_BE_FR': 23,
    'EBAY_FR': 71,
    'EBAY_DE': 77,
    'EBAY_IT': 101,
    'EBAY_BE_NL': 123,
    'EBAY_NL': 146,
    'EBAY_ES': 186,
    'EBAY_CH': 193,
    'EBAY_HK': 201,
    'EBAY_IN': 203,
    'EBAY_IE': 205,
    'EBAY_MY': 207,
    'EBAY_PH': 211,
    'EBAY_PL': 212,
    'EBAY_SG': 216,
  },
  headers: {
    'Content-Type': 'text/xml',
    'X-EBAY-API-COMPATIBILITY-LEVEL': '1157',
  },
};

// Condition ID mapping for Trading API
export const CONDITION_IDS = {
  'NEW': 1000,
  'NEW_OTHER': 1500,
  'NEW_WITH_DEFECTS': 1750,
  'MANUFACTURER_REFURBISHED': 2000,
  'SELLER_REFURBISHED': 2500,
  'LIKE_NEW': 3000,
  'VERY_GOOD': 4000,
  'GOOD': 5000,
  'ACCEPTABLE': 6000,
  'FOR_PARTS': 7000,
};

// Get site ID from marketplace
export function getSiteId(marketplace: string): number {
  return TRADING_API_CONFIG.siteIds[marketplace as keyof typeof TRADING_API_CONFIG.siteIds] || 0;
}

// Get country code from marketplace
export function getCountryCode(marketplace: string): string {
  const countryMap: Record<string, string> = {
    'EBAY_US': 'US',
    'EBAY_CA': 'CA',
    'EBAY_GB': 'GB',
    'EBAY_AU': 'AU',
    'EBAY_AT': 'AT',
    'EBAY_BE_FR': 'BE',
    'EBAY_FR': 'FR',
    'EBAY_DE': 'DE',
    'EBAY_IT': 'IT',
    'EBAY_BE_NL': 'BE',
    'EBAY_NL': 'NL',
    'EBAY_ES': 'ES',
    'EBAY_CH': 'CH',
    'EBAY_HK': 'HK',
    'EBAY_IN': 'IN',
    'EBAY_IE': 'IE',
    'EBAY_MY': 'MY',
    'EBAY_PH': 'PH',
    'EBAY_PL': 'PL',
    'EBAY_SG': 'SG',
  };
  return countryMap[marketplace] || 'US';
}

// Get currency from marketplace
export function getCurrency(marketplace: string): string {
  const currencyMap: Record<string, string> = {
    'EBAY_US': 'USD',
    'EBAY_CA': 'CAD',
    'EBAY_GB': 'GBP',
    'EBAY_AU': 'AUD',
    'EBAY_AT': 'EUR',
    'EBAY_BE_FR': 'EUR',
    'EBAY_FR': 'EUR',
    'EBAY_DE': 'EUR',
    'EBAY_IT': 'EUR',
    'EBAY_BE_NL': 'EUR',
    'EBAY_NL': 'EUR',
    'EBAY_ES': 'EUR',
    'EBAY_CH': 'CHF',
    'EBAY_HK': 'HKD',
    'EBAY_IN': 'INR',
    'EBAY_IE': 'EUR',
    'EBAY_MY': 'MYR',
    'EBAY_PH': 'PHP',
    'EBAY_PL': 'PLN',
    'EBAY_SG': 'SGD',
  };
  return currencyMap[marketplace] || 'USD';
}