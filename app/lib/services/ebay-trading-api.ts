import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { TRADING_API_CONFIG, getSiteId, getCountryCode, getCurrency, CONDITION_IDS } from '../config/trading-api';

interface EbayUserToken {
  id: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  ebayUserId: string;
  ebayUsername: string | null;
}

export interface TradingApiError {
  code: string;
  shortMessage: string;
  longMessage?: string;
  severity?: string;
}

export class EbayTradingApiService {
  private xmlParser: XMLParser;
  private xmlBuilder: XMLBuilder;
  private accessToken: string;
  private siteId: number;
  private apiUrl: string;

  constructor(account: EbayUserToken, marketplace: string = 'EBAY_US') {
    this.accessToken = account.accessToken;
    this.siteId = getSiteId(marketplace);
    this.apiUrl = process.env.EBAY_SANDBOX === 'true'
      ? TRADING_API_CONFIG.sandbox.url
      : TRADING_API_CONFIG.production.url;

    // Configure XML parser
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '_',
      textNodeName: '_value',
      parseAttributeValue: true,
      trimValues: true,
    });

    // Configure XML builder
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '_',
      textNodeName: '_value',
      format: true,
      indentBy: '  ',
    });
  }

  /**
   * Make a Trading API call
   */
  private async callAPI(callName: string, requestBody: any): Promise<any> {
    const headers = this.buildHeaders(callName);
    const xml = this.buildXmlRequest(callName, requestBody);

    console.log(`[Trading API] Making ${callName} call to ${this.apiUrl}`);
    console.log(`[Trading API] Site ID: ${this.siteId}`);
    console.log('[Trading API] Request XML:', xml.substring(0, 500) + '...');

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: xml,
      });

      const responseXml = await response.text();
      console.log('[Trading API] Response status:', response.status);
      console.log('[Trading API] Response XML:', responseXml.substring(0, 500) + '...');

      return this.parseResponse(responseXml, callName);
    } catch (error) {
      console.error('[Trading API] Network error:', error);
      throw error;
    }
  }

  /**
   * Build headers for Trading API request
   */
  private buildHeaders(callName: string): Record<string, string> {
    return {
      'X-EBAY-API-IAF-TOKEN': this.accessToken, // OAuth token
      'X-EBAY-API-SITEID': this.siteId.toString(),
      'X-EBAY-API-COMPATIBILITY-LEVEL': TRADING_API_CONFIG.production.version,
      'X-EBAY-API-CALL-NAME': callName,
      'Content-Type': 'text/xml',
    };
  }

  /**
   * Build XML request
   */
  private buildXmlRequest(callName: string, body: any): string {
    const request = {
      [`${callName}Request`]: {
        '_xmlns': 'urn:ebay:apis:eBLBaseComponents',
        'ErrorLanguage': 'en_US',
        'WarningLevel': 'High',
        ...body,
      },
    };

    const xml = '<?xml version="1.0" encoding="utf-8"?>\n' + this.xmlBuilder.build(request);
    return xml;
  }

  /**
   * Parse XML response
   */
  private parseResponse(xml: string, callName: string): any {
    const parsed = this.xmlParser.parse(xml);
    const responseKey = `${callName}Response`;

    if (!parsed[responseKey]) {
      console.error('[Trading API] Invalid response format:', xml.substring(0, 500));
      throw new Error('Invalid XML response format');
    }

    const response = parsed[responseKey];

    // Check for errors
    if (response.Ack === 'Failure' || response.Ack === 'PartialFailure') {
      const errors = this.extractErrors(response);
      console.error('[Trading API] API errors:', errors);
      throw {
        success: false,
        errors,
        ack: response.Ack,
      };
    }

    return response;
  }

  /**
   * Extract errors from response
   */
  private extractErrors(response: any): TradingApiError[] {
    const errors = response.Errors || [];
    const errorArray = Array.isArray(errors) ? errors : [errors];

    return errorArray.map((error: any) => ({
      code: error.ErrorCode || 'UNKNOWN',
      shortMessage: error.ShortMessage || 'Unknown error',
      longMessage: error.LongMessage,
      severity: error.SeverityCode,
    }));
  }

  /**
   * Add Fixed Price Item (Create listing)
   */
  async addFixedPriceItem(listing: any): Promise<any> {
    const marketplace = Object.keys(TRADING_API_CONFIG.siteIds).find(
      key => TRADING_API_CONFIG.siteIds[key as keyof typeof TRADING_API_CONFIG.siteIds] === this.siteId
    ) || 'EBAY_US';

    const country = getCountryCode(marketplace);
    const currency = getCurrency(marketplace);

    // Build item data
    const item: any = {
      SKU: listing.sku,
      Title: listing.title,
      Description: `<![CDATA[${listing.description}]]>`,
      PrimaryCategory: {
        CategoryID: listing.categoryId,
      },
      StartPrice: {
        '_currencyID': currency,
        '_value': listing.price.toString(),
      },
      Quantity: listing.quantity,
      Country: country,
      Currency: currency,
      DispatchTimeMax: listing.handlingTime || 3,
      ListingDuration: listing.listingDuration || 'GTC',
      ListingType: 'FixedPriceItem',
      ConditionID: CONDITION_IDS[listing.condition as keyof typeof CONDITION_IDS] || 1000,
      Location: listing.location || country,
      PostalCode: listing.postalCode,
    };

    // Add condition description if provided
    if (listing.conditionDescription) {
      item.ConditionDescription = listing.conditionDescription;
    }

    // Add images
    if (listing.images && listing.images.length > 0) {
      item.PictureDetails = {
        GalleryType: 'Gallery',
        PictureURL: listing.images,
      };
    }

    // Add item specifics with German translations for EBAY_DE
    if (listing.itemSpecifics && Object.keys(listing.itemSpecifics).length > 0) {
      // Map English names to German for German marketplace
      const germanSpecificMapping: Record<string, string> = {
        'Brand': 'Marke',
        'Model': 'Modell',
        'Storage Capacity': 'Speicherkapazität',
        'Color': 'Farbe',
        'Compatible Brand': 'Kompatible Marke',
        'Compatible Model': 'Kompatibles Modell',
        'Type': 'Produktart',
        'Material': 'Material',
      };

      const nameValueList = Object.entries(listing.itemSpecifics).map(([name, value]) => {
        // Use German name if marketplace is EBAY_DE and mapping exists
        const finalName = (marketplace === 'EBAY_DE' && germanSpecificMapping[name])
          ? germanSpecificMapping[name]
          : name;

        return {
          Name: finalName,
          Value: Array.isArray(value) ? value : [value],
        };
      });

      item.ItemSpecifics = {
        NameValueList: nameValueList,
      };
    }

    // Add product identifiers if provided
    if (listing.productIdentifiers) {
      const productListingDetails: any = {};
      if (listing.productIdentifiers.ean) {
        productListingDetails.EAN = listing.productIdentifiers.ean;
      }
      if (listing.productIdentifiers.upc) {
        productListingDetails.UPC = listing.productIdentifiers.upc;
      }
      if (listing.productIdentifiers.isbn) {
        productListingDetails.ISBN = listing.productIdentifiers.isbn;
      }
      if (listing.productIdentifiers.mpn || listing.productIdentifiers.brand) {
        productListingDetails.BrandMPN = {
          Brand: listing.productIdentifiers.brand || listing.itemSpecifics?.Brand || 'Unbranded',
          MPN: listing.productIdentifiers.mpn || 'Does not apply',
        };
      }

      if (Object.keys(productListingDetails).length > 0) {
        item.ProductListingDetails = productListingDetails;
      }
    }

    // Check if using business policies first
    if (listing.sellerProfiles) {
      // Add business policies
      item.SellerProfiles = {
        SellerPaymentProfile: {
          PaymentProfileID: listing.sellerProfiles.paymentProfileId || listing.sellerProfiles.paymentProfileName,
        },
        SellerReturnProfile: {
          ReturnProfileID: listing.sellerProfiles.returnProfileId || listing.sellerProfiles.returnProfileName,
        },
        SellerShippingProfile: {
          ShippingProfileID: listing.sellerProfiles.shippingProfileId || listing.sellerProfiles.shippingProfileName,
        },
      };
    } else {
      // Only add inline policies if NOT using business policies
      // Add shipping details
      if (listing.shippingOptions && listing.shippingOptions.length > 0) {
        item.ShippingDetails = {
          ShippingType: 'Flat',
          ShippingServiceOptions: listing.shippingOptions.map((option: any, index: number) => {
            const shippingService: any = {
              ShippingServicePriority: index + 1,
              ShippingService: option.service,
              ShippingServiceCost: {
                '_currencyID': currency,
                '_value': option.cost.toString(),
              },
            };

            // Add additional cost if provided
            if (option.additionalCost !== undefined) {
              shippingService.ShippingServiceAdditionalCost = {
                '_currencyID': currency,
                '_value': option.additionalCost.toString(),
              };
            }

            return shippingService;
          }),
        };
      }

      // Add return policy
      if (listing.returnPolicy) {
        item.ReturnPolicy = {
          ReturnsAcceptedOption: listing.returnPolicy.returnsAccepted ? 'ReturnsAccepted' : 'ReturnsNotAccepted',
          RefundOption: listing.returnPolicy.refundOption || 'MoneyBack',
          ReturnsWithinOption: listing.returnPolicy.returnsWithin || 'Days_30',
          ShippingCostPaidByOption: listing.returnPolicy.shippingCostPaidBy || 'Buyer',
        };

        if (listing.returnPolicy.description) {
          item.ReturnPolicy.Description = listing.returnPolicy.description;
        }
      }

      // Add payment methods only if not managed payments
      // Most accounts now use managed payments, so PayPal is handled automatically
      if (listing.paymentMethods && !listing.managedPayments) {
        item.PaymentMethods = listing.paymentMethods;
        if (listing.paypalEmail) {
          item.PayPalEmailAddress = listing.paypalEmail;
        }
      }
    }


    const requestBody = {
      Item: item,
    };

    const response = await this.callAPI('AddFixedPriceItem', requestBody);

    return {
      success: true,
      itemId: response.ItemID,
      sku: response.SKU,
      startTime: response.StartTime,
      endTime: response.EndTime,
      fees: this.parseFees(response.Fees),
      categoryId: response.CategoryID,
      category2Id: response.Category2ID,
      warnings: response.Errors ? this.extractErrors(response) : [],
    };
  }

  /**
   * Verify Add Fixed Price Item (Test without creating)
   */
  async verifyAddFixedPriceItem(listing: any): Promise<any> {
    // Same as addFixedPriceItem but calls VerifyAddFixedPriceItem
    const marketplace = Object.keys(TRADING_API_CONFIG.siteIds).find(
      key => TRADING_API_CONFIG.siteIds[key as keyof typeof TRADING_API_CONFIG.siteIds] === this.siteId
    ) || 'EBAY_US';

    const country = getCountryCode(marketplace);
    const currency = getCurrency(marketplace);

    const item: any = {
      SKU: listing.sku,
      Title: listing.title,
      Description: `<![CDATA[${listing.description}]]>`,
      PrimaryCategory: {
        CategoryID: listing.categoryId,
      },
      StartPrice: {
        '_currencyID': currency,
        '_value': listing.price.toString(),
      },
      Quantity: listing.quantity,
      Country: country,
      Currency: currency,
      DispatchTimeMax: listing.handlingTime || 3,
      ListingDuration: listing.listingDuration || 'GTC',
      ListingType: 'FixedPriceItem',
      ConditionID: CONDITION_IDS[listing.condition as keyof typeof CONDITION_IDS] || 1000,
    };

    const requestBody = {
      Item: item,
    };

    const response = await this.callAPI('VerifyAddFixedPriceItem', requestBody);

    return {
      success: true,
      fees: this.parseFees(response.Fees),
      errors: response.Errors ? this.extractErrors(response) : [],
      warnings: response.Warnings ? this.extractErrors(response) : [],
    };
  }

  /**
   * Get Item (Retrieve listing details) - supports both ItemID and SKU
   */
  async getItem(identifier: string, useSku: boolean = false): Promise<any> {
    const requestBody: any = {
      IncludeWatchCount: true,
      IncludeItemSpecifics: true,
      DetailLevel: 'ReturnAll',
    };

    // GetItem can use either ItemID or SKU
    // SKU only works for seller's own fixed-price items
    if (useSku) {
      requestBody.SKU = identifier;
      console.log(`[TRADING API] Getting item by SKU: ${identifier}`);
    } else {
      requestBody.ItemID = identifier;
      console.log(`[TRADING API] Getting item by ItemID: ${identifier}`);
    }

    const response = await this.callAPI('GetItem', requestBody);

    return {
      success: true,
      item: response.Item,
    };
  }

  /**
   * Get Seller List - Retrieve seller's active listings
   */
  async getSellerList(options: {
    startTimeFrom: Date;
    startTimeTo: Date;
    pagination?: { entriesPerPage: number; pageNumber: number };
    sku?: string;
    includeVariations?: boolean;
  }): Promise<any> {
    const requestBody: any = {
      DetailLevel: 'ReturnAll',
      StartTimeFrom: options.startTimeFrom.toISOString(),
      StartTimeTo: options.startTimeTo.toISOString(),
      IncludeVariations: options.includeVariations || false,
    };

    // Note: SKU filter is not directly supported in GetSellerList
    // We'll filter results after retrieval if SKU is provided

    if (options.pagination) {
      requestBody.Pagination = {
        EntriesPerPage: options.pagination.entriesPerPage,
        PageNumber: options.pagination.pageNumber,
      };
    }

    const response = await this.callAPI('GetSellerList', requestBody);

    let items = response.ItemArray?.Item
      ? Array.isArray(response.ItemArray.Item)
        ? response.ItemArray.Item
        : [response.ItemArray.Item]
      : [];

    // Filter by SKU if provided
    if (options.sku) {
      console.log(`[TRADING API] Filtering results for SKU: ${options.sku}`);
      items = items.filter((item: any) => item.SKU === options.sku);
    }

    return {
      items,
      pagination: {
        totalNumberOfEntries: response.PaginationResult?.TotalNumberOfEntries || 0,
        totalNumberOfPages: response.PaginationResult?.TotalNumberOfPages || 0,
        pageNumber: response.PageNumber || 1,
        entriesPerPage: response.EntriesPerPage || 20,
        hasMoreItems: response.HasMoreItems === 'true',
      },
    };
  }

  /**
   * Get Item ID by SKU using GetSellerList
   */
  async getItemIdBySku(sku: string): Promise<string | null> {
    console.log(`[TRADING API] Looking up ItemID for SKU: ${sku}`);

    try {
      // GetSellerList doesn't support SKU filter directly, need to search through results
      let pageNumber = 1;
      const maxPages = 5; // Limit search to first 5 pages (100 items)

      while (pageNumber <= maxPages) {
        const requestBody = {
          DetailLevel: 'ReturnAll',
          StartTimeFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
          StartTimeTo: new Date().toISOString(),
          IncludeVariations: false, // Don't need variations for SKU lookup
          Pagination: {
            EntriesPerPage: 20,
            PageNumber: pageNumber
          }
        };

        console.log(`[TRADING API] Searching page ${pageNumber} for SKU: ${sku}`);
        const response = await this.callAPI('GetSellerList', requestBody);

        if (response.ItemArray && response.ItemArray.Item) {
          const items = Array.isArray(response.ItemArray.Item)
            ? response.ItemArray.Item
            : [response.ItemArray.Item];

          for (const item of items) {
            // Check if SKU matches and item is active
            if (item.SKU === sku && item.SellingStatus?.ListingStatus === 'Active') {
              console.log(`[TRADING API] Found ItemID ${item.ItemID} for SKU ${sku}`);
              return item.ItemID;
            }
          }
        }

        // Check if there are more pages
        if (response.HasMoreItems !== 'true') {
          break;
        }

        pageNumber++;
      }

      console.log(`[TRADING API] No active item found with SKU: ${sku} after searching ${pageNumber} pages`);
      return null;
    } catch (error) {
      console.error(`[TRADING API] Error looking up SKU:`, error);
      return null;
    }
  }

  /**
   * Revise Fixed Price Item (Update listing)
   */
  async reviseFixedPriceItem(identifier: string, updates: any): Promise<any> {
    const marketplace = Object.keys(TRADING_API_CONFIG.siteIds).find(
      key => TRADING_API_CONFIG.siteIds[key as keyof typeof TRADING_API_CONFIG.siteIds] === this.siteId
    ) || 'EBAY_US';
    const currency = getCurrency(marketplace);

    const item: any = {};

    // Check if identifier is a SKU or ItemID (ItemIDs are numeric)
    if (/^\d+$/.test(identifier)) {
      item.ItemID = identifier;
      console.log(`[TRADING API] Using ItemID directly: ${identifier}`);
    } else {
      // Try to get ItemID from SKU first
      console.log(`[TRADING API] Attempting to find ItemID for SKU: ${identifier}`);
      const itemId = await this.getItemIdBySku(identifier);

      if (itemId) {
        item.ItemID = itemId;
        console.log(`[TRADING API] Using ItemID ${itemId} (found from SKU ${identifier})`);
      } else {
        // Fallback to using SKU directly (may fail if item wasn't created with this SKU)
        item.SKU = identifier;
        console.log(`[TRADING API] WARNING: Could not find ItemID for SKU, using SKU directly: ${identifier}`);
      }
    }

    // Add fields to update
    if (updates.title) item.Title = updates.title;
    if (updates.description) item.Description = `<![CDATA[${updates.description}]]>`;
    if (updates.price) {
      item.StartPrice = {
        '_currencyID': currency,
        '_value': updates.price.toString(),
      };
    }
    if (updates.quantity !== undefined) item.Quantity = updates.quantity;

    // Update images if provided
    if (updates.images && updates.images.length > 0) {
      item.PictureDetails = {
        PictureURL: updates.images,
      };
    }

    // Update item specifics if provided
    if (updates.itemSpecifics) {
      const germanSpecificMapping: Record<string, string> = {
        'Brand': 'Marke',
        'Model': 'Modell',
        'Storage Capacity': 'Speicherkapazität',
        'Color': 'Farbe',
      };

      const nameValueList = Object.entries(updates.itemSpecifics).map(([name, value]) => {
        const finalName = (marketplace === 'EBAY_DE' && germanSpecificMapping[name])
          ? germanSpecificMapping[name]
          : name;

        return {
          Name: finalName,
          Value: Array.isArray(value) ? value : [value],
        };
      });

      item.ItemSpecifics = {
        NameValueList: nameValueList,
      };
    }

    // Update business policies if provided
    if (updates.sellerProfiles) {
      item.SellerProfiles = {
        SellerPaymentProfile: {
          PaymentProfileID: updates.sellerProfiles.paymentProfileId || updates.sellerProfiles.paymentProfileName,
        },
        SellerReturnProfile: {
          ReturnProfileID: updates.sellerProfiles.returnProfileId || updates.sellerProfiles.returnProfileName,
        },
        SellerShippingProfile: {
          ShippingProfileID: updates.sellerProfiles.shippingProfileId || updates.sellerProfiles.shippingProfileName,
        },
      };
    }

    // Update shipping if provided (only if not using business policies)
    if (updates.shippingOptions && !updates.sellerProfiles) {
      item.ShippingDetails = {
        ShippingType: 'Flat',
        ShippingServiceOptions: updates.shippingOptions.map((option: any, index: number) => {
          const shippingService: any = {
            ShippingServicePriority: index + 1,
            ShippingService: option.service,
            ShippingServiceCost: {
              '_currencyID': currency,
              '_value': option.cost.toString(),
            },
          };

          if (option.additionalCost !== undefined) {
            shippingService.ShippingServiceAdditionalCost = {
              '_currencyID': currency,
              '_value': option.additionalCost.toString(),
            };
          }

          return shippingService;
        }),
      };
    }

    // Update condition if provided
    if (updates.condition) {
      item.ConditionID = CONDITION_IDS[updates.condition as keyof typeof CONDITION_IDS] || 1000;
    }

    if (updates.conditionDescription) {
      item.ConditionDescription = updates.conditionDescription;
    }

    const requestBody = {
      Item: item,
    };

    const response = await this.callAPI('ReviseFixedPriceItem', requestBody);

    return {
      success: true,
      itemId: response.ItemID,
      sku: response.SKU,
      startTime: response.StartTime,
      endTime: response.EndTime,
      fees: this.parseFees(response.Fees),
      warnings: response.Errors ? this.extractErrors(response) : [],
    };
  }

  /**
   * End Fixed Price Item (End listing)
   */
  async endFixedPriceItem(identifier: string, reason: string = 'OtherListingError'): Promise<any> {
    const requestBody: any = {
      EndingReason: reason,
    };

    // Check if identifier is a SKU or ItemID (ItemIDs are numeric)
    if (/^\d+$/.test(identifier)) {
      requestBody.ItemID = identifier;
      console.log(`[TRADING API] Ending listing with ItemID: ${identifier}`);
    } else {
      // Try to get ItemID from SKU first
      console.log(`[TRADING API] Attempting to find ItemID for SKU: ${identifier}`);
      const itemId = await this.getItemIdBySku(identifier);

      if (itemId) {
        requestBody.ItemID = itemId;
        console.log(`[TRADING API] Ending listing with ItemID ${itemId} (found from SKU ${identifier})`);
      } else {
        // Fallback to using SKU directly (may fail if item wasn't created with this SKU)
        requestBody.SKU = identifier;
        console.log(`[TRADING API] WARNING: Could not find ItemID for SKU, using SKU directly: ${identifier}`);
      }
    }

    const response = await this.callAPI('EndFixedPriceItem', requestBody);

    return {
      success: true,
      endTime: response.EndTime,
      itemId: response.ItemID,
      sku: response.SKU,
    };
  }

  /**
   * Parse fees from response
   */
  private parseFees(fees: any): any[] {
    if (!fees || !fees.Fee) return [];

    const feeArray = Array.isArray(fees.Fee) ? fees.Fee : [fees.Fee];

    return feeArray.map((fee: any) => ({
      name: fee.Name,
      amount: fee.Fee?._value || 0,
      currency: fee.Fee?._currencyID || 'USD',
      promotional: fee.PromotionalDiscount?._value || 0,
    }));
  }

  /**
   * Get User (Validate authentication)
   */
  async getUser(): Promise<any> {
    const requestBody = {
      DetailLevel: 'ReturnAll',
    };

    const response = await this.callAPI('GetUser', requestBody);

    return {
      success: true,
      userId: response.User?.UserID,
      email: response.User?.Email,
      feedbackScore: response.User?.FeedbackScore,
      registrationDate: response.User?.RegistrationDate,
      site: response.User?.Site,
      status: response.User?.Status,
    };
  }
}