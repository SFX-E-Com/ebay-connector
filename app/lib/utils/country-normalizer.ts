/**
 * Country Normalization Utility
 * Normalizes country names and codes to ISO 3166-1 alpha-2 codes
 *
 * Supports:
 * - Full country names (case-insensitive): "Germany", "GERMANY", "germany"
 * - ISO 2-letter codes: "DE", "de"
 * - ISO 3-letter codes: "DEU", "deu"
 * - Common variations and alternate names
 */

interface CountryMapping {
  name: string;
  iso2: string;
  iso3: string;
  alternateNames: string[];
}

const COUNTRY_MAPPINGS: CountryMapping[] = [
  // Europe
  {
    name: 'Germany',
    iso2: 'DE',
    iso3: 'DEU',
    alternateNames: ['Deutschland', 'Federal Republic of Germany', 'Allemagne']
  },
  {
    name: 'France',
    iso2: 'FR',
    iso3: 'FRA',
    alternateNames: ['Francia', 'Frankreich', 'French Republic']
  },
  {
    name: 'United Kingdom',
    iso2: 'GB',
    iso3: 'GBR',
    alternateNames: ['UK', 'Britain', 'Great Britain', 'England', 'United Kingdom of Great Britain and Northern Ireland']
  },
  {
    name: 'Italy',
    iso2: 'IT',
    iso3: 'ITA',
    alternateNames: ['Italia', 'Italien', 'Italian Republic']
  },
  {
    name: 'Spain',
    iso2: 'ES',
    iso3: 'ESP',
    alternateNames: ['España', 'Spanien', 'Kingdom of Spain', 'Espagne']
  },
  {
    name: 'Netherlands',
    iso2: 'NL',
    iso3: 'NLD',
    alternateNames: ['Holland', 'The Netherlands', 'Nederland', 'Niederlande']
  },
  {
    name: 'Belgium',
    iso2: 'BE',
    iso3: 'BEL',
    alternateNames: ['België', 'Belgique', 'Belgien', 'Kingdom of Belgium']
  },
  {
    name: 'Austria',
    iso2: 'AT',
    iso3: 'AUT',
    alternateNames: ['Österreich', 'Autriche', 'Republic of Austria']
  },
  {
    name: 'Switzerland',
    iso2: 'CH',
    iso3: 'CHE',
    alternateNames: ['Schweiz', 'Suisse', 'Svizzera', 'Swiss Confederation']
  },
  {
    name: 'Poland',
    iso2: 'PL',
    iso3: 'POL',
    alternateNames: ['Polska', 'Polen', 'Republic of Poland']
  },
  {
    name: 'Czech Republic',
    iso2: 'CZ',
    iso3: 'CZE',
    alternateNames: ['Czechia', 'Tschechien', 'République tchèque']
  },
  {
    name: 'Ireland',
    iso2: 'IE',
    iso3: 'IRL',
    alternateNames: ['Éire', 'Republic of Ireland', 'Irland']
  },
  {
    name: 'Portugal',
    iso2: 'PT',
    iso3: 'PRT',
    alternateNames: ['Portuguese Republic']
  },
  {
    name: 'Sweden',
    iso2: 'SE',
    iso3: 'SWE',
    alternateNames: ['Sverige', 'Schweden', 'Kingdom of Sweden']
  },
  {
    name: 'Denmark',
    iso2: 'DK',
    iso3: 'DNK',
    alternateNames: ['Danmark', 'Dänemark', 'Kingdom of Denmark']
  },
  {
    name: 'Norway',
    iso2: 'NO',
    iso3: 'NOR',
    alternateNames: ['Norge', 'Norwegen', 'Kingdom of Norway']
  },
  {
    name: 'Finland',
    iso2: 'FI',
    iso3: 'FIN',
    alternateNames: ['Suomi', 'Finnland', 'Republic of Finland']
  },

  // North America
  {
    name: 'United States',
    iso2: 'US',
    iso3: 'USA',
    alternateNames: ['USA', 'United States of America', 'US', 'America', 'U.S.', 'U.S.A.']
  },
  {
    name: 'Canada',
    iso2: 'CA',
    iso3: 'CAN',
    alternateNames: ['Kanada']
  },
  {
    name: 'Mexico',
    iso2: 'MX',
    iso3: 'MEX',
    alternateNames: ['México', 'Mexiko', 'United Mexican States']
  },

  // Asia Pacific
  {
    name: 'Australia',
    iso2: 'AU',
    iso3: 'AUS',
    alternateNames: ['Commonwealth of Australia', 'Australien']
  },
  {
    name: 'China',
    iso2: 'CN',
    iso3: 'CHN',
    alternateNames: ['中国', 'People\'s Republic of China', 'PRC', 'China']
  },
  {
    name: 'Japan',
    iso2: 'JP',
    iso3: 'JPN',
    alternateNames: ['日本', 'Nippon', 'Nihon', 'Japan']
  },
  {
    name: 'India',
    iso2: 'IN',
    iso3: 'IND',
    alternateNames: ['Bharat', 'Republic of India', 'Indien']
  },
  {
    name: 'Singapore',
    iso2: 'SG',
    iso3: 'SGP',
    alternateNames: ['Republic of Singapore', 'Singapur']
  },
  {
    name: 'Hong Kong',
    iso2: 'HK',
    iso3: 'HKG',
    alternateNames: ['Hong Kong SAR', 'Hong Kong Special Administrative Region']
  },
  {
    name: 'South Korea',
    iso2: 'KR',
    iso3: 'KOR',
    alternateNames: ['Korea', 'Republic of Korea', 'ROK', 'Südkorea']
  },
  {
    name: 'New Zealand',
    iso2: 'NZ',
    iso3: 'NZL',
    alternateNames: ['Neuseeland']
  },

  // Middle East
  {
    name: 'United Arab Emirates',
    iso2: 'AE',
    iso3: 'ARE',
    alternateNames: ['UAE', 'Emirates', 'Vereinigte Arabische Emirate']
  },
  {
    name: 'Saudi Arabia',
    iso2: 'SA',
    iso3: 'SAU',
    alternateNames: ['Kingdom of Saudi Arabia', 'Saudi-Arabien']
  },
  {
    name: 'Israel',
    iso2: 'IL',
    iso3: 'ISR',
    alternateNames: ['State of Israel']
  },

  // South America
  {
    name: 'Brazil',
    iso2: 'BR',
    iso3: 'BRA',
    alternateNames: ['Brasil', 'Brasilien', 'Federative Republic of Brazil']
  },
  {
    name: 'Argentina',
    iso2: 'AR',
    iso3: 'ARG',
    alternateNames: ['Argentine Republic', 'Argentinien']
  },
  {
    name: 'Chile',
    iso2: 'CL',
    iso3: 'CHL',
    alternateNames: ['Republic of Chile']
  },

  // Africa
  {
    name: 'South Africa',
    iso2: 'ZA',
    iso3: 'ZAF',
    alternateNames: ['Republic of South Africa', 'RSA', 'Südafrika']
  },
  {
    name: 'Egypt',
    iso2: 'EG',
    iso3: 'EGY',
    alternateNames: ['Ägypten', 'Arab Republic of Egypt']
  },

  // Other European countries
  {
    name: 'Greece',
    iso2: 'GR',
    iso3: 'GRC',
    alternateNames: ['Hellas', 'Griechenland', 'Hellenic Republic']
  },
  {
    name: 'Hungary',
    iso2: 'HU',
    iso3: 'HUN',
    alternateNames: ['Magyarország', 'Ungarn']
  },
  {
    name: 'Romania',
    iso2: 'RO',
    iso3: 'ROU',
    alternateNames: ['România', 'Rumänien']
  },
  {
    name: 'Bulgaria',
    iso2: 'BG',
    iso3: 'BGR',
    alternateNames: ['България', 'Bulgarien']
  },
  {
    name: 'Croatia',
    iso2: 'HR',
    iso3: 'HRV',
    alternateNames: ['Hrvatska', 'Kroatien']
  },
  {
    name: 'Slovakia',
    iso2: 'SK',
    iso3: 'SVK',
    alternateNames: ['Slovensko', 'Slowakei', 'Slovak Republic']
  },
  {
    name: 'Slovenia',
    iso2: 'SI',
    iso3: 'SVN',
    alternateNames: ['Slovenija', 'Slowenien']
  },
  {
    name: 'Luxembourg',
    iso2: 'LU',
    iso3: 'LUX',
    alternateNames: ['Luxemburg', 'Grand Duchy of Luxembourg']
  },
];

/**
 * Create a lookup map for faster searching
 */
const countryLookupMap = new Map<string, string>();

// Populate lookup map
COUNTRY_MAPPINGS.forEach(country => {
  // Add country name
  countryLookupMap.set(country.name.toLowerCase(), country.iso2);

  // Add ISO2 code
  countryLookupMap.set(country.iso2.toLowerCase(), country.iso2);

  // Add ISO3 code
  countryLookupMap.set(country.iso3.toLowerCase(), country.iso2);

  // Add alternate names
  country.alternateNames.forEach(altName => {
    countryLookupMap.set(altName.toLowerCase(), country.iso2);
  });
});

/**
 * Normalize a country name or code to ISO 3166-1 alpha-2 code
 *
 * @param countryInput - Country name, ISO2 code, or ISO3 code (case-insensitive)
 * @returns ISO 3166-1 alpha-2 code (e.g., "DE", "US", "FR") or original input if not found
 *
 * @example
 * normalizeCountry('Germany') // Returns 'DE'
 * normalizeCountry('GERMANY') // Returns 'DE'
 * normalizeCountry('germany') // Returns 'DE'
 * normalizeCountry('DE') // Returns 'DE'
 * normalizeCountry('de') // Returns 'DE'
 * normalizeCountry('DEU') // Returns 'DE'
 * normalizeCountry('Deutschland') // Returns 'DE'
 * normalizeCountry('United States') // Returns 'US'
 * normalizeCountry('USA') // Returns 'US'
 * normalizeCountry('UnknownCountry') // Returns 'UnknownCountry' (unchanged)
 */
export function normalizeCountry(countryInput: string | undefined | null): string {
  // Handle null/undefined
  if (!countryInput || typeof countryInput !== 'string') {
    return '';
  }

  // Trim and normalize
  const normalized = countryInput.trim();

  // If empty after trim, return empty
  if (!normalized) {
    return '';
  }

  // Look up in map
  const iso2Code = countryLookupMap.get(normalized.toLowerCase());

  // Return ISO2 code if found, otherwise return original input (in case it's already correct)
  return iso2Code || normalized;
}

/**
 * Check if a country code/name is valid
 *
 * @param countryInput - Country name or code
 * @returns true if valid, false otherwise
 */
export function isValidCountry(countryInput: string | undefined | null): boolean {
  if (!countryInput) return false;
  return countryLookupMap.has(countryInput.toLowerCase());
}

/**
 * Get full country name from code
 *
 * @param countryCode - ISO2 or ISO3 code
 * @returns Full country name or empty string if not found
 */
export function getCountryName(countryCode: string | undefined | null): string {
  if (!countryCode) return '';

  const iso2 = normalizeCountry(countryCode);
  const country = COUNTRY_MAPPINGS.find(c => c.iso2 === iso2);

  return country ? country.name : '';
}

/**
 * Get ISO3 code from any country input
 *
 * @param countryInput - Country name, ISO2 code, or ISO3 code
 * @returns ISO3 code or empty string if not found
 */
export function getCountryISO3(countryInput: string | undefined | null): string {
  if (!countryInput) return '';

  const iso2 = normalizeCountry(countryInput);
  const country = COUNTRY_MAPPINGS.find(c => c.iso2 === iso2);

  return country ? country.iso3 : '';
}

/**
 * Normalize multiple country references in an object
 * Useful for regulatory data or address normalization
 *
 * @param data - Object containing country fields
 * @param fieldNames - Array of field names to normalize (default: ['country'])
 * @returns Object with normalized country fields
 */
export function normalizeCountryFields<T extends Record<string, any>>(
  data: T,
  fieldNames: string[] = ['country']
): T {
  const normalized = { ...data } as any;

  fieldNames.forEach(fieldName => {
    if (fieldName in normalized && typeof normalized[fieldName] === 'string') {
      normalized[fieldName] = normalizeCountry(normalized[fieldName]);
    }
  });

  return normalized as T;
}
