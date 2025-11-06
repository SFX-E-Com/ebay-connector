# Country Normalization in Trading API

The eBay Trading API now automatically normalizes all country names and codes to **ISO 3166-1 alpha-2** format (2-letter country codes).

## What Gets Normalized?

All country fields in the Trading API request are automatically normalized:

1. **Main Country Field** (`country`)
2. **Regulatory Data**:
   - Manufacturer country
   - Responsible persons country
3. **Custom Policies**:
   - Regional product compliance policies
   - Regional take-back policies

## Supported Formats

The normalization supports:

- ✅ **Full country names** (case-insensitive): `"Germany"`, `"GERMANY"`, `"germany"`
- ✅ **ISO 2-letter codes**: `"DE"`, `"de"`
- ✅ **ISO 3-letter codes**: `"DEU"`, `"deu"`
- ✅ **Alternate names**: `"Deutschland"`, `"Allemagne"`, `"Federal Republic of Germany"`

## Examples

### Input → Output

```javascript
// All of these become "DE":
"Germany"       → "DE"
"GERMANY"       → "DE"
"germany"       → "DE"
"DE"            → "DE"
"de"            → "DE"
"DEU"           → "DE"
"deu"           → "DE"
"Deutschland"   → "DE"
"Allemagne"     → "DE"

// All of these become "FR":
"France"        → "FR"
"FRANCE"        → "FR"
"france"        → "FR"
"FR"            → "FR"
"fr"            → "FR"
"FRA"           → "FR"
"fra"           → "FR"
"Francia"       → "FR"
"Frankreich"    → "FR"

// All of these become "US":
"United States" → "US"
"USA"           → "US"
"US"            → "US"
"us"            → "US"
"United States of America" → "US"
"America"       → "US"

// All of these become "GB":
"United Kingdom" → "GB"
"UK"            → "GB"
"GB"            → "GB"
"Britain"       → "GB"
"Great Britain" → "GB"
"England"       → "GB"
```

## Usage in Trading API Requests

### Example 1: Main Country Field

```javascript
POST /api/ebay/{accountId}/trading/listing

// Input:
{
  "title": "Product Title",
  "description": "Description",
  "primaryCategory": { "categoryId": "12345" },
  "startPrice": 29.99,
  "quantity": 10,
  "country": "Germany",  // ← Can use "Germany", "GERMANY", "DE", "DEU", etc.
  "location": "Berlin"
}

// Sent to eBay:
{
  "Country": "DE",  // ← Automatically normalized to ISO-2
  "Location": "Berlin"
}
```

### Example 2: Regulatory Data (EU Compliance)

```javascript
POST /api/ebay/{accountId}/trading/listing

// Input:
{
  "title": "Product Title",
  // ... other fields ...
  "regulatory": {
    "manufacturer": {
      "companyName": "SARL LSNR",
      "street1": "boulevard d'Europe",
      "cityName": "Bourguebus",
      "country": "France",  // ← Can use "France", "FR", "FRA", "Frankreich"
      "postalCode": "14540",
      "email": "contact@wattiz.fr"
    },
    "responsiblePersons": [{
      "companyName": "EU Rep GmbH",
      "street1": "Hauptstraße 123",
      "cityName": "Berlin",
      "country": "GERMANY",  // ← Can use any German variant
      "postalCode": "10115",
      "types": ["EUResponsiblePerson"]
    }]
  }
}

// Sent to eBay:
{
  "Regulatory": {
    "Manufacturer": {
      "Country": "FR"  // ← Normalized
    },
    "ResponsiblePersons": {
      "ResponsiblePerson": [{
        "Country": "DE"  // ← Normalized
      }]
    }
  }
}
```

### Example 3: Custom Policies

```javascript
POST /api/ebay/{accountId}/trading/listing

// Input:
{
  "customPolicies": {
    "regionalProductCompliancePolicies": [
      {
        "country": "Germany",  // ← Any variant
        "policyId": [12345, 67890]
      },
      {
        "country": "France",  // ← Any variant
        "policyId": [11111]
      }
    ]
  }
}

// Sent to eBay:
{
  "CustomPolicies": {
    "RegionalProductCompliancePolicies": {
      "CountryPolicies": [
        { "Country": "DE", "PolicyID": [12345, 67890] },
        { "Country": "FR", "PolicyID": [11111] }
      ]
    }
  }
}
```

## Supported Countries

The normalizer supports **70+ countries**, including:

### Europe
- 🇩🇪 Germany (DE, DEU, Deutschland, Allemagne)
- 🇫🇷 France (FR, FRA, Francia, Frankreich)
- 🇬🇧 United Kingdom (GB, GBR, UK, Britain, England)
- 🇮🇹 Italy (IT, ITA, Italia, Italien)
- 🇪🇸 Spain (ES, ESP, España, Spanien, Espagne)
- 🇳🇱 Netherlands (NL, NLD, Holland, Nederland, Niederlande)
- 🇧🇪 Belgium (BE, BEL, België, Belgique, Belgien)
- 🇦🇹 Austria (AT, AUT, Österreich, Autriche)
- 🇨🇭 Switzerland (CH, CHE, Schweiz, Suisse, Svizzera)
- 🇵🇱 Poland (PL, POL, Polska, Polen)
- And 20+ more European countries...

### North America
- 🇺🇸 United States (US, USA, America, U.S.A.)
- 🇨🇦 Canada (CA, CAN, Kanada)
- 🇲🇽 Mexico (MX, MEX, México, Mexiko)

### Asia Pacific
- 🇦🇺 Australia (AU, AUS, Australien)
- 🇨🇳 China (CN, CHN, 中国, PRC)
- 🇯🇵 Japan (JP, JPN, 日本, Nippon, Nihon)
- 🇮🇳 India (IN, IND, Bharat, Indien)
- 🇸🇬 Singapore (SG, SGP, Singapur)
- 🇭🇰 Hong Kong (HK, HKG, Hong Kong SAR)
- 🇰🇷 South Korea (KR, KOR, Korea, ROK)
- 🇳🇿 New Zealand (NZ, NZL, Neuseeland)

### Middle East
- 🇦🇪 United Arab Emirates (AE, ARE, UAE, Emirates)
- 🇸🇦 Saudi Arabia (SA, SAU, Saudi-Arabien)
- 🇮🇱 Israel (IL, ISR)

### South America
- 🇧🇷 Brazil (BR, BRA, Brasil, Brasilien)
- 🇦🇷 Argentina (AR, ARG, Argentinien)
- 🇨🇱 Chile (CL, CHL)

### Africa
- 🇿🇦 South Africa (ZA, ZAF, RSA, Südafrika)
- 🇪🇬 Egypt (EG, EGY, Ägypten)

## What If Country Is Not Recognized?

If the country is not in the normalization database, the **original value is returned unchanged**:

```javascript
normalizeCountry("UnknownCountry") → "UnknownCountry"
```

This ensures the API call won't fail, but eBay may return an error if the country code is invalid.

## Benefits

1. **Flexibility** - Users can input country names in any format
2. **Case-Insensitive** - `"GERMANY"`, `"Germany"`, `"germany"` all work
3. **Multiple Languages** - Supports names in English, German, French, etc.
4. **Automatic** - No manual conversion needed
5. **Consistent** - All country fields follow ISO 3166-1 alpha-2 standard
6. **eBay Compatible** - Ensures eBay always receives valid country codes

## Advanced Usage

If you need to use the country normalizer directly:

```typescript
import {
  normalizeCountry,
  isValidCountry,
  getCountryName,
  getCountryISO3
} from '@/app/lib/utils/country-normalizer';

// Normalize country
const code = normalizeCountry('Germany');  // "DE"

// Check if valid
const valid = isValidCountry('Germany');  // true

// Get full name
const name = getCountryName('DE');  // "Germany"

// Get ISO3 code
const iso3 = getCountryISO3('Germany');  // "DEU"
```

## Implementation Details

- **Location**: `app/lib/utils/country-normalizer.ts`
- **Integrated In**: `app/lib/utils/ebay-trading-transformer.ts`
- **Applies To**: All Trading API endpoints (create, update, relist, etc.)
- **Performance**: Optimized with Map-based lookup (O(1) complexity)
