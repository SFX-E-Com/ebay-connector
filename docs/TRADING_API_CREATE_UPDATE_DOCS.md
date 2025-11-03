# eBay Trading API - Create & Update Listing Documentation

## Table of Contents
- [Create Listing (POST)](#create-listing)
- [Update Listing (PUT)](#update-listing)
- [Field Descriptions](#field-descriptions)
- [Examples](#examples)
- [Important Notes](#important-notes)
- [Marketplace-Specific Features](#marketplace-specific-features)

---

## Create Listing

### Endpoint
```
POST /api/ebay/{accountId}/trading/listing?debug=1
```

### Headers
```json
{
  "Content-Type": "application/json",
  "X-API-KEY": "your-api-key"
}
```

### Key Features

✅ **Automatic Marketplace Detection** - Marketplace is inferred from country code if not specified
✅ **German Translation** - Item specifics auto-translated for EBAY_DE
✅ **Flexible Condition** - Use `conditionId` (number) or `condition` (string)
✅ **Business Policy Fallback** - Auto-adds default shipping/return if policies unavailable
✅ **Smart Defaults** - Location, currency, and condition have sensible defaults

### Complete Request Body with All Fields

```json
{
  // ============== REQUIRED FIELDS ==============
  "title": "Product Title",                    // REQUIRED - Item title (max 80 characters)
  "description": "Detailed product description", // REQUIRED - HTML allowed, will be wrapped in CDATA
  "primaryCategory": {
    "categoryId": "139973"                     // REQUIRED - eBay category ID
  },
  "startPrice": 99.99,                         // REQUIRED - Starting/fixed price
  "quantity": 10,                              // REQUIRED - Available quantity

  // ============== BASIC OPTIONAL FIELDS ==============
  "sku": "YOUR-SKU-123",                       // OPTIONAL - Your unique SKU
  "subTitle": "Additional subtitle text",       // OPTIONAL - Extra fee may apply
  "country": "US",                             // OPTIONAL - Item location country (default: based on marketplace)
                                               // NOTE: If provided, marketplace is auto-inferred (DE→EBAY_DE, US→EBAY_US, etc.)
  "currency": "USD",                           // OPTIONAL - Currency code (default: auto-set based on marketplace)
  "location": "Los Angeles, CA",               // OPTIONAL - Item location city/state (default: country code if not provided)
  "postalCode": "90001",                       // OPTIONAL - Item location postal code
  "listingDuration": "GTC",                    // OPTIONAL - GTC, Days_3, Days_5, Days_7, Days_10, Days_30 (default: GTC)
  "listingType": "FixedPriceItem",             // OPTIONAL - FixedPriceItem, Chinese (auction) (default: FixedPriceItem)
  "dispatchTimeMax": 3,                        // OPTIONAL - Handling time in days (default: 3)
  "lotSize": 1,                                // OPTIONAL - For lots/wholesale (quantity per lot)
  "privateListing": false,                     // OPTIONAL - Hide buyer ID in feedback
  "uuid": "unique-uuid-string",                // OPTIONAL - Your unique identifier
  "applicationData": "custom-app-data",        // OPTIONAL - Custom application data
  "scheduleTime": "2024-12-01T10:00:00Z",     // OPTIONAL - Schedule listing start time
  "marketplace": "EBAY_US",                    // OPTIONAL - Target marketplace (default: EBAY_US)
  "verifyOnly": false,                         // OPTIONAL - If true, only verify without creating

  // ============== PRICING OPTIONS ==============
  "buyItNowPrice": 149.99,                     // OPTIONAL - Buy It Now price (for auctions)
  "reservePrice": 89.99,                       // OPTIONAL - Reserve price (for auctions)

  // ============== SECONDARY CATEGORY ==============
  "secondaryCategory": {
    "categoryId": "139974"                     // OPTIONAL - Secondary category ID
  },

  // ============== CONDITION ==============
  // Use EITHER conditionId (number) OR condition (string, case-insensitive)
  "conditionId": 1000,                         // OPTIONAL - 1000=New, 1500=New other, 2000=Manufacturer refurbished, 3000=Used (default: 1000)
  "condition": "New",                          // ALTERNATIVE - "New", "NEW", "Used", etc. (case-insensitive)
  "conditionDescription": "Brand new in original packaging", // OPTIONAL - Additional condition details
  "conditionDescriptors": [                    // OPTIONAL - Specific condition descriptors
    {
      "name": "Brand",
      "value": ["Apple"],
      "additionalInfo": "Genuine Apple product"
    }
  ],

  // ============== BEST OFFER ==============
  "bestOfferDetails": {
    "bestOfferEnabled": true                   // OPTIONAL - Enable best offer
  },
  "listingDetails": {
    "bestOfferAutoAcceptPrice": 85.00,         // OPTIONAL - Auto-accept offers at/above this price
    "minimumBestOfferPrice": 75.00,            // OPTIONAL - Minimum acceptable offer
    "localListingDistance": "50"               // OPTIONAL - Local listing radius in miles
  },

  // ============== PICTURES ==============
  "pictureDetails": {
    "galleryType": "Gallery",                  // OPTIONAL - Gallery, Plus, Featured, Large
    "pictureURL": [                            // OPTIONAL - Array of image URLs (first is gallery image)
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/image3.jpg"
    ]
  },

  // ============== ITEM SPECIFICS ==============
  // NOTE: For EBAY_DE, English names are automatically translated to German
  // (e.g., "Model" → "Modell", "Color" → "Farbe", "Storage Capacity" → "Speicherkapazität")
  "itemSpecifics": [                           // OPTIONAL - Category-specific attributes
    {
      "name": "Brand",
      "value": "Apple"                         // Can be string or single-item array
    },
    {
      "name": "Model",
      "value": "iPhone 15 Pro"                 // Use single value for Model (eBay requirement)
    },
    {
      "name": "Storage Capacity",
      "value": "256GB"
    },
    {
      "name": "Color",
      "value": "Natural Titanium"
    },
    {
      "name": "Features",
      "value": ["5G", "Wireless Charging", "Face ID"]  // Arrays allowed for some fields
    }
  ],

  // ============== PRODUCT IDENTIFIERS ==============
  "productListingDetails": {
    "upc": "885909950652",                     // OPTIONAL - Universal Product Code
    "ean": "8859099506529",                    // OPTIONAL - European Article Number
    "isbn": "978-3-16-148410-0",               // OPTIONAL - ISBN (for books)
    "brandMPN": {
      "brand": "Apple",                        // OPTIONAL - Brand name
      "mpn": "MTQW3LL/A"                      // OPTIONAL - Manufacturer Part Number
    },
    "productReferenceId": "EPID123456",        // OPTIONAL - eBay Product ID
    "includeStockPhotoURL": true,              // OPTIONAL - Include stock photo
    "useStockPhotoURLAsGallery": false,        // OPTIONAL - Use stock photo as gallery image
    "includeeBayProductDetails": true,         // OPTIONAL - Include eBay catalog details
    "useFirstProduct": true,                   // OPTIONAL - Use first matching product
    "returnSearchResultOnDuplicates": false    // OPTIONAL - Return search results if duplicate
  },

  // ============== SHIPPING ==============
  "shippingDetails": {
    "shippingType": "Flat",                    // OPTIONAL - Flat, Calculated, Freight, Free
    "shippingServiceOptions": [                // OPTIONAL - Domestic shipping options
      {
        "shippingServicePriority": 1,
        "shippingService": "USPSPriority",
        "shippingServiceCost": 9.99,
        "shippingServiceAdditionalCost": 4.99,
        "freeShipping": false
      },
      {
        "shippingServicePriority": 2,
        "shippingService": "UPSGround",
        "shippingServiceCost": 12.99,
        "shippingServiceAdditionalCost": 6.99
      }
    ],
    "internationalShippingServiceOption": [    // OPTIONAL - International shipping
      {
        "shippingServicePriority": 1,
        "shippingService": "USPSFirstClassMailInternational",
        "shippingServiceCost": 24.99,
        "shippingServiceAdditionalCost": 12.99,
        "shipToLocation": ["CA", "MX", "GB", "AU"]
      }
    ],
    "excludeShipToLocation": ["Alaska/Hawaii", "US Protectorates"], // OPTIONAL - Excluded locations
    "globalShipping": true,                    // OPTIONAL - Enable Global Shipping Program
    "rateTableDetails": {
      "domesticRateTableId": "12345",          // OPTIONAL - Domestic rate table ID
      "internationalRateTableId": "67890"      // OPTIONAL - International rate table ID
    },
    "calculatedShippingRate": {
      "packagingHandlingCosts": 2.50,          // OPTIONAL - Packaging/handling cost
      "internationalPackagingHandlingCosts": 5.00 // OPTIONAL - International packaging cost
    },
    "salesTax": {
      "salesTaxPercent": 8.5,                  // OPTIONAL - Sales tax percentage
      "salesTaxState": "CA",                   // OPTIONAL - State for sales tax
      "shippingIncludedInTax": false           // OPTIONAL - Include shipping in tax calculation
    }
  },

  // ============== SHIPPING PACKAGE ==============
  "shippingPackageDetails": {
    "measurementUnit": "English",              // OPTIONAL - English or Metric
    "packageDepth": 10,                        // OPTIONAL - Package depth
    "packageLength": 15,                       // OPTIONAL - Package length
    "packageWidth": 12,                        // OPTIONAL - Package width
    "weightMajor": 2,                          // OPTIONAL - Weight (pounds for English)
    "weightMinor": 8,                          // OPTIONAL - Weight (ounces for English)
    "shippingPackage": "PackageThickEnvelope", // OPTIONAL - Package type
    "shippingIrregular": false                 // OPTIONAL - Irregular package shape
  },

  // ============== RETURN POLICY ==============
  "returnPolicy": {
    "returnsAcceptedOption": "ReturnsAccepted", // OPTIONAL - ReturnsAccepted or ReturnsNotAccepted
    "refundOption": "MoneyBack",               // OPTIONAL - MoneyBack, MoneyBackOrExchange
    "returnsWithinOption": "Days_30",          // OPTIONAL - Days_14, Days_30, Days_60
    "shippingCostPaidByOption": "Buyer",       // OPTIONAL - Buyer or Seller
    "description": "30-day return policy",     // OPTIONAL - Return policy description
    "internationalReturnsAcceptedOption": "ReturnsAccepted", // OPTIONAL
    "internationalRefundOption": "MoneyBack",  // OPTIONAL
    "internationalReturnsWithinOption": "Days_30", // OPTIONAL
    "internationalShippingCostPaidByOption": "Buyer" // OPTIONAL
  },

  // ============== PAYMENT ==============
  "paymentMethods": ["PayPal", "CreditCard"],  // OPTIONAL - Payment methods
  "payPalEmailAddress": "seller@example.com",  // OPTIONAL - PayPal email
  "autoPay": true,                             // OPTIONAL - Require immediate payment

  // ============== BUSINESS POLICIES ==============
  // NOTE: If business policies are unavailable or fail, defaults are automatically added:
  // - Shipping: Marketplace-appropriate service (e.g., DE_DHLPaket for EBAY_DE) with €0.00 cost
  // - Return: 30-day returns accepted, buyer pays return shipping
  "sellerProfiles": {                          // OPTIONAL - Business policies (if enabled in your account)
    "sellerPaymentProfile": {
      "paymentProfileId": 123456,              // Get these IDs from eBay Seller Hub
      "paymentProfileName": "Default Payment"
    },
    "sellerReturnProfile": {
      "returnProfileId": 234567,
      "returnProfileName": "30 Day Returns"
    },
    "sellerShippingProfile": {
      "shippingProfileId": 345678,
      "shippingProfileName": "Standard Shipping"
    }
  },

  // ============== STORE ==============
  "storefront": {                              // OPTIONAL - eBay Store categories
    "storeCategoryId": 1234567,
    "storeCategory2Id": 2345678,
    "storeCategoryName": "Electronics",
    "storeCategory2Name": "Phones"
  },

  // ============== CHARITY ==============
  "charity": {                                 // OPTIONAL - Charity donation
    "charityId": "12345",
    "donationPercent": 10
  },

  // ============== DISCOUNT PRICING ==============
  "discountPriceInfo": {
    "originalRetailPrice": 199.99,             // OPTIONAL - Original retail price
    "minimumAdvertisedPrice": 99.99,           // OPTIONAL - MAP price
    "minimumAdvertisedPriceExposure": "PreCheckout", // OPTIONAL - PreCheckout, DuringCheckout, None
    "soldOffeBay": false,                      // OPTIONAL - Sold off eBay
    "soldOneBay": true                         // OPTIONAL - Sold on eBay
  },

  // ============== EU/VAT ==============
  "vatDetails": {                              // OPTIONAL - VAT details (EU sellers)
    "businessSeller": true,
    "restrictedToBusiness": false,
    "vatPercent": 19.0
  },

  // ============== REGULATORY/COMPLIANCE ==============
  "regulatory": {
    "manufacturer": {                          // OPTIONAL - Manufacturer details
      "companyName": "Apple Inc.",
      "cityName": "Cupertino",
      "country": "US",
      "email": "support@apple.com",
      "phone": "1-800-275-2273",
      "postalCode": "95014",
      "stateOrProvince": "CA",
      "street1": "One Apple Park Way",
      "street2": "",
      "contactURL": "https://www.apple.com"
    },
    "responsiblePersons": [                    // OPTIONAL - EU responsible persons
      {
        "companyName": "EU Rep Company GmbH",
        "types": ["EUResponsiblePerson"],
        "cityName": "Berlin",
        "country": "DE",
        "email": "compliance@eurep.de",
        "phone": "+49 30 12345678",
        "postalCode": "10115",
        "stateOrProvince": "Berlin",
        "street1": "Hauptstraße 123",
        "contactURL": "https://www.eurep.de"
      }
    ],
    "energyEfficiencyLabel": {                 // OPTIONAL - Energy efficiency (EU)
      "imageURL": "https://example.com/energy-label.jpg",
      "imageDescription": "Energy Class A++",
      "productInformationsheet": "https://example.com/product-sheet.pdf"
    },
    "hazmat": {                                // OPTIONAL - Hazardous materials
      "component": "Lithium Battery",
      "signalWord": "Warning",
      "pictograms": ["GHS07", "GHS09"],
      "statements": ["Keep away from heat", "Do not puncture"]
    },
    "productSafety": {                         // OPTIONAL - Product safety
      "component": "Electronic Device",
      "pictograms": ["CE", "FCC"],
      "statements": ["Complies with FCC rules", "CE certified"]
    },
    "documents": [                             // OPTIONAL - Compliance documents
      {
        "documentId": "DOC123456"
      }
    ],
    "repairScore": 8.5                         // OPTIONAL - Repair score (0-10)
  },

  // ============== EXTENDED PRODUCER RESPONSIBILITY ==============
  "extendedProducerResponsibility": {
    "ecoParticipationFee": 2.50                // OPTIONAL - Eco fee
  },

  // ============== CUSTOM POLICIES ==============
  "customPolicies": {
    "productCompliancePolicyId": [12345],      // OPTIONAL - Product compliance policy IDs
    "takeBackPolicyId": 67890,                 // OPTIONAL - Take back policy ID
    "regionalProductCompliancePolicies": [     // OPTIONAL - Regional policies
      {
        "country": "DE",
        "policyId": [11111, 22222]
      }
    ],
    "regionalTakeBackPolicies": [              // OPTIONAL - Regional take back
      {
        "country": "FR",
        "policyId": [33333]
      }
    ]
  },

  // ============== ITEM COMPATIBILITY ==============
  "itemCompatibilityList": [                   // OPTIONAL - Parts compatibility
    {
      "compatibilityNotes": "Fits all models",
      "nameValueList": [
        {
          "name": "Year",
          "value": ["2020", "2021", "2022"]
        },
        {
          "name": "Make",
          "value": "Toyota"
        },
        {
          "name": "Model",
          "value": "Camry"
        }
      ]
    }
  ],

  // ============== CONTACT DETAILS ==============
  "extendedSellerContactDetails": {            // OPTIONAL - Extended contact
    "classifiedAdContactByEmailEnabled": true,
    "contactHoursDetails": {
      "timeZoneId": "America/Los_Angeles",
      "hours1Days": "Weekdays",
      "hours1AnyTime": false,
      "hours1From": "09:00",
      "hours1To": "17:00",
      "hours2Days": "Weekends",
      "hours2AnyTime": false,
      "hours2From": "10:00",
      "hours2To": "14:00"
    }
  },

  "sellerContactDetails": {                    // OPTIONAL - Seller contact
    "companyName": "My Company Inc",
    "county": "Los Angeles",
    "street": "123 Main St",
    "street2": "Suite 100",
    "phoneCountryCode": "1",
    "phoneAreaOrCityCode": "310",
    "phoneLocalNumber": "555-1234"
  },

  // ============== OTHER OPTIONAL FIELDS ==============
  "videoDetails": {
    "videoId": ["VIDEO123", "VIDEO456"]        // OPTIONAL - Video IDs
  },
  "digitalGoodInfo": {
    "digitalDelivery": true                    // OPTIONAL - Digital delivery
  },
  "vin": "1HGCM82633A123456",                 // OPTIONAL - Vehicle ID Number
  "vrm": "AB12 CDE",                          // OPTIONAL - Vehicle Registration Mark
  "listingEnhancement": ["BoldTitle"],         // OPTIONAL - Listing enhancements
  "buyerResponsibleForShipping": false,        // OPTIONAL - Buyer arranges shipping
  "categoryMappingAllowed": true,              // OPTIONAL - Allow category mapping
  "crossBorderTrade": ["UK", "CA"],           // OPTIONAL - Cross-border trade
  "disableBuyerRequirements": false,           // OPTIONAL - Disable buyer requirements
  "eBayPlus": true,                           // OPTIONAL - eBay Plus eligible
  "listingSubtype2": "StoreInventory",        // OPTIONAL - Listing subtype
  "site": "US",                              // OPTIONAL - eBay site
  "shipToLocations": ["Worldwide"],           // OPTIONAL - Ship to locations
  "taxCategory": "Electronics",               // OPTIONAL - Tax category
  "useTaxTable": true,                        // OPTIONAL - Use tax table
  "paymentDetails": {                         // OPTIONAL - Payment details
    "daysToFullPayment": 7,
    "depositAmount": 50.00,
    "depositType": "Percentage",
    "hoursToDeposit": 48
  },
  "pickupInStoreDetails": {                   // OPTIONAL - Store pickup
    "eligibleForPickupInStore": true
  },
  "quantityRestrictionPerBuyer": {            // OPTIONAL - Quantity restriction
    "maximumQuantity": 3
  },
  "shippingServiceCostOverrideList": [        // OPTIONAL - Shipping overrides
    {
      "shippingServicePriority": 1,
      "shippingServiceType": "Domestic",
      "shippingServiceCost": 8.99,
      "shippingServiceAdditionalCost": 4.99
    }
  ]
}
```

---

## Update Listing

### Endpoint
```
PUT /api/ebay/{accountId}/trading/listing?debug=1
```

### Headers
```json
{
  "Content-Type": "application/json",
  "X-API-KEY": "your-api-key"
}
```

### Update Request Body

**Note:** For updates, you only need to include the fields you want to change, plus the identifier (itemId or sku).

```json
{
  // ============== IDENTIFIER (ONE REQUIRED) ==============
  "itemId": "123456789012",                    // REQUIRED (or use sku) - eBay Item ID
  "sku": "YOUR-SKU-123",                       // REQUIRED (or use itemId) - Your SKU

  "marketplace": "EBAY_US",                    // OPTIONAL - Target marketplace

  // ============== FIELDS TO UPDATE ==============
  // Include only the fields you want to change

  "title": "Updated Product Title",            // OPTIONAL - New title
  "description": "Updated description",        // OPTIONAL - New description
  "price": 89.99,                             // OPTIONAL - New price
  "quantity": 15,                             // OPTIONAL - New quantity

  "images": [                                  // OPTIONAL - Replace all images
    "https://example.com/new-image1.jpg",
    "https://example.com/new-image2.jpg"
  ],

  "itemSpecifics": {                          // OPTIONAL - Update item specifics
    "Brand": "Apple",
    "Model": "iPhone 15 Pro Max",
    "Color": "Blue Titanium"
  },

  "shippingOptions": [                        // OPTIONAL - Update shipping
    {
      "service": "USPSPriority",
      "cost": 8.99,
      "additionalCost": 3.99
    }
  ],

  "returnPolicy": {                           // OPTIONAL - Update return policy
    "returnsAccepted": true,
    "refundOption": "MoneyBack",
    "returnsWithin": "Days_60",
    "shippingCostPaidBy": "Seller",
    "description": "60-day free returns"
  },

  "sellerProfiles": {                          // OPTIONAL - Update business policies
    "paymentProfile": "12345",
    "returnProfile": "23456",
    "shippingProfile": "34567"
  }
}
```

---

## Field Descriptions

### Required Fields
- **title**: Item title (max 80 characters)
- **description**: Full HTML description
- **primaryCategory.categoryId**: eBay category ID
- **startPrice**: Fixed price or starting bid
- **quantity**: Available quantity

### Key Optional Fields
- **sku**: Your internal SKU for tracking
- **conditionId**: Item condition (1000=New, 3000=Used, etc.)
- **pictureDetails.pictureURL**: Array of image URLs
- **itemSpecifics**: Category-specific attributes
- **shippingDetails**: Shipping options and costs
- **returnPolicy**: Return policy details

---

## Examples

### Example 1: Simple Product Listing
```json
{
  "title": "Apple iPhone 15 Pro 256GB Natural Titanium",
  "description": "<h2>Brand New iPhone 15 Pro</h2><p>Latest model with ProMotion display...</p>",
  "primaryCategory": {
    "categoryId": "9355"
  },
  "startPrice": 999.99,
  "quantity": 5,
  "sku": "IPHONE-15PRO-256-NT",
  "conditionId": 1000,
  "pictureDetails": {
    "pictureURL": [
      "https://example.com/iphone1.jpg",
      "https://example.com/iphone2.jpg"
    ]
  },
  "itemSpecifics": [
    {"name": "Brand", "value": "Apple"},
    {"name": "Model", "value": "iPhone 15 Pro"},
    {"name": "Storage Capacity", "value": "256GB"}
  ]
}
```

### Example 2: Update Price and Quantity
```json
{
  "itemId": "123456789012",
  "price": 899.99,
  "quantity": 10
}
```

### Example 3: German Marketplace (EBAY_DE) with EU Compliance
```json
{
  "title": "Apple iPhone 15 Pro 256GB Natural Titanium",
  "description": "<h2>Brandneues iPhone 15 Pro</h2><p>Neuestes Modell mit ProMotion Display...</p>",
  "primaryCategory": {
    "categoryId": "9355"
  },
  "startPrice": 999.99,
  "quantity": 5,
  "sku": "IPHONE-15PRO-256-NT",
  "country": "DE",
  "condition": "New",
  "pictureDetails": {
    "pictureURL": ["https://example.com/iphone1.jpg"]
  },
  "itemSpecifics": [
    {"name": "Brand", "value": "Apple"},
    {"name": "Model", "value": "iPhone 15 Pro"},
    {"name": "Storage Capacity", "value": "256GB"},
    {"name": "Color", "value": "Natural Titanium"}
  ],
  "productListingDetails": {
    "ean": "4262413893747",
    "brandMPN": {
      "brand": "Apple",
      "mpn": "A2848"
    }
  },
  "regulatory": {
    "manufacturer": {
      "companyName": "SFX E-Commerce",
      "cityName": "Saal ad Donau",
      "country": "DE",
      "email": "support@sfx-ecommerce.com",
      "postalCode": "93342",
      "stateOrProvince": "Bavaria",
      "street1": "Schneidergasse 1"
    },
    "responsiblePersons": [{
      "companyName": "SFX E-Commerce",
      "types": ["EUResponsiblePerson"],
      "cityName": "Saal ad Donau",
      "country": "DE",
      "email": "support@sfx-ecommerce.com",
      "postalCode": "93342",
      "stateOrProvince": "Bavaria",
      "street1": "Schneidergasse 1"
    }]
  }
}
```

### Example 4: Listing with Business Policies
```json
{
  "title": "Product Title",
  "description": "Product description",
  "primaryCategory": {"categoryId": "12345"},
  "startPrice": 49.99,
  "quantity": 20,
  "sellerProfiles": {
    "sellerPaymentProfile": {
      "paymentProfileId": 123456,
      "paymentProfileName": "Immediate Payment"
    },
    "sellerReturnProfile": {
      "returnProfileId": 234567,
      "returnProfileName": "30 Day Returns"
    },
    "sellerShippingProfile": {
      "shippingProfileId": 345678,
      "shippingProfileName": "Free Shipping"
    }
  }
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Listing created successfully on eBay",
  "data": {
    "itemId": "123456789012",
    "sku": "YOUR-SKU-123",
    "startTime": "2024-01-01T10:00:00Z",
    "endTime": "2024-02-01T10:00:00Z",
    "fees": [
      {"name": "InsertionFee", "fee": 0.35},
      {"name": "FinalValueFee", "fee": 12.99}
    ],
    "warnings": [],
    "listingUrl": "https://www.ebay.com/itm/123456789012"
  },
  "metadata": {
    "account_used": "seller_username",
    "account_id": "acc_123",
    "marketplace": "EBAY_US",
    "api_type": "TRADING"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "eBay Trading API error",
  "errors": [
    {
      "errorCode": "21916",
      "shortMessage": "Invalid category",
      "longMessage": "The category ID specified is invalid for this marketplace",
      "severity": "Error"
    }
  ],
  "ack": "Failure"
}
```

---

## Important Notes

### Smart Defaults & Auto-Configuration

1. **Marketplace Inference**
   - If `marketplace` is not specified but `country` is provided, marketplace is automatically detected
   - Examples: `"country": "DE"` → `EBAY_DE`, `"country": "US"` → `EBAY_US`
   - Supported: US, UK, DE, AU, CA, FR, IT, ES, CH, AT, BE, NL

2. **Currency Auto-Detection**
   - If `currency` is not specified, it's automatically set based on marketplace
   - Examples: EBAY_DE → EUR, EBAY_US → USD, EBAY_UK → GBP

3. **Location Defaults**
   - If `location` is not provided, defaults to country code
   - **Best Practice**: Provide a city name for better results (e.g., "Berlin" instead of just "DE")

4. **Condition Defaults**
   - If neither `conditionId` nor `condition` is provided, defaults to 1000 (New)
   - Supports both formats: `"conditionId": 1000` OR `"condition": "New"` (case-insensitive)

### Business Policies Behavior

- **With Valid Business Policies**: Uses your configured eBay Business Policies
- **Without Business Policies or if they fail**: Automatically adds:
  - Default shipping service (marketplace-appropriate, e.g., DE_DHLPaket for Germany)
  - Default return policy (30-day returns, buyer pays shipping)
- **Best Practice**: Test without business policies first, then add them once working

### Field Validation

1. **Item Specifics**
   - Some fields like "Model" only accept single values (not arrays)
   - Use `productListingDetails.brandMPN.mpn` for part numbers instead
   - **Model Field**: `"value": "iPhone 15 Pro"` ✅ | `"value": ["iPhone", "15 Pro"]` ❌

2. **Images**
   - First image in `pictureURL` array becomes the gallery image
   - Maximum varies by subscription level (typically 12-24 images)

3. **Required vs Optional**
   - Always required: title, description, primaryCategory.categoryId, startPrice, quantity
   - Recommended: sku, condition, pictureDetails, itemSpecifics

### Debugging

- Add `?debug=1` to URL for detailed logging
- Logs show: marketplace inference, field transformations, XML requests, API responses
- **Token Refresh**: Automatically handled by middleware
- **Verification Mode**: Use `"verifyOnly": true` to test without creating

---

## Marketplace-Specific Features

### EBAY_DE (Germany) - Auto-Translations

Item specifics are **automatically translated** from English to German:

| English Name | German Name (Auto-translated) |
|-------------|------------------------------|
| Brand | Marke |
| Model | Modell |
| Color / Colour | Farbe |
| Storage Capacity | Speicherkapazität |
| Size | Größe |
| Manufacturer | Hersteller |
| Material | Material |
| Type | Produktart |
| Style | Stil |
| Features | Besonderheiten |

**Example:**
```json
{
  "itemSpecifics": [
    {"name": "Model", "value": "iPhone 15"}  // Auto-becomes "Modell" for EBAY_DE
  ]
}
```

### EU Marketplaces - Regulatory Compliance

For EBAY_DE, EBAY_FR, EBAY_IT, EBAY_ES, and other EU marketplaces, the `regulatory` section is **highly recommended**:

```json
{
  "regulatory": {
    "manufacturer": {
      "companyName": "Your Company",
      "cityName": "City",
      "country": "DE",
      "email": "support@company.com",
      "postalCode": "12345",
      "street1": "Street Address"
    },
    "responsiblePersons": [{
      "companyName": "Your Company",
      "types": ["EUResponsiblePerson"],
      "cityName": "City",
      "country": "DE",
      "email": "support@company.com",
      "postalCode": "12345",
      "street1": "Street Address"
    }]
  }
}
```

This information appears in the "Hersteller/EU Verantwortliche Person" section on eBay.de listings.

### Marketplace-Specific Shipping Services

Default shipping services by marketplace (used when business policies unavailable):

- **EBAY_US**: USPSPriority
- **EBAY_UK**: UK_RoyalMailFirstClassStandard
- **EBAY_DE**: DE_DHLPaket
- **EBAY_AU**: AU_Regular
- **EBAY_CA**: CA_RegularParcel
- **EBAY_FR**: FR_ColiPoste
- **EBAY_IT**: IT_RegularMail
- **EBAY_ES**: ES_StandardInternational

---

## Common Error Codes

### Validation Errors
- **21916884**: Item condition required - Add `conditionId` or `condition`
- **71**: Location missing - Add `location` field with city name
- **21919303**: Item specific missing - Check required category-specific attributes
- **21919309**: Item specific should contain only one value - Use single value instead of array for fields like "Model"
- **37**: Input data invalid - Check StartPrice, quantity, or other numeric fields

### Category & Listing Errors
- **21916**: Invalid category ID - Verify category exists for marketplace
- **21919**: Duplicate listing - SKU or item already exists
- **21920**: Invalid SKU - Check SKU format

### Business Policy Errors
- **21920303**: Business Policy unavailable - Policy IDs don't exist or are inaccessible (fallback will be used)
- **21915469**: Shipping service not specified - Add shipping details or remove invalid business policies

### Authentication Errors
- **931**: Auth token expired - Auto-refreshed by middleware
- **10007**: Internal error - Retry request

For more details, refer to [eBay Trading API Error Codes](https://developer.ebay.com/devzone/xml/docs/reference/ebay/errors/errormessages.htm)