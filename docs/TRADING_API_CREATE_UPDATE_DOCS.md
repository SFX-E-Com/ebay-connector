# eBay Trading API - Create & Update Listing Documentation

## Table of Contents
- [Create Listing (POST)](#create-listing)
- [Update Listing (PUT)](#update-listing)
- [Relist Listing (PATCH)](#relist-listing)
- [Get Listing (GET)](#get-listing)
- [End Listing (DELETE)](#end-listing)
- [Bulk Operations](#bulk-operations)
  - [Bulk Create](#bulk-create-post)
  - [Bulk Update](#bulk-update-put)
  - [Bulk Relist](#bulk-relist-patch)
  - [Bulk Delete](#bulk-delete-delete)
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

### Important Limitations

⚠️ **ReviseFixedPriceItem has strict limitations** - Many fields CANNOT be changed after a listing is created.

**Fields that CANNOT be updated:**
- ❌ Category (primaryCategory, secondaryCategory)
- ❌ Listing type (listingType)
- ❌ Listing duration (listingDuration)
- ❌ Product identifiers (EAN, UPC, ISBN in productListingDetails)
- ❌ Condition (conditionId, condition)
- ❌ Country & Currency
- ❌ Regulatory information (manufacturer, responsible persons)
- ❌ Auction-specific (buyItNowPrice, reservePrice)
- ❌ Condition descriptors
- ❌ Item compatibility list
- ❌ Charity settings
- ❌ Payment methods

**Fields that CAN be updated:**
- ✅ Title & Description
- ✅ Price (startPrice)
- ✅ Quantity
- ✅ SKU
- ✅ Pictures (pictureDetails)
- ✅ Item specifics
- ✅ Shipping details
- ✅ Return policy
- ✅ Business policies (sellerProfiles)
- ✅ Condition description (text only, not ID)
- ✅ Dispatch time
- ✅ Location & Postal code
- ✅ Subtitle
- ✅ Best offer settings
- ✅ Shipping package details
- ✅ VAT details
- ✅ Store categories
- ✅ Video details

💡 **Tip:** If you need to change non-updatable fields, use **PATCH (Relist)** to create a new listing with the changes.

### Update Request Body

**Note:** Only include the fields you want to change, plus the identifier. Non-updatable fields are automatically filtered out.

```json
{
  // ============== IDENTIFIER (ONE REQUIRED) ==============
  "itemId": "123456789012",                    // REQUIRED (or use sku) - eBay Item ID
  "sku": "YOUR-SKU-123",                       // REQUIRED (or use itemId) - Your SKU

  // ============== UPDATABLE FIELDS ==============
  // Include only the fields you want to change

  "title": "Updated Product Title",            // ✅ Can update
  "description": "Updated description",        // ✅ Can update
  "startPrice": 89.99,                        // ✅ Can update
  "quantity": 15,                             // ✅ Can update

  "pictureDetails": {                         // ✅ Can update
    "pictureURL": [
      "https://example.com/new-image1.jpg",
      "https://example.com/new-image2.jpg"
    ]
  },

  "itemSpecifics": [                          // ✅ Can update
    {
      "name": "Brand",
      "value": "Apple"
    },
    {
      "name": "Model",
      "value": "iPhone 15 Pro Max"
    }
  ],

  "shippingDetails": {                        // ✅ Can update
    "shippingServiceOptions": [
      {
        "shippingServicePriority": 1,
        "shippingService": "USPSPriority",
        "shippingServiceCost": 8.99
      }
    ]
  },

  "returnPolicy": {                           // ✅ Can update
    "returnsAcceptedOption": "ReturnsAccepted",
    "refundOption": "MoneyBack",
    "returnsWithinOption": "Days_60",
    "shippingCostPaidByOption": "Seller"
  },

  "sellerProfiles": {                         // ✅ Can update
    "sellerPaymentProfile": {
      "paymentProfileId": 123456
    },
    "sellerReturnProfile": {
      "returnProfileId": 234567
    },
    "sellerShippingProfile": {
      "shippingProfileId": 345678
    }
  },

  "conditionDescription": "Excellent condition", // ✅ Can update (description only)
  "dispatchTimeMax": 2,                       // ✅ Can update
  "location": "New York, NY",                 // ✅ Can update
  "subTitle": "Free Shipping!"                // ✅ Can update
}
```

### Example: Fields Automatically Filtered

If you try to update non-updatable fields, they are automatically filtered out:

```json
{
  "itemId": "123456789012",
  "title": "New Title",                       // ✅ Will be updated
  "startPrice": 99.99,                       // ✅ Will be updated
  "primaryCategory": {                        // ❌ Automatically filtered out
    "categoryId": "9999"
  },
  "conditionId": 3000,                       // ❌ Automatically filtered out
  "country": "UK"                            // ❌ Automatically filtered out
}
```

With `?debug=1`, you'll see which fields were filtered:
```json
{
  "success": true,
  "message": "Listing updated successfully",
  "debug": {
    "removedFields": ["primaryCategory", "conditionId", "country"],
    "note": "These fields cannot be changed after listing is created. Use relist instead."
  }
}
```

---

## Relist Listing

### Endpoint
```
PATCH /api/ebay/{accountId}/trading/listing?debug=1
```

### Headers
```json
{
  "Content-Type": "application/json",
  "X-API-KEY": "your-api-key"
}
```

### Purpose

The Relist API allows you to **re-create an ended listing** with a new ItemID. This is useful for:
- Relaunching sold-out or expired listings
- Making changes to ended listings before relisting
- Managing seasonal inventory cycles
- Potentially qualifying for insertion fee credits

### Key Differences

| Feature | Relist (PATCH) | Update (PUT) | Create (POST) |
|---------|---------------|--------------|---------------|
| Target | Ended listings | Active listings | New listings |
| ItemID | Creates NEW ItemID | Same ItemID | Creates NEW ItemID |
| Time Limit | Within 90 days of end | Anytime while active | N/A |
| Data Source | Copies from original | Updates existing | Fresh data |
| Watchers | Preserved from original | Maintained | None |
| Fee Credits | May qualify | No credits | No credits |

### Important Requirements

⚠️ **Must Meet These Conditions:**
- Original listing must have **ended** (not active)
- Must relist within **90 days** of listing end date
- Must be the original seller of the item
- Cannot relist within 12 hours of listing end

✅ **Benefits:**
- Preserves watchers from original listing
- May receive insertion fee credits if item didn't sell
- Faster than creating from scratch
- Can modify any field during relist

### Relist Request Body

**Minimum Required (Relist without changes):**
```json
{
  "itemId": "123456789012",                      // REQUIRED - Original ended listing ItemID
  "marketplace": "EBAY_US"                       // OPTIONAL - Target marketplace
}
```

**Relist with Updates:**
```json
{
  // ============== REQUIRED ==============
  "itemId": "123456789012",                      // REQUIRED - Original ended listing ItemID

  "marketplace": "EBAY_US",                      // OPTIONAL - Target marketplace

  // ============== OPTIONAL UPDATES ==============
  // Include ONLY the fields you want to change
  // All other fields will be copied from the original listing

  "startPrice": 79.99,                          // OPTIONAL - New price
  "quantity": 20,                               // OPTIONAL - New quantity
  "title": "Updated Product Title",             // OPTIONAL - New title
  "description": "Updated description",         // OPTIONAL - New description

  "pictureDetails": {                           // OPTIONAL - Replace images
    "pictureURL": [
      "https://example.com/updated-image1.jpg",
      "https://example.com/updated-image2.jpg"
    ]
  },

  "itemSpecifics": [                            // OPTIONAL - Update item specifics
    {
      "name": "Brand",
      "value": "Apple"
    },
    {
      "name": "Model",
      "value": "iPhone 15 Pro Max"
    },
    {
      "name": "Color",
      "value": "Blue Titanium"
    }
  ],

  "shippingDetails": {                          // OPTIONAL - Update shipping
    "shippingServiceOptions": [
      {
        "shippingServicePriority": 1,
        "shippingService": "USPSPriority",
        "shippingServiceCost": 9.99
      }
    ]
  },

  "returnPolicy": {                             // OPTIONAL - Update return policy
    "returnsAcceptedOption": "ReturnsAccepted",
    "refundOption": "MoneyBack",
    "returnsWithinOption": "Days_60",
    "shippingCostPaidByOption": "Seller"
  }
}
```

### Response Format

```json
{
  "success": true,
  "message": "Listing relisted successfully on eBay",
  "data": {
    "itemId": "987654321098",                   // NEW ItemID (different from original)
    "originalItemId": "123456789012",           // Original ItemID for reference
    "sku": "YOUR-SKU-123",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-02-15T10:00:00Z",
    "fees": [
      {
        "name": "InsertionFee",
        "amount": 0.00,                         // Often $0 due to relist credit
        "currency": "USD",
        "promotional": 0.00
      }
    ],
    "warnings": [],
    "listingUrl": "https://www.ebay.com/itm/987654321098"
  },
  "metadata": {
    "account_used": "seller_username",
    "account_id": "acc_123",
    "marketplace": "EBAY_US",
    "api_type": "TRADING",
    "operation": "RELIST"
  }
}
```

### Common Use Cases

#### 1. Simple Relist (No Changes)
```json
{
  "itemId": "123456789012"
}
```
✅ All settings copied from original listing

#### 2. Relist with New Price
```json
{
  "itemId": "123456789012",
  "startPrice": 89.99
}
```
✅ Updates price, keeps everything else

#### 3. Relist with Increased Quantity
```json
{
  "itemId": "123456789012",
  "quantity": 50,
  "startPrice": 79.99
}
```
✅ Restocks inventory with new price

#### 4. Relist for Different Marketplace
```json
{
  "itemId": "123456789012",
  "marketplace": "EBAY_UK",
  "startPrice": 69.99,
  "currency": "GBP"
}
```
✅ Moves listing to different marketplace

### Error Handling

Common errors you might encounter:

**Error: Item not found or not eligible**
```json
{
  "success": false,
  "message": "eBay Trading API error",
  "errors": [
    {
      "code": "21916638",
      "shortMessage": "Item not eligible for relist",
      "longMessage": "The specified item cannot be relisted. It may still be active or beyond the 90-day relist period."
    }
  ]
}
```

**Solutions:**
- Verify the listing has ended (use GET to check status)
- Check it's within 90 days of end date
- Ensure you're the original seller
- Wait at least 12 hours after listing ended

### Notes

1. **New ItemID**: Relisting always creates a NEW ItemID - update your database accordingly
2. **Watchers Preserved**: Users watching the original listing will continue watching the new one
3. **Insertion Fee Credits**: If item didn't sell, you may receive credit on insertion fees
4. **All Settings Copied**: Only include fields you want to change; all others copy from original
5. **90-Day Limit**: Track your ended listings and relist within the time window
6. **Debug Mode**: Use `?debug=1` to see detailed relist information

---

## Get Listing

### Endpoint
```
GET /api/ebay/{accountId}/trading/listing?itemId=123456789012&debug=1
```

Returns details of a specific listing by ItemID.

---

## End Listing

### Endpoint
```
DELETE /api/ebay/{accountId}/trading/listing?itemId=123456789012&reason=NotAvailable&debug=1
```

Ends an active listing. Valid reasons: `Incorrect`, `LostOrBroken`, `NotAvailable`, `OtherListingError`, `ProductDeleted`

---

## Bulk Operations

All operations (Create, Update, Relist, Delete) support bulk processing for handling multiple items efficiently.

### Key Features

✅ **Parallel Processing** - Process multiple items simultaneously (default)
✅ **Sequential Processing** - Process one at a time with `?parallel=false`
✅ **Partial Success** - Individual item failures don't stop the batch
✅ **Detailed Results** - Get success/failure status for each item
✅ **Performance Metrics** - Track duration and average time per item
✅ **Same Auth & Middleware** - Uses same authentication as single operations

### Common Parameters

- **URL Parameter**: `?parallel=true|false` (default: true)
- **URL Parameter**: `?debug=1` (enable debug logging)
- **Body Parameter**: `marketplace` (e.g., "EBAY_US", "EBAY_DE")
- **Body Parameter**: `items` (array of items to process)

---

### Bulk Create (POST)

Create multiple listings in one request.

#### Endpoint
```
POST /api/ebay/{accountId}/trading/listing/bulk?parallel=true&debug=1
```

#### Request Body
```json
{
  "marketplace": "EBAY_DE",
  "items": [
    {
      "title": "Product 1",
      "description": "Description 1",
      "primaryCategory": {"categoryId": "9355"},
      "startPrice": 99.99,
      "quantity": 10,
      "sku": "SKU-001",
      "condition": "New",
      "pictureDetails": {
        "pictureURL": ["https://example.com/image1.jpg"]
      },
      "itemSpecifics": [
        {"name": "Brand", "value": "Apple"},
        {"name": "Model", "value": "iPhone 15"}
      ]
    },
    {
      "title": "Product 2",
      "description": "Description 2",
      "primaryCategory": {"categoryId": "9355"},
      "startPrice": 89.99,
      "quantity": 5,
      "sku": "SKU-002",
      "condition": "New",
      "verifyOnly": true  // Only verify this one
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Bulk create completed: 2 successful, 0 failed",
  "data": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "success": true,
        "sku": "SKU-001",
        "data": {
          "itemId": "123456789012",
          "sku": "SKU-001",
          "startTime": "2024-01-15T10:00:00Z",
          "fees": []
        }
      },
      {
        "index": 1,
        "success": true,
        "sku": "SKU-002",
        "data": {
          "fees": [],
          "errors": [],
          "warnings": []
        }
      }
    ]
  },
  "metadata": {
    "account_used": "seller_username",
    "marketplace": "EBAY_DE",
    "operation": "BULK_CREATE",
    "parallel": true,
    "duration": "3450ms"
  }
}
```

---

### Bulk Update (PUT)

Update multiple listings in one request.

#### Endpoint
```
PUT /api/ebay/{accountId}/trading/listing/bulk?parallel=true&debug=1
```

#### Request Body
```json
{
  "marketplace": "EBAY_US",
  "items": [
    {
      "itemId": "123456789012",
      "startPrice": 79.99,
      "quantity": 20
    },
    {
      "sku": "SKU-002",
      "title": "Updated Title",
      "startPrice": 69.99
    },
    {
      "itemId": "234567890123",
      "pictureDetails": {
        "pictureURL": [
          "https://example.com/new-image1.jpg",
          "https://example.com/new-image2.jpg"
        ]
      }
    }
  ]
}
```

#### Response
```json
{
  "success": false,
  "message": "Bulk update completed: 2 successful, 1 failed",
  "data": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "results": [
      {
        "index": 0,
        "success": true,
        "itemId": "123456789012",
        "data": {
          "itemId": "123456789012",
          "fees": []
        }
      },
      {
        "index": 1,
        "success": true,
        "sku": "SKU-002",
        "data": {
          "itemId": "987654321098",
          "fees": []
        }
      },
      {
        "index": 2,
        "success": false,
        "itemId": "234567890123",
        "error": "Item not found",
        "errors": [
          {
            "code": 17,
            "shortMessage": "Item not found"
          }
        ]
      }
    ]
  },
  "metadata": {
    "operation": "BULK_UPDATE",
    "parallel": true,
    "duration": "2100ms"
  }
}
```

---

### Bulk Relist (PATCH)

Relist multiple ended listings in one request.

#### Endpoint
```
PATCH /api/ebay/{accountId}/trading/listing/bulk?parallel=true&debug=1
```

#### Request Body
```json
{
  "marketplace": "EBAY_DE",
  "items": [
    {
      "itemId": "111111111111"
      // No updates - just relist as-is
    },
    {
      "itemId": "222222222222",
      "startPrice": 99.99,
      "quantity": 15
    },
    {
      "itemId": "333333333333",
      "title": "New Title for Relisted Item",
      "pictureDetails": {
        "pictureURL": ["https://example.com/new-photo.jpg"]
      }
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Bulk relist completed: 3 successful, 0 failed",
  "data": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "success": true,
        "originalItemId": "111111111111",
        "newItemId": "444444444444",
        "data": {
          "itemId": "444444444444",
          "originalItemId": "111111111111",
          "fees": []
        }
      },
      {
        "index": 1,
        "success": true,
        "originalItemId": "222222222222",
        "newItemId": "555555555555",
        "data": {
          "itemId": "555555555555",
          "fees": []
        }
      },
      {
        "index": 2,
        "success": true,
        "originalItemId": "333333333333",
        "newItemId": "666666666666",
        "data": {
          "itemId": "666666666666",
          "fees": []
        }
      }
    ]
  },
  "metadata": {
    "operation": "BULK_RELIST",
    "parallel": true,
    "duration": "4200ms"
  }
}
```

---

### Bulk Delete (DELETE)

End multiple listings in one request.

#### Endpoint
```
DELETE /api/ebay/{accountId}/trading/listing/bulk?parallel=true&debug=1
```

#### Request Body
```json
{
  "marketplace": "EBAY_US",
  "reason": "NotAvailable",  // Default reason for all items
  "items": [
    {
      "itemId": "123456789012"
    },
    {
      "sku": "SKU-002",
      "reason": "LostOrBroken"  // Override default reason
    },
    {
      "itemId": "234567890123"
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Bulk delete completed: 3 successful, 0 failed",
  "data": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "success": true,
        "itemId": "123456789012",
        "data": {
          "success": true,
          "itemId": "123456789012",
          "endTime": "2024-01-15T10:30:00Z"
        }
      },
      {
        "index": 1,
        "success": true,
        "sku": "SKU-002",
        "data": {
          "success": true,
          "itemId": "987654321098"
        }
      },
      {
        "index": 2,
        "success": true,
        "itemId": "234567890123",
        "data": {
          "success": true,
          "itemId": "234567890123"
        }
      }
    ]
  },
  "metadata": {
    "operation": "BULK_DELETE",
    "parallel": true,
    "duration": "1800ms"
  }
}
```

---

### Bulk Operation Best Practices

#### 1. **Parallel vs Sequential**

**Parallel (Default - Faster)**
```
?parallel=true  // Process all items simultaneously
```
- ✅ Fastest for large batches
- ✅ Best for independent items
- ⚠️ Higher memory usage
- ⚠️ All failures happen simultaneously

**Sequential (Safer)**
```
?parallel=false  // Process one at a time
```
- ✅ Lower memory usage
- ✅ Easier debugging (stops at first error in logs)
- ✅ Better for rate-limit sensitive operations
- ⚠️ Slower for large batches

#### 2. **Batch Size Recommendations**

- **Parallel**: 10-50 items per request (eBay rate limits)
- **Sequential**: 50-100 items per request
- **Large datasets**: Split into multiple requests

#### 3. **Error Handling**

```javascript
const response = await fetch('/api/ebay/account/trading/listing/bulk', {
  method: 'POST',
  body: JSON.stringify({ items: [...] })
});

const result = await response.json();

// Check overall success
if (!result.success) {
  console.log(`${result.data.failed} items failed`);
}

// Process individual results
result.data.results.forEach((item, index) => {
  if (item.success) {
    console.log(`Item ${index}: Success - ItemID ${item.data.itemId}`);
  } else {
    console.error(`Item ${index}: Failed - ${item.error}`);
    console.error('eBay Errors:', item.errors);
  }
});
```

#### 4. **Progress Tracking**

```javascript
// Process in chunks with progress tracking
const CHUNK_SIZE = 20;
const items = [...]; // Your 1000 items

for (let i = 0; i < items.length; i += CHUNK_SIZE) {
  const chunk = items.slice(i, i + CHUNK_SIZE);

  const response = await fetch('/api/ebay/account/trading/listing/bulk', {
    method: 'POST',
    body: JSON.stringify({ items: chunk })
  });

  const result = await response.json();
  console.log(`Progress: ${i + chunk.length}/${items.length} - ${result.data.successful} successful`);

  // Optional: delay between chunks to avoid rate limits
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

#### 5. **Handling Partial Failures**

```javascript
const result = await bulkCreate(items);

// Retry failed items
const failedItems = result.data.results
  .filter(r => !r.success)
  .map(r => items[r.index]);

if (failedItems.length > 0) {
  console.log(`Retrying ${failedItems.length} failed items...`);
  const retryResult = await bulkCreate(failedItems);
}

// Collect successful items
const successfulItems = result.data.results
  .filter(r => r.success)
  .map(r => ({
    index: r.index,
    itemId: r.data.itemId,
    sku: r.sku
  }));
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

### Example 5: Relist Ended Listing with Price Update
```json
{
  "itemId": "123456789012",
  "startPrice": 89.99,
  "quantity": 15
}
```

### Example 6: Relist with Multiple Updates
```json
{
  "itemId": "123456789012",
  "marketplace": "EBAY_US",
  "startPrice": 79.99,
  "quantity": 25,
  "title": "Apple iPhone 15 Pro 256GB - Limited Time Offer",
  "pictureDetails": {
    "pictureURL": [
      "https://example.com/new-photo1.jpg",
      "https://example.com/new-photo2.jpg"
    ]
  },
  "itemSpecifics": [
    {"name": "Brand", "value": "Apple"},
    {"name": "Model", "value": "iPhone 15 Pro"},
    {"name": "Storage Capacity", "value": "256GB"},
    {"name": "Color", "value": "Blue Titanium"}
  ]
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