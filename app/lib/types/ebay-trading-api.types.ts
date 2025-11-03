/**
 * eBay Trading API Types
 * Complete type definitions for AddItem/ReviseItem API calls
 * Based on: https://developer.ebay.com/Devzone/XML/docs/Reference/eBay/AddItem.html
 */

// Main Item Type for Creating/Updating Listings
export interface EbayTradingItem {
  // Required Fields
  sku?: string; // SKU (Stock Keeping Unit)
  title: string; // Item title (required)
  description: string; // Item description (required)
  primaryCategory: {
    categoryId: string; // Primary category ID (required)
  };
  startPrice: number; // Starting price (required)
  quantity: number; // Quantity available (required)
  country?: string; // Item location country
  currency?: string; // Currency for pricing
  listingDuration?: string; // Duration like 'GTC', 'Days_3', 'Days_7', etc.
  listingType?: 'FixedPriceItem' | 'Chinese' | 'LeadGeneration' | 'PersonalOffer';

  // Condition
  conditionId?: number; // 1000=New, 3000=Used, etc.
  condition?: 'New' | 'New other' | 'New with defects' | 'Manufacturer refurbished' | 'Seller refurbished' | 'Used' | 'Very Good' | 'Good' | 'Acceptable' | 'For parts or not working'; // Alternative: use string name
  conditionDescription?: string;
  conditionDescriptors?: Array<{
    name: string;
    value: string | string[];
    additionalInfo?: string;
  }>;

  // Location
  location?: string; // City, State
  postalCode?: string;

  // Secondary Category
  secondaryCategory?: {
    categoryId: string;
  };

  // Best Offer
  bestOfferDetails?: {
    bestOfferEnabled?: boolean;
  };

  // Pictures
  pictureDetails?: {
    galleryType?: 'Gallery' | 'Plus' | 'Featured' | 'Large';
    pictureURL?: string[];
  };

  // Item Specifics (attributes like Brand, Model, etc.)
  itemSpecifics?: Array<{
    name: string;
    value: string | string[];
  }>;

  // Product Identifiers
  productListingDetails?: {
    upc?: string;
    ean?: string;
    isbn?: string;
    brandMPN?: {
      brand: string;
      mpn: string;
    };
    productReferenceId?: string;
    includeStockPhotoURL?: boolean;
    useStockPhotoURLAsGallery?: boolean;
    includeeBayProductDetails?: boolean;
    useFirstProduct?: boolean;
    returnSearchResultOnDuplicates?: boolean;
  };

  // Shipping Details
  shippingDetails?: {
    shippingType?: 'Flat' | 'Calculated' | 'Freight' | 'Free' | 'NotSpecified';
    shippingServiceOptions?: Array<{
      shippingServicePriority: number;
      shippingService: string;
      shippingServiceCost: number;
      shippingServiceAdditionalCost?: number;
      freeShipping?: boolean;
    }>;
    internationalShippingServiceOption?: Array<{
      shippingServicePriority: number;
      shippingService: string;
      shippingServiceCost: number;
      shippingServiceAdditionalCost?: number;
      shipToLocation?: string[];
    }>;
    excludeShipToLocation?: string[];
    globalShipping?: boolean;
    rateTableDetails?: {
      domesticRateTableId?: string;
      internationalRateTableId?: string;
    };
    calculatedShippingRate?: {
      packagingHandlingCosts?: number;
      internationalPackagingHandlingCosts?: number;
    };
    salesTax?: {
      salesTaxPercent?: number;
      salesTaxState?: string;
      shippingIncludedInTax?: boolean;
    };
  };

  // Shipping Package Details
  shippingPackageDetails?: {
    measurementUnit?: 'English' | 'Metric';
    packageDepth?: number;
    packageLength?: number;
    packageWidth?: number;
    weightMajor?: number;
    weightMinor?: number;
    shippingPackage?: string; // PackageThickEnvelope, PackageThickEnvelope, etc.
    shippingIrregular?: boolean;
  };

  // Return Policy
  returnPolicy?: {
    returnsAcceptedOption: 'ReturnsAccepted' | 'ReturnsNotAccepted';
    refundOption?: string; // MoneyBack, MoneyBackOrExchange
    returnsWithinOption?: string; // Days_14, Days_30, Days_60
    shippingCostPaidByOption?: string; // Buyer, Seller
    description?: string;
    internationalReturnsAcceptedOption?: string;
    internationalRefundOption?: string;
    internationalReturnsWithinOption?: string;
    internationalShippingCostPaidByOption?: string;
  };

  // Payment
  paymentMethods?: string[]; // PayPal, CreditCard, etc.
  payPalEmailAddress?: string;
  autoPay?: boolean;

  // Business Policies (Professional sellers)
  sellerProfiles?: {
    sellerPaymentProfile?: {
      paymentProfileId?: number;
      paymentProfileName?: string;
    };
    sellerReturnProfile?: {
      returnProfileId?: number;
      returnProfileName?: string;
    };
    sellerShippingProfile?: {
      shippingProfileId?: number;
      shippingProfileName?: string;
    };
  };

  // Listing Details
  listingDetails?: {
    bestOfferAutoAcceptPrice?: number;
    minimumBestOfferPrice?: number;
    localListingDistance?: string;
  };

  // Listing Enhancements
  listingEnhancement?: string[]; // BoldTitle, Featured, Highlight, etc.

  // Store Categories (for eBay Store sellers)
  storefront?: {
    storeCategoryId?: number;
    storeCategory2Id?: number;
    storeCategoryName?: string;
    storeCategory2Name?: string;
  };

  // Charity
  charity?: {
    charityId: string;
    donationPercent: number;
  };

  // Digital Goods
  digitalGoodInfo?: {
    digitalDelivery?: boolean;
  };

  // Discount Price Info
  discountPriceInfo?: {
    originalRetailPrice?: number;
    minimumAdvertisedPrice?: number;
    minimumAdvertisedPriceExposure?: 'PreCheckout' | 'DuringCheckout' | 'None';
    soldOffeBay?: boolean;
    soldOneBay?: boolean;
  };

  // VAT Details (for European sellers)
  vatDetails?: {
    businessSeller?: boolean;
    restrictedToBusiness?: boolean;
    vatPercent?: number;
  };

  // Regulatory (EU Compliance)
  regulatory?: {
    manufacturer?: {
      companyName: string;
      cityName?: string;
      country?: string;
      email?: string;
      phone?: string;
      postalCode?: string;
      stateOrProvince?: string;
      street1?: string;
      street2?: string;
      contactURL?: string;
    };
    responsiblePersons?: Array<{
      companyName: string;
      types?: string[];
      cityName?: string;
      country?: string;
      email?: string;
      phone?: string;
      postalCode?: string;
      stateOrProvince?: string;
      street1?: string;
      street2?: string;
      contactURL?: string;
    }>;
    energyEfficiencyLabel?: {
      imageURL?: string;
      imageDescription?: string;
      productInformationsheet?: string;
    };
    hazmat?: {
      component?: string;
      signalWord?: string;
      pictograms?: string[];
      statements?: string[];
    };
    productSafety?: {
      component?: string;
      pictograms?: string[];
      statements?: string[];
    };
    documents?: Array<{
      documentId: string;
    }>;
    repairScore?: number;
  };

  // Extended Producer Responsibility
  extendedProducerResponsibility?: {
    ecoParticipationFee?: number;
  };

  // Custom Policies
  customPolicies?: {
    productCompliancePolicyId?: number[];
    takeBackPolicyId?: number;
    regionalProductCompliancePolicies?: Array<{
      country: string;
      policyId: number[];
    }>;
    regionalTakeBackPolicies?: Array<{
      country: string;
      policyId: number[];
    }>;
  };

  // Item Compatibility (for Parts & Accessories)
  itemCompatibilityList?: Array<{
    compatibilityNotes?: string;
    nameValueList: Array<{
      name: string;
      value: string | string[];
    }>;
  }>;

  // Extended Contact Details
  extendedSellerContactDetails?: {
    classifiedAdContactByEmailEnabled?: boolean;
    contactHoursDetails?: {
      timeZoneId?: string;
      hours1Days?: string;
      hours1AnyTime?: boolean;
      hours1From?: string;
      hours1To?: string;
      hours2Days?: string;
      hours2AnyTime?: boolean;
      hours2From?: string;
      hours2To?: string;
    };
  };

  // Seller Contact Details
  sellerContactDetails?: {
    companyName?: string;
    county?: string;
    street?: string;
    street2?: string;
    phoneCountryCode?: string;
    phoneAreaOrCityCode?: string;
    phoneLocalNumber?: string;
  };

  // Video
  videoDetails?: {
    videoId?: string[];
  };

  // Vehicle-specific
  vin?: string; // Vehicle Identification Number
  vrm?: string; // Vehicle Registration Mark

  // Other Fields
  dispatchTimeMax?: number; // Handling time in days
  lotSize?: number; // For lots/wholesale
  privateListing?: boolean; // Hide buyer ID in feedback
  reservePrice?: number; // For auctions
  buyItNowPrice?: number; // For auctions with Buy It Now
  scheduleTime?: string; // Schedule listing start time
  uuid?: string; // Unique identifier
  subTitle?: string; // Subtitle (additional fee)
  applicationData?: string; // Custom application data
  buyerResponsibleForShipping?: boolean;
  categoryMappingAllowed?: boolean;
  crossBorderTrade?: string[]; // For international visibility
  disableBuyerRequirements?: boolean;
  eBayPlus?: boolean; // For eBay Plus program
  listingSubtype2?: string;
  mappingReferenceId?: string;

  // API-specific fields (not sent to eBay)
  marketplace?: string; // Target eBay marketplace (EBAY_US, EBAY_DE, etc.)
  verifyOnly?: boolean; // If true, only verify the listing without creating it
  paymentDetails?: {
    daysToFullPayment?: number;
    depositAmount?: number;
    depositType?: string;
    hoursToDeposit?: number;
  };
  pickupInStoreDetails?: {
    eligibleForPickupInStore?: boolean;
  };
  quantityRestrictionPerBuyer?: {
    maximumQuantity?: number;
  };
  sellerProvidedTitle?: string;
  site?: string; // eBay site
  shipToLocations?: string[];
  shippingServiceCostOverrideList?: Array<{
    shippingServicePriority: number;
    shippingServiceType: string;
    shippingServiceCost: number;
    shippingServiceAdditionalCost?: number;
  }>;
  taxCategory?: string;
  useTaxTable?: boolean;
}

// Request type for API calls
export interface TradingAPIRequest {
  item: EbayTradingItem;
  errorHandling?: 'BestEffort' | 'FailOnError';
  errorLanguage?: string;
  messageId?: string;
  version?: string;
  warningLevel?: 'High' | 'Low';
}

// Response types
export interface TradingAPIResponse {
  ack: 'Success' | 'Failure' | 'Warning' | 'PartialFailure';
  itemId?: string;
  sku?: string;
  startTime?: string;
  endTime?: string;
  fees?: Array<{
    name: string;
    fee: number;
    promotionalDiscount?: number;
  }>;
  categoryId?: string;
  category2Id?: string;
  errors?: Array<{
    errorCode: string;
    shortMessage: string;
    longMessage: string;
    severity: string;
  }>;
  warnings?: Array<{
    errorCode: string;
    shortMessage: string;
    longMessage: string;
    severity: string;
  }>;
}

// Condition IDs mapping
export const CONDITION_IDS = {
  'New': 1000,
  'New other': 1500,
  'New with defects': 1750,
  'Manufacturer refurbished': 2000,
  'Seller refurbished': 2500,
  'Used': 3000,
  'Very Good': 4000,
  'Good': 5000,
  'Acceptable': 6000,
  'For parts or not working': 7000
} as const;

// Listing Duration options
export const LISTING_DURATIONS = {
  'Days_1': 'Days_1',
  'Days_3': 'Days_3',
  'Days_5': 'Days_5',
  'Days_7': 'Days_7',
  'Days_10': 'Days_10',
  'Days_14': 'Days_14',
  'Days_21': 'Days_21',
  'Days_30': 'Days_30',
  'Days_60': 'Days_60',
  'Days_90': 'Days_90',
  'Days_120': 'Days_120',
  'GTC': 'GTC' // Good Till Cancelled
} as const;