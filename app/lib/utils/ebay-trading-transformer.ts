/**
 * eBay Trading API Transformer
 * Transforms TypeScript objects to eBay XML-compatible format
 */

import { EbayTradingItem, CONDITION_IDS } from '../types/ebay-trading-api.types';
import { normalizeCountry } from './country-normalizer';

/**
 * Transform a TypeScript item object to eBay Trading API XML format
 */
export function transformItemToEbayFormat(item: EbayTradingItem, marketplace: string = 'EBAY_US'): any {
  const currency = getCurrencyForMarketplace(marketplace);
  const country = getCountryForMarketplace(marketplace);

  const ebayItem: any = {};

  // Basic required fields
  if (item.sku) ebayItem.SKU = item.sku;
  if (item.title) ebayItem.Title = item.title;
  // Description needs to be a simple string - CDATA wrapping happens in buildXmlRequest
  if (item.description) ebayItem.Description = item.description;

  // Categories
  if (item.primaryCategory) {
    ebayItem.PrimaryCategory = {
      CategoryID: item.primaryCategory.categoryId
    };
  }

  if (item.secondaryCategory) {
    ebayItem.SecondaryCategory = {
      CategoryID: item.secondaryCategory.categoryId
    };
  }

  // Pricing
  if (item.startPrice !== undefined) {
    ebayItem.StartPrice = {
      '_currencyID': currency,
      '_value': item.startPrice.toString()
    };
  }

  if (item.buyItNowPrice !== undefined) {
    ebayItem.BuyItNowPrice = {
      '_currencyID': currency,
      '_value': item.buyItNowPrice.toString()
    };
  }

  if (item.reservePrice !== undefined) {
    ebayItem.ReservePrice = {
      '_currencyID': currency,
      '_value': item.reservePrice.toString()
    };
  }

  // Quantity and lot size
  if (item.quantity !== undefined) ebayItem.Quantity = item.quantity;
  if (item.lotSize) ebayItem.LotSize = item.lotSize;

  // Location - normalize country to ISO 2-letter code (e.g., "Germany" -> "DE")
  const normalizedCountry = item.country ? normalizeCountry(item.country) : country;
  ebayItem.Country = normalizedCountry;
  // Location is required - use provided location, or default to country
  ebayItem.Location = item.location || normalizedCountry;
  if (item.postalCode) ebayItem.PostalCode = item.postalCode;
  ebayItem.Currency = item.currency || getCurrencyForMarketplace(marketplace);

  // Listing settings
  if (item.listingDuration) ebayItem.ListingDuration = item.listingDuration;
  if (item.listingType) ebayItem.ListingType = item.listingType;
  if (item.dispatchTimeMax !== undefined) ebayItem.DispatchTimeMax = item.dispatchTimeMax;

  // Condition - conditionId is required for most categories
  if (item.conditionId) {
    ebayItem.ConditionID = item.conditionId;
  } else if (item.condition) {
    // Map condition string to condition ID (case-insensitive)
    const conditionKey = Object.keys(CONDITION_IDS).find(
      key => key.toLowerCase() === item.condition!.toLowerCase()
    ) as keyof typeof CONDITION_IDS;
    const conditionId = conditionKey ? CONDITION_IDS[conditionKey] : 1000;
    ebayItem.ConditionID = conditionId;
  } else {
    // Default to New (1000) if not specified
    ebayItem.ConditionID = 1000;
  }

  if (item.conditionDescription) {
    ebayItem.ConditionDescription = item.conditionDescription;
  }

  if (item.conditionDescriptors && item.conditionDescriptors.length > 0) {
    ebayItem.ConditionDescriptors = {
      ConditionDescriptor: item.conditionDescriptors.map(descriptor => ({
        Name: descriptor.name,
        Value: Array.isArray(descriptor.value) ? descriptor.value : [descriptor.value],
        ...(descriptor.additionalInfo && { AdditionalInfo: descriptor.additionalInfo })
      }))
    };
  }

  // Pictures
  if (item.pictureDetails) {
    const pictureDetails: any = {};
    if (item.pictureDetails.galleryType) {
      pictureDetails.GalleryType = item.pictureDetails.galleryType;
    }
    if (item.pictureDetails.pictureURL && item.pictureDetails.pictureURL.length > 0) {
      pictureDetails.PictureURL = item.pictureDetails.pictureURL;
    }
    if (Object.keys(pictureDetails).length > 0) {
      ebayItem.PictureDetails = pictureDetails;
    }
  }

  // Item Specifics
  if (item.itemSpecifics && item.itemSpecifics.length > 0) {
    // German translations for EBAY_DE marketplace
    const germanSpecificMapping: Record<string, string> = {
      'Brand': 'Marke',
      'Model': 'Modell',
      'Storage Capacity': 'Speicherkapazität',
      'Color': 'Farbe',
      'Colour': 'Farbe',
      'Compatible Brand': 'Kompatible Marke',
      'Compatible Model': 'Kompatibles Modell',
      'Type': 'Produktart',
      'Material': 'Material',
      'Size': 'Größe',
      'Manufacturer': 'Hersteller',
      'MPN': 'Herstellernummer',
      'Condition': 'Zustand',
      'Style': 'Stil',
      'Theme': 'Thema',
      'Features': 'Besonderheiten',
      'Country/Region of Manufacture': 'Herstellungsland und -region',
    };

    ebayItem.ItemSpecifics = {
      NameValueList: item.itemSpecifics.map(spec => {
        // Use German name if marketplace is EBAY_DE and mapping exists
        const finalName = (marketplace === 'EBAY_DE' && germanSpecificMapping[spec.name])
          ? germanSpecificMapping[spec.name]
          : spec.name;

        return {
          Name: finalName,
          Value: Array.isArray(spec.value) ? spec.value : [spec.value]
        };
      })
    };
  }

  // Product Listing Details
  if (item.productListingDetails) {
    const pld: any = {};
    const details = item.productListingDetails;

    if (details.upc) pld.UPC = details.upc;
    if (details.ean) pld.EAN = details.ean;
    if (details.isbn) pld.ISBN = details.isbn;

    if (details.brandMPN) {
      pld.BrandMPN = {
        Brand: details.brandMPN.brand,
        MPN: details.brandMPN.mpn
      };
    }

    if (details.productReferenceId) pld.ProductReferenceID = details.productReferenceId;
    if (details.includeStockPhotoURL !== undefined) pld.IncludeStockPhotoURL = details.includeStockPhotoURL;
    if (details.useStockPhotoURLAsGallery !== undefined) pld.UseStockPhotoURLAsGallery = details.useStockPhotoURLAsGallery;
    if (details.includeeBayProductDetails !== undefined) pld.IncludeeBayProductDetails = details.includeeBayProductDetails;
    if (details.useFirstProduct !== undefined) pld.UseFirstProduct = details.useFirstProduct;
    if (details.returnSearchResultOnDuplicates !== undefined) pld.ReturnSearchResultOnDuplicates = details.returnSearchResultOnDuplicates;

    if (Object.keys(pld).length > 0) {
      ebayItem.ProductListingDetails = pld;
    }
  }

  // Shipping Details - handled below with business policies logic

  // Shipping Package Details
  if (item.shippingPackageDetails) {
    const pkg: any = {};
    const details = item.shippingPackageDetails;

    if (details.measurementUnit) pkg.MeasurementUnit = details.measurementUnit;
    if (details.packageDepth !== undefined) pkg.PackageDepth = details.packageDepth;
    if (details.packageLength !== undefined) pkg.PackageLength = details.packageLength;
    if (details.packageWidth !== undefined) pkg.PackageWidth = details.packageWidth;
    if (details.weightMajor !== undefined) pkg.WeightMajor = details.weightMajor;
    if (details.weightMinor !== undefined) pkg.WeightMinor = details.weightMinor;
    if (details.shippingPackage) pkg.ShippingPackage = details.shippingPackage;
    if (details.shippingIrregular !== undefined) pkg.ShippingIrregular = details.shippingIrregular;

    if (Object.keys(pkg).length > 0) {
      ebayItem.ShippingPackageDetails = pkg;
    }
  }

  // Return Policy - handled below with business policies logic

  // Business Policies
  // Note: Business policies can only be used if you have them set up in your eBay account
  // If not using business policies, you must provide shippingDetails and returnPolicy
  if (item.sellerProfiles) {
    const profiles: any = {};

    if (item.sellerProfiles.sellerPaymentProfile) {
      profiles.SellerPaymentProfile = {
        PaymentProfileID: item.sellerProfiles.sellerPaymentProfile.paymentProfileId,
        PaymentProfileName: item.sellerProfiles.sellerPaymentProfile.paymentProfileName
      };
    }

    if (item.sellerProfiles.sellerReturnProfile) {
      profiles.SellerReturnProfile = {
        ReturnProfileID: item.sellerProfiles.sellerReturnProfile.returnProfileId,
        ReturnProfileName: item.sellerProfiles.sellerReturnProfile.returnProfileName
      };
    }

    if (item.sellerProfiles.sellerShippingProfile) {
      profiles.SellerShippingProfile = {
        ShippingProfileID: item.sellerProfiles.sellerShippingProfile.shippingProfileId,
        ShippingProfileName: item.sellerProfiles.sellerShippingProfile.shippingProfileName
      };
    }

    if (Object.keys(profiles).length > 0) {
      ebayItem.SellerProfiles = profiles;
    }
  }

  // Add default shipping and return policy if no business policies OR if explicitly provided
  // This serves as a fallback if business policies fail
  if (!item.sellerProfiles || item.shippingDetails || item.returnPolicy) {
    // Handle Shipping Details
    if (item.shippingDetails && item.shippingDetails.shippingServiceOptions && item.shippingDetails.shippingServiceOptions.length > 0) {
      // User provided shipping details - use them
      const shipping: any = {};
      const details = item.shippingDetails;

      if (details.shippingType) shipping.ShippingType = details.shippingType;

      if (details.shippingServiceOptions && details.shippingServiceOptions.length > 0) {
        shipping.ShippingServiceOptions = details.shippingServiceOptions.map(option => ({
          ShippingServicePriority: option.shippingServicePriority,
          ShippingService: option.shippingService,
          ShippingServiceCost: {
            '_currencyID': currency,
            '_value': option.shippingServiceCost.toString()
          },
          ...(option.shippingServiceAdditionalCost !== undefined && {
            ShippingServiceAdditionalCost: {
              '_currencyID': currency,
              '_value': option.shippingServiceAdditionalCost.toString()
            }
          }),
          ...(option.freeShipping !== undefined && { FreeShipping: option.freeShipping })
        }));
      }

      if (Object.keys(shipping).length > 0) {
        ebayItem.ShippingDetails = shipping;
      }
    } else if (!item.sellerProfiles) {
      // No business policies and no shipping details - add a minimal default
      ebayItem.ShippingDetails = {
        ShippingType: 'Flat',
        ShippingServiceOptions: [{
          ShippingServicePriority: 1,
          ShippingService: getDefaultShippingService(marketplace),
          ShippingServiceCost: {
            '_currencyID': currency,
            '_value': '0.00'
          }
        }]
      };
    }

    // Handle Return Policy
    if (item.returnPolicy) {
      // User provided return policy
      const returnPolicy: any = {
        ReturnsAcceptedOption: item.returnPolicy.returnsAcceptedOption
      };

      if (item.returnPolicy.refundOption) returnPolicy.RefundOption = item.returnPolicy.refundOption;
      if (item.returnPolicy.returnsWithinOption) returnPolicy.ReturnsWithinOption = item.returnPolicy.returnsWithinOption;
      if (item.returnPolicy.shippingCostPaidByOption) returnPolicy.ShippingCostPaidByOption = item.returnPolicy.shippingCostPaidByOption;
      if (item.returnPolicy.description) returnPolicy.Description = item.returnPolicy.description;

      ebayItem.ReturnPolicy = returnPolicy;
    } else if (!item.sellerProfiles) {
      // No business policies and no return policy - add a default one
      ebayItem.ReturnPolicy = {
        ReturnsAcceptedOption: 'ReturnsAccepted',
        RefundOption: 'MoneyBack',
        ReturnsWithinOption: 'Days_30',
        ShippingCostPaidByOption: 'Buyer'
      };
    }
  }

  // Regulatory (EU Compliance)
  if (item.regulatory) {
    const regulatory: any = {};

    if (item.regulatory.manufacturer) {
      regulatory.Manufacturer = transformAddress(item.regulatory.manufacturer);
    }

    if (item.regulatory.responsiblePersons && item.regulatory.responsiblePersons.length > 0) {
      regulatory.ResponsiblePersons = {
        ResponsiblePerson: item.regulatory.responsiblePersons.map(person => {
          const rp: any = transformAddress(person);
          if (person.types && person.types.length > 0) {
            rp.Types = { Type: person.types };
          }
          return rp;
        })
      };
    }

    if (item.regulatory.energyEfficiencyLabel) {
      const eel: any = {};
      if (item.regulatory.energyEfficiencyLabel.imageURL) eel.ImageURL = item.regulatory.energyEfficiencyLabel.imageURL;
      if (item.regulatory.energyEfficiencyLabel.imageDescription) eel.ImageDescription = item.regulatory.energyEfficiencyLabel.imageDescription;
      if (item.regulatory.energyEfficiencyLabel.productInformationsheet) eel.ProductInformationsheet = item.regulatory.energyEfficiencyLabel.productInformationsheet;
      if (Object.keys(eel).length > 0) {
        regulatory.EnergyEfficiencyLabel = eel;
      }
    }

    if (item.regulatory.hazmat) {
      const hazmat: any = {};
      if (item.regulatory.hazmat.component) hazmat.Component = item.regulatory.hazmat.component;
      if (item.regulatory.hazmat.signalWord) hazmat.SignalWord = item.regulatory.hazmat.signalWord;
      if (item.regulatory.hazmat.pictograms && item.regulatory.hazmat.pictograms.length > 0) {
        hazmat.Pictograms = { Pictogram: item.regulatory.hazmat.pictograms };
      }
      if (item.regulatory.hazmat.statements && item.regulatory.hazmat.statements.length > 0) {
        hazmat.Statements = { Statement: item.regulatory.hazmat.statements };
      }
      if (Object.keys(hazmat).length > 0) {
        regulatory.Hazmat = hazmat;
      }
    }

    if (item.regulatory.productSafety) {
      const safety: any = {};
      if (item.regulatory.productSafety.component) safety.Component = item.regulatory.productSafety.component;
      if (item.regulatory.productSafety.pictograms && item.regulatory.productSafety.pictograms.length > 0) {
        safety.Pictograms = { Pictogram: item.regulatory.productSafety.pictograms };
      }
      if (item.regulatory.productSafety.statements && item.regulatory.productSafety.statements.length > 0) {
        safety.Statements = { Statement: item.regulatory.productSafety.statements };
      }
      if (Object.keys(safety).length > 0) {
        regulatory.ProductSafety = safety;
      }
    }

    if (item.regulatory.documents && item.regulatory.documents.length > 0) {
      regulatory.Documents = {
        Document: item.regulatory.documents.map(doc => ({ DocumentID: doc.documentId }))
      };
    }

    if (item.regulatory.repairScore !== undefined) {
      regulatory.RepairScore = item.regulatory.repairScore;
    }

    if (Object.keys(regulatory).length > 0) {
      ebayItem.Regulatory = regulatory;
    }
  }

  // Other fields
  if (item.bestOfferDetails) {
    ebayItem.BestOfferDetails = {
      BestOfferEnabled: item.bestOfferDetails.bestOfferEnabled
    };
  }

  if (item.listingDetails) {
    const ld: any = {};
    if (item.listingDetails.bestOfferAutoAcceptPrice !== undefined) {
      ld.BestOfferAutoAcceptPrice = {
        '_currencyID': currency,
        '_value': item.listingDetails.bestOfferAutoAcceptPrice.toString()
      };
    }
    if (item.listingDetails.minimumBestOfferPrice !== undefined) {
      ld.MinimumBestOfferPrice = {
        '_currencyID': currency,
        '_value': item.listingDetails.minimumBestOfferPrice.toString()
      };
    }
    if (item.listingDetails.localListingDistance) {
      ld.LocalListingDistance = item.listingDetails.localListingDistance;
    }
    if (Object.keys(ld).length > 0) {
      ebayItem.ListingDetails = ld;
    }
  }

  if (item.listingEnhancement && item.listingEnhancement.length > 0) {
    ebayItem.ListingEnhancement = item.listingEnhancement;
  }

  if (item.storefront) {
    const sf: any = {};
    if (item.storefront.storeCategoryId) sf.StoreCategoryID = item.storefront.storeCategoryId;
    if (item.storefront.storeCategory2Id) sf.StoreCategory2ID = item.storefront.storeCategory2Id;
    if (item.storefront.storeCategoryName) sf.StoreCategoryName = item.storefront.storeCategoryName;
    if (item.storefront.storeCategory2Name) sf.StoreCategory2Name = item.storefront.storeCategory2Name;
    if (Object.keys(sf).length > 0) {
      ebayItem.Storefront = sf;
    }
  }

  if (item.charity) {
    ebayItem.Charity = {
      CharityID: item.charity.charityId,
      DonationPercent: item.charity.donationPercent
    };
  }

  if (item.digitalGoodInfo) {
    ebayItem.DigitalGoodInfo = {
      DigitalDelivery: item.digitalGoodInfo.digitalDelivery
    };
  }

  if (item.discountPriceInfo) {
    const dpi: any = {};
    if (item.discountPriceInfo.originalRetailPrice !== undefined) {
      dpi.OriginalRetailPrice = {
        '_currencyID': currency,
        '_value': item.discountPriceInfo.originalRetailPrice.toString()
      };
    }
    if (item.discountPriceInfo.minimumAdvertisedPrice !== undefined) {
      dpi.MinimumAdvertisedPrice = {
        '_currencyID': currency,
        '_value': item.discountPriceInfo.minimumAdvertisedPrice.toString()
      };
    }
    if (item.discountPriceInfo.minimumAdvertisedPriceExposure) {
      dpi.MinimumAdvertisedPriceExposure = item.discountPriceInfo.minimumAdvertisedPriceExposure;
    }
    if (item.discountPriceInfo.soldOffeBay !== undefined) dpi.SoldOffeBay = item.discountPriceInfo.soldOffeBay;
    if (item.discountPriceInfo.soldOneBay !== undefined) dpi.SoldOneBay = item.discountPriceInfo.soldOneBay;
    if (Object.keys(dpi).length > 0) {
      ebayItem.DiscountPriceInfo = dpi;
    }
  }

  if (item.vatDetails) {
    const vat: any = {};
    if (item.vatDetails.businessSeller !== undefined) vat.BusinessSeller = item.vatDetails.businessSeller;
    if (item.vatDetails.restrictedToBusiness !== undefined) vat.RestrictedToBusiness = item.vatDetails.restrictedToBusiness;
    if (item.vatDetails.vatPercent !== undefined) vat.VATPercent = item.vatDetails.vatPercent;
    if (Object.keys(vat).length > 0) {
      ebayItem.VATDetails = vat;
    }
  }

  if (item.extendedProducerResponsibility) {
    const epr: any = {};
    if (item.extendedProducerResponsibility.ecoParticipationFee !== undefined) {
      epr.EcoParticipationFee = {
        '_currencyID': currency,
        '_value': item.extendedProducerResponsibility.ecoParticipationFee.toString()
      };
    }
    if (Object.keys(epr).length > 0) {
      ebayItem.ExtendedProducerResponsibility = epr;
    }
  }

  if (item.customPolicies) {
    const cp: any = {};
    if (item.customPolicies.productCompliancePolicyId) {
      cp.ProductCompliancePolicyID = item.customPolicies.productCompliancePolicyId;
    }
    if (item.customPolicies.takeBackPolicyId) {
      cp.TakeBackPolicyID = item.customPolicies.takeBackPolicyId;
    }
    if (item.customPolicies.regionalProductCompliancePolicies) {
      cp.RegionalProductCompliancePolicies = {
        CountryPolicies: item.customPolicies.regionalProductCompliancePolicies.map(policy => ({
          Country: normalizeCountry(policy.country),
          PolicyID: policy.policyId
        }))
      };
    }
    if (item.customPolicies.regionalTakeBackPolicies) {
      cp.RegionalTakeBackPolicies = {
        CountryPolicies: item.customPolicies.regionalTakeBackPolicies.map(policy => ({
          Country: normalizeCountry(policy.country),
          PolicyID: policy.policyId
        }))
      };
    }
    if (Object.keys(cp).length > 0) {
      ebayItem.CustomPolicies = cp;
    }
  }

  if (item.itemCompatibilityList && item.itemCompatibilityList.length > 0) {
    ebayItem.ItemCompatibilityList = {
      Compatibility: item.itemCompatibilityList.map(compat => ({
        ...(compat.compatibilityNotes && { CompatibilityNotes: compat.compatibilityNotes }),
        NameValueList: compat.nameValueList.map(nvl => ({
          Name: nvl.name,
          Value: Array.isArray(nvl.value) ? nvl.value : [nvl.value]
        }))
      }))
    };
  }

  // Additional fields
  if (item.paymentMethods && item.paymentMethods.length > 0) ebayItem.PaymentMethods = item.paymentMethods;
  if (item.payPalEmailAddress) ebayItem.PayPalEmailAddress = item.payPalEmailAddress;
  if (item.autoPay !== undefined) ebayItem.AutoPay = item.autoPay;
  if (item.privateListing !== undefined) ebayItem.PrivateListing = item.privateListing;
  if (item.buyerResponsibleForShipping !== undefined) ebayItem.BuyerResponsibleForShipping = item.buyerResponsibleForShipping;
  if (item.categoryMappingAllowed !== undefined) ebayItem.CategoryMappingAllowed = item.categoryMappingAllowed;
  if (item.crossBorderTrade) ebayItem.CrossBorderTrade = item.crossBorderTrade;
  if (item.disableBuyerRequirements !== undefined) ebayItem.DisableBuyerRequirements = item.disableBuyerRequirements;
  if (item.eBayPlus !== undefined) ebayItem.eBayPlus = item.eBayPlus;
  if (item.listingSubtype2) ebayItem.ListingSubtype2 = item.listingSubtype2;
  if (item.scheduleTime) ebayItem.ScheduleTime = item.scheduleTime;
  if (item.uuid) ebayItem.UUID = item.uuid;
  if (item.subTitle) ebayItem.SubTitle = item.subTitle;
  if (item.applicationData) ebayItem.ApplicationData = item.applicationData;
  if (item.sellerProvidedTitle) ebayItem.SellerProvidedTitle = item.sellerProvidedTitle;
  if (item.shipToLocations) ebayItem.ShipToLocations = item.shipToLocations;
  if (item.taxCategory) ebayItem.TaxCategory = item.taxCategory;
  if (item.useTaxTable !== undefined) ebayItem.UseTaxTable = item.useTaxTable;
  if (item.vin) ebayItem.VIN = item.vin;
  if (item.vrm) ebayItem.VRM = item.vrm;

  if (item.videoDetails && item.videoDetails.videoId && item.videoDetails.videoId.length > 0) {
    ebayItem.VideoDetails = {
      VideoID: item.videoDetails.videoId
    };
  }

  if (item.paymentDetails) {
    const pd: any = {};
    if (item.paymentDetails.daysToFullPayment) pd.DaysToFullPayment = item.paymentDetails.daysToFullPayment;
    if (item.paymentDetails.depositAmount !== undefined) {
      pd.DepositAmount = {
        '_currencyID': currency,
        '_value': item.paymentDetails.depositAmount.toString()
      };
    }
    if (item.paymentDetails.depositType) pd.DepositType = item.paymentDetails.depositType;
    if (item.paymentDetails.hoursToDeposit) pd.HoursToDeposit = item.paymentDetails.hoursToDeposit;
    if (Object.keys(pd).length > 0) {
      ebayItem.PaymentDetails = pd;
    }
  }

  if (item.pickupInStoreDetails) {
    ebayItem.PickupInStoreDetails = {
      EligibleForPickupInStore: item.pickupInStoreDetails.eligibleForPickupInStore
    };
  }

  if (item.quantityRestrictionPerBuyer) {
    ebayItem.QuantityRestrictionPerBuyer = {
      MaximumQuantity: item.quantityRestrictionPerBuyer.maximumQuantity
    };
  }

  if (item.extendedSellerContactDetails) {
    const escd: any = {};
    if (item.extendedSellerContactDetails.classifiedAdContactByEmailEnabled !== undefined) {
      escd.ClassifiedAdContactByEmailEnabled = item.extendedSellerContactDetails.classifiedAdContactByEmailEnabled;
    }
    if (item.extendedSellerContactDetails.contactHoursDetails) {
      const chd: any = {};
      const hours = item.extendedSellerContactDetails.contactHoursDetails;
      if (hours.timeZoneId) chd.TimeZoneID = hours.timeZoneId;
      if (hours.hours1Days) chd.Hours1Days = hours.hours1Days;
      if (hours.hours1AnyTime !== undefined) chd.Hours1AnyTime = hours.hours1AnyTime;
      if (hours.hours1From) chd.Hours1From = hours.hours1From;
      if (hours.hours1To) chd.Hours1To = hours.hours1To;
      if (hours.hours2Days) chd.Hours2Days = hours.hours2Days;
      if (hours.hours2AnyTime !== undefined) chd.Hours2AnyTime = hours.hours2AnyTime;
      if (hours.hours2From) chd.Hours2From = hours.hours2From;
      if (hours.hours2To) chd.Hours2To = hours.hours2To;
      if (Object.keys(chd).length > 0) {
        escd.ContactHoursDetails = chd;
      }
    }
    if (Object.keys(escd).length > 0) {
      ebayItem.ExtendedSellerContactDetails = escd;
    }
  }

  if (item.sellerContactDetails) {
    const scd: any = {};
    if (item.sellerContactDetails.companyName) scd.CompanyName = item.sellerContactDetails.companyName;
    if (item.sellerContactDetails.county) scd.County = item.sellerContactDetails.county;
    if (item.sellerContactDetails.street) scd.Street = item.sellerContactDetails.street;
    if (item.sellerContactDetails.street2) scd.Street2 = item.sellerContactDetails.street2;
    if (item.sellerContactDetails.phoneCountryCode) scd.PhoneCountryCode = item.sellerContactDetails.phoneCountryCode;
    if (item.sellerContactDetails.phoneAreaOrCityCode) scd.PhoneAreaOrCityCode = item.sellerContactDetails.phoneAreaOrCityCode;
    if (item.sellerContactDetails.phoneLocalNumber) scd.PhoneLocalNumber = item.sellerContactDetails.phoneLocalNumber;
    if (Object.keys(scd).length > 0) {
      ebayItem.SellerContactDetails = scd;
    }
  }

  if (item.shippingServiceCostOverrideList && item.shippingServiceCostOverrideList.length > 0) {
    ebayItem.ShippingServiceCostOverrideList = {
      ShippingServiceCostOverride: item.shippingServiceCostOverrideList.map(override => ({
        ShippingServicePriority: override.shippingServicePriority,
        ShippingServiceType: override.shippingServiceType,
        ShippingServiceCost: {
          '_currencyID': currency,
          '_value': override.shippingServiceCost.toString()
        },
        ...(override.shippingServiceAdditionalCost !== undefined && {
          ShippingServiceAdditionalCost: {
            '_currencyID': currency,
            '_value': override.shippingServiceAdditionalCost.toString()
          }
        })
      }))
    };
  }

  return ebayItem;
}

/**
 * Transform address-like objects
 * Normalizes country to ISO 2-letter code
 */
function transformAddress(address: any): any {
  const transformed: any = {};

  if (address.companyName) transformed.CompanyName = address.companyName;
  if (address.cityName) transformed.CityName = address.cityName;
  // Normalize country to ISO 2-letter code (e.g., "Germany" -> "DE", "France" -> "FR")
  if (address.country) transformed.Country = normalizeCountry(address.country);
  if (address.email) transformed.Email = address.email;
  if (address.phone) transformed.Phone = address.phone;
  if (address.postalCode) transformed.PostalCode = address.postalCode;
  if (address.stateOrProvince) transformed.StateOrProvince = address.stateOrProvince;
  if (address.street1) transformed.Street1 = address.street1;
  if (address.street2) transformed.Street2 = address.street2;
  if (address.contactURL) transformed.ContactURL = address.contactURL;

  return transformed;
}

/**
 * Get currency for marketplace
 */
function getCurrencyForMarketplace(marketplace: string): string {
  const currencies: Record<string, string> = {
    'EBAY_US': 'USD',
    'EBAY_UK': 'GBP',
    'EBAY_DE': 'EUR',
    'EBAY_AU': 'AUD',
    'EBAY_CA': 'CAD',
    'EBAY_FR': 'EUR',
    'EBAY_IT': 'EUR',
    'EBAY_ES': 'EUR',
    'EBAY_CH': 'CHF',
    'EBAY_AT': 'EUR',
    'EBAY_BE': 'EUR',
    'EBAY_NL': 'EUR'
  };
  return currencies[marketplace] || 'USD';
}

/**
 * Get country code for marketplace
 */
function getCountryForMarketplace(marketplace: string): string {
  const countries: Record<string, string> = {
    'EBAY_US': 'US',
    'EBAY_UK': 'GB',
    'EBAY_DE': 'DE',
    'EBAY_AU': 'AU',
    'EBAY_CA': 'CA',
    'EBAY_FR': 'FR',
    'EBAY_IT': 'IT',
    'EBAY_ES': 'ES',
    'EBAY_CH': 'CH',
    'EBAY_AT': 'AT',
    'EBAY_BE': 'BE',
    'EBAY_NL': 'NL'
  };
  return countries[marketplace] || 'US';
}

/**
 * Get default shipping service for marketplace
 */
function getDefaultShippingService(marketplace: string): string {
  const defaultServices: Record<string, string> = {
    'EBAY_US': 'USPSPriority',
    'EBAY_UK': 'UK_RoyalMailFirstClassStandard',
    'EBAY_DE': 'DE_DHLPaket',
    'EBAY_AU': 'AU_Regular',
    'EBAY_CA': 'CA_RegularParcel',
    'EBAY_FR': 'FR_ColiPoste',
    'EBAY_IT': 'IT_RegularMail',
    'EBAY_ES': 'ES_StandardInternational',
    'EBAY_CH': 'CH_SwissPostPriority',
    'EBAY_AT': 'AT_StandardDispatch',
    'EBAY_BE': 'BE_StandardDelivery',
    'EBAY_NL': 'NL_StandardDelivery'
  };
  return defaultServices[marketplace] || 'Other';
}