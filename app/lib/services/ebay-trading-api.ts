import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { TRADING_API_CONFIG, getSiteId } from '../config/trading-api';
import { RealtimeDebugLogger } from './realtimeDebugLogger';
import { transformItemToEbayFormat } from '../utils/ebay-trading-transformer';
import { EbayTradingItem } from '../types/ebay-trading-api.types';

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
  private debugMode: boolean = false;

  constructor(account: EbayUserToken, marketplace: string = 'EBAY_DE', debugMode: boolean = false) {
    this.accessToken = account.accessToken;
    this.siteId = getSiteId(marketplace);
    this.debugMode = debugMode;
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
      cdataPropName: '__cdata', // Enable CDATA support
    });
  }

  /**
   * Make a Trading API call
   */
  private async callAPI(callName: string, requestBody: any): Promise<any> {
    const startTime = Date.now();
    const headers = this.buildHeaders(callName);
    const xml = this.buildXmlRequest(callName, requestBody);

    if (this.debugMode) {
      await RealtimeDebugLogger.debug('TRADING_API', `Making ${callName} call`, {
        url: this.apiUrl,
        siteId: this.siteId,
        callName,
        requestXml: xml.substring(0, 1000)
      });
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: xml,
      });

      const responseXml = await response.text();
      const duration = Date.now() - startTime;

      if (this.debugMode) {
        await RealtimeDebugLogger.info('TRADING_API_RESPONSE', `${callName} completed`, {
          status: response.status,
          duration,
          responseXml: responseXml.substring(0, 1000)
        });
      }

      return this.parseResponse(responseXml, callName);
    } catch (error) {
      if (this.debugMode) {
        await RealtimeDebugLogger.error('TRADING_API_ERROR', `Network error in ${callName}`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
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

    let xml = '<?xml version="1.0" encoding="utf-8"?>\n' + this.xmlBuilder.build(request);

    // Wrap Description content in CDATA if it exists and contains HTML
    // The XML builder escapes HTML, so we need to manually wrap it in CDATA
    if (body.Item && body.Item.Description) {
      const description = body.Item.Description;
      // Replace the escaped description with CDATA-wrapped version
      const escapedDesc = this.escapeXml(description);
      xml = xml.replace(
        `<Description>${escapedDesc}</Description>`,
        `<Description><![CDATA[${description}]]></Description>`
      );
    }

    return xml;
  }

  /**
   * Escape XML special characters (used for comparison)
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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
  async addFixedPriceItem(listing: EbayTradingItem): Promise<any> {
    const marketplace = Object.keys(TRADING_API_CONFIG.siteIds).find(
      key => TRADING_API_CONFIG.siteIds[key as keyof typeof TRADING_API_CONFIG.siteIds] === this.siteId
    ) || 'EBAY_DE';

    // Use the transformer to convert TypeScript types to eBay XML format
    const item = transformItemToEbayFormat(listing, marketplace);

    // Set defaults for required fields if not provided
    if (!item.ListingDuration) item.ListingDuration = 'GTC';
    if (!item.ListingType) item.ListingType = 'FixedPriceItem';
    if (!item.DispatchTimeMax) item.DispatchTimeMax = 3;

    // Validate critical fields
    if (!item.StartPrice || !item.StartPrice._value) {
      if (this.debugMode) {
        await RealtimeDebugLogger.error('TRADING_API', 'StartPrice is missing or invalid', {
          startPrice: item.StartPrice,
          listingStartPrice: listing.startPrice,
          item: JSON.stringify(item, null, 2)
        });
      }
      throw new Error('StartPrice is required and must be a valid number');
    }

    if (this.debugMode) {
      await RealtimeDebugLogger.debug('TRADING_API', 'Transformed item for AddFixedPriceItem', {
        marketplace,
        title: item.Title,
        startPrice: item.StartPrice,
        currency: item.Currency,
        quantity: item.Quantity,
        sku: item.SKU,
        categoryId: item.PrimaryCategory?.CategoryID
      });
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
  async verifyAddFixedPriceItem(listing: EbayTradingItem): Promise<any> {
    const marketplace = Object.keys(TRADING_API_CONFIG.siteIds).find(
      key => TRADING_API_CONFIG.siteIds[key as keyof typeof TRADING_API_CONFIG.siteIds] === this.siteId
    ) || 'EBAY_DE';

    // Use the transformer to convert TypeScript types to eBay XML format
    const item = transformItemToEbayFormat(listing, marketplace);

    // Set defaults for required fields if not provided
    if (!item.ListingDuration) item.ListingDuration = 'GTC';
    if (!item.ListingType) item.ListingType = 'FixedPriceItem';
    if (!item.DispatchTimeMax) item.DispatchTimeMax = 3;

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
      if (this.debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API', `Getting item by SKU: ${identifier}`, { sku: identifier });
      }
    } else {
      requestBody.ItemID = identifier;
      if (this.debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API', `Getting item by ItemID: ${identifier}`, { itemId: identifier });
      }
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
      if (this.debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API', `Filtering results for SKU: ${options.sku}`, { sku: options.sku });
      }
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
    if (this.debugMode) {
      await RealtimeDebugLogger.debug('TRADING_API', `Looking up ItemID for SKU: ${sku}`, { sku });
    }

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

        if (this.debugMode) {
          await RealtimeDebugLogger.debug('TRADING_API', `Searching page ${pageNumber} for SKU: ${sku}`, { pageNumber, sku });
        }
        const response = await this.callAPI('GetSellerList', requestBody);

        if (response.ItemArray && response.ItemArray.Item) {
          const items = Array.isArray(response.ItemArray.Item)
            ? response.ItemArray.Item
            : [response.ItemArray.Item];

          for (const item of items) {
            // Check if SKU matches and item is active
            if (item.SKU === sku && item.SellingStatus?.ListingStatus === 'Active') {
              if (this.debugMode) {
                await RealtimeDebugLogger.info('TRADING_API', `Found ItemID ${item.ItemID} for SKU ${sku}`, { itemId: item.ItemID, sku });
              }
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

      if (this.debugMode) {
        await RealtimeDebugLogger.warn('TRADING_API', `No active item found with SKU: ${sku} after searching ${pageNumber} pages`, { sku, pagesSearched: pageNumber });
      }
      return null;
    } catch (error) {
      if (this.debugMode) {
        await RealtimeDebugLogger.error('TRADING_API', `Error looking up SKU: ${sku}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      return null;
    }
  }

  /**
   * Revise Fixed Price Item (Update listing)
   */
  async reviseFixedPriceItem(identifier: string, updates: Partial<EbayTradingItem>): Promise<any> {
    const marketplace = Object.keys(TRADING_API_CONFIG.siteIds).find(
      key => TRADING_API_CONFIG.siteIds[key as keyof typeof TRADING_API_CONFIG.siteIds] === this.siteId
    ) || 'EBAY_DE';

    // Fields that CANNOT be updated after listing is created
    const nonUpdatableFields = [
      'primaryCategory', 'secondaryCategory', 'listingType', 'listingDuration',
      'productListingDetails', 'conditionId', 'condition', 'country', 'currency',
      'regulatory', 'buyItNowPrice', 'reservePrice', 'marketplace', 'verifyOnly',
      'conditionDescriptors', 'itemCompatibilityList', 'charity', 'paymentMethods',
      'payPalEmailAddress', 'autoPay'
    ];

    // Filter to only include fields that CAN be updated
    const allowedUpdates: Partial<EbayTradingItem> = {};
    const removedFields: string[] = [];

    for (const key in updates) {
      if (nonUpdatableFields.includes(key)) {
        removedFields.push(key);
      } else {
        (allowedUpdates as any)[key] = (updates as any)[key];
      }
    }

    if (this.debugMode && removedFields.length > 0) {
      await RealtimeDebugLogger.warn('TRADING_API', 'Filtered out non-updatable fields', {
        removedFields,
        note: 'These fields cannot be changed after listing is created. Use relist instead to change these fields.'
      });
    }

    // Use transformer for allowed fields (cast as we only have partial data)
    const item = transformItemToEbayFormat(allowedUpdates as EbayTradingItem, marketplace);

    // Add ItemID or SKU
    if (/^\d+$/.test(identifier)) {
      item.ItemID = identifier;
      if (this.debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API', `Using ItemID directly: ${identifier}`, { itemId: identifier });
      }
    } else {
      // Try to get ItemID from SKU first
      if (this.debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API', `Attempting to find ItemID for SKU: ${identifier}`, { sku: identifier });
      }
      const itemId = await this.getItemIdBySku(identifier);

      if (itemId) {
        item.ItemID = itemId;
        if (this.debugMode) {
          await RealtimeDebugLogger.info('TRADING_API', `Using ItemID ${itemId} (found from SKU ${identifier})`, { itemId, sku: identifier });
        }
      } else {
        // Fallback to using SKU directly (may fail if item wasn't created with this SKU)
        item.SKU = identifier;
        if (this.debugMode) {
          await RealtimeDebugLogger.warn('TRADING_API', `Could not find ItemID for SKU, using SKU directly: ${identifier}`, { sku: identifier });
        }
      }
    }

    if (this.debugMode) {
      await RealtimeDebugLogger.debug('TRADING_API', 'Revising item with filtered data', {
        itemId: item.ItemID,
        sku: item.SKU,
        fieldsToUpdate: Object.keys(item).filter(k => k !== 'ItemID' && k !== 'SKU'),
        removedFieldsCount: removedFields.length
      });
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
   * Relist Fixed Price Item (Relist ended listing)
   */
  async relistFixedPriceItem(itemId: string, updates?: Partial<EbayTradingItem>): Promise<any> {
    const marketplace = Object.keys(TRADING_API_CONFIG.siteIds).find(
      key => TRADING_API_CONFIG.siteIds[key as keyof typeof TRADING_API_CONFIG.siteIds] === this.siteId
    ) || 'EBAY_DE';

    // Build item data - start with ItemID (required)
    const item: any = {
      ItemID: itemId,
    };

    // If updates are provided, transform and merge them
    if (updates) {
      const transformedUpdates = transformItemToEbayFormat(updates as EbayTradingItem, marketplace);

      // Merge transformed updates (excluding ItemID which is already set)
      Object.keys(transformedUpdates).forEach(key => {
        if (key !== 'ItemID') {
          item[key] = transformedUpdates[key];
        }
      });

      if (this.debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API', 'Relist with updates', {
          itemId,
          marketplace,
          updatesProvided: Object.keys(transformedUpdates),
        });
      }
    }

    const requestBody = {
      Item: item,
    };

    if (this.debugMode) {
      await RealtimeDebugLogger.info('TRADING_API', 'Relisting item', {
        itemId,
        hasUpdates: !!updates,
        marketplace,
      });
    }

    const response = await this.callAPI('RelistFixedPriceItem', requestBody);

    if (this.debugMode) {
      await RealtimeDebugLogger.info('TRADING_API', 'Item relisted successfully', {
        newItemId: response.ItemID,
        originalItemId: itemId,
      });
    }

    return {
      success: true,
      itemId: response.ItemID,           // NEW ItemID
      originalItemId: itemId,             // Original ItemID for reference
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
      if (this.debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API', `Ending listing with ItemID: ${identifier}`, { itemId: identifier });
      }
    } else {
      // Try to get ItemID from SKU first
      if (this.debugMode) {
        await RealtimeDebugLogger.debug('TRADING_API', `Attempting to find ItemID for SKU: ${identifier}`, { sku: identifier });
      }
      const itemId = await this.getItemIdBySku(identifier);

      if (itemId) {
        requestBody.ItemID = itemId;
        if (this.debugMode) {
          await RealtimeDebugLogger.info('TRADING_API', `Ending listing with ItemID ${itemId} (found from SKU ${identifier})`, { itemId, sku: identifier });
        }
      } else {
        // Fallback to using SKU directly (may fail if item wasn't created with this SKU)
        requestBody.SKU = identifier;
        if (this.debugMode) {
          await RealtimeDebugLogger.warn('TRADING_API', `Could not find ItemID for SKU, using SKU directly: ${identifier}`, { sku: identifier });
        }
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

  /**
   * Check Item Status - Get status information for a specific item
   * Returns whether item is active, ended, or deleted
   */
  async getItemStatus(itemId: string): Promise<any> {
    const requestBody: any = {
      ItemID: itemId,
      IncludeWatchCount: false,
      IncludeItemSpecifics: false,
      DetailLevel: 'ReturnAll', // We need full details to get SellingStatus
    };

    if (this.debugMode) {
      await RealtimeDebugLogger.debug('TRADING_API', `Checking status for ItemID: ${itemId}`, { itemId });
    }

    try {
      const response = await this.callAPI('GetItem', requestBody);

      const item = response.Item;
      const sellingStatus = item.SellingStatus;
      const listingStatus = sellingStatus?.ListingStatus || 'Unknown';

      // Determine if item is active
      const isActive = listingStatus === 'Active';
      const isEnded = listingStatus === 'Completed' || listingStatus === 'Ended';

      if (this.debugMode) {
        await RealtimeDebugLogger.info('TRADING_API', `Item status retrieved`, {
          itemId,
          listingStatus,
          isActive,
          quantityAvailable: item.Quantity,
          quantitySold: sellingStatus?.QuantitySold
        });
      }

      return {
        success: true,
        itemId: item.ItemID,
        sku: item.SKU,
        title: item.Title,
        status: {
          listingStatus: listingStatus,
          isActive: isActive,
          isEnded: isEnded,
        },
        quantity: {
          total: item.Quantity,
          sold: sellingStatus?.QuantitySold || 0,
          available: (item.Quantity || 0) - (sellingStatus?.QuantitySold || 0),
        },
        pricing: {
          currentPrice: sellingStatus?.CurrentPrice?._value || sellingStatus?.CurrentPrice || 0,
          currency: sellingStatus?.CurrentPrice?._currencyID || item.Currency || 'USD',
        },
        timing: {
          startTime: item.StartTime || item.ListingDetails?.StartTime,
          endTime: item.EndTime || item.ListingDetails?.EndTime,
          listingDuration: item.ListingDuration,
        },
        listingType: item.ListingType,
        viewCount: item.HitCount || 0,
        watchCount: item.WatchCount || 0,
      };
    } catch (error: any) {
      // If item is not found or deleted, eBay returns an error
      if (error.errors) {
        const notFoundCodes = ['17', '361']; // Item not found error codes
        const errorCodes = error.errors.map((e: any) => e.code?.toString());

        const isNotFound = errorCodes.some((code: string) => notFoundCodes.includes(code));

        if (isNotFound) {
          if (this.debugMode) {
            await RealtimeDebugLogger.warn('TRADING_API', `Item not found or deleted: ${itemId}`, { itemId });
          }

          return {
            success: true,
            itemId: itemId,
            status: {
              listingStatus: 'NotFound',
              isActive: false,
              isEnded: true,
              isDeleted: true,
            },
            message: 'Item not found or has been deleted',
          };
        }
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Search Items by SKU and Title (HYBRID Optimized!)
   *
   * TWO-PHASE SEARCH STRATEGY:
   * Phase 1: Try EXACT SKU match with eBay's SKUArray filter (SUPER FAST!)
   * Phase 2: If not found, fall back to PARTIAL SKU match (supports prefix/suffix)
   *
   * PERFORMANCE OPTIMIZATIONS:
   * 1. Tries exact SKU match first with SKUArray (instant if exact match!)
   * 2. Uses categoryId for server-side filtering (reduces items by 90%+)
   * 3. Uses createdAt date range to narrow search window (10-50x faster!)
   * 4. Falls back to partial SKU matching only if exact match fails
   * 5. IMMEDIATELY RETURNS when match found (no unnecessary searching)
   *
   * @param sku - SKU to search for (tries exact first, then partial match)
   * @param title - Title to validate (partial match, case-insensitive)
   * @param categoryId - Optional eBay category ID for server-side filtering (highly recommended!)
   * @param createdAt - Optional creation date from your system (ISO string or Date) - HIGHLY RECOMMENDED for speed!
   * @returns Array with single matching item (returns immediately when found)
   */
  async searchItemBySkuAndTitle(sku: string, title: string, categoryId?: string, createdAt?: string | Date): Promise<any[]> {
    if (this.debugMode) {
      await RealtimeDebugLogger.debug('TRADING_API', 'Searching items by SKU and title (hybrid strategy)', {
        sku,
        title,
        categoryId,
        createdAt
      });
    }

    try {
      // Determine time range for search
      let timeRangeParams: any = {};

      if (createdAt) {
        // Use StartTime range based on createdAt (MUCH faster!)
        // Search ±14 days around the creation date for buffer
        const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;

        const startTimeFrom = new Date(createdDate);
        startTimeFrom.setDate(startTimeFrom.getDate() - 14); // 14 days before

        const startTimeTo = new Date(createdDate);
        startTimeTo.setDate(startTimeTo.getDate() + 14); // 14 days after

        timeRangeParams = {
          StartTimeFrom: startTimeFrom.toISOString(),
          StartTimeTo: startTimeTo.toISOString()
        };
      } else {
        // Use EndTime range to get all ACTIVE listings (slower)
        const endTimeTo = new Date();
        endTimeTo.setDate(endTimeTo.getDate() + 120); // 120 days in future
        const endTimeFrom = new Date(); // Now

        timeRangeParams = {
          EndTimeFrom: endTimeFrom.toISOString(),
          EndTimeTo: endTimeTo.toISOString()
        };
      }

      // ===========================================
      // PHASE 1: Try EXACT SKU match (SUPER FAST!)
      // ===========================================
      const exactMatchResult = await this.tryExactSkuMatch(sku, title, timeRangeParams, categoryId);

      if (exactMatchResult) {
        if (this.debugMode) {
          await RealtimeDebugLogger.info('TRADING_API', 'Exact SKU match found (Phase 1)', {
            itemId: exactMatchResult.itemId,
            sku: exactMatchResult.sku,
            title: exactMatchResult.title
          });
        }

        return [exactMatchResult];
      }

      // ===========================================
      // PHASE 2: Fall back to PARTIAL SKU match
      // ===========================================
      if (this.debugMode) {
        await RealtimeDebugLogger.info('TRADING_API', 'Exact match failed, trying partial SKU match (Phase 2)', {
          sku
        });
      }

      const partialMatchResult = await this.tryPartialSkuMatch(sku, title, timeRangeParams, categoryId);

      if (partialMatchResult) {
        if (this.debugMode) {
          await RealtimeDebugLogger.info('TRADING_API', 'Partial SKU match found (Phase 2)', {
            itemId: partialMatchResult.itemId,
            sku: partialMatchResult.sku,
            title: partialMatchResult.title
          });
        }

        return [partialMatchResult];
      }

      // No match found in either phase
      if (this.debugMode) {
        await RealtimeDebugLogger.warn('TRADING_API', 'No match found in both phases', {
          sku,
          title
        });
      }

      return [];

    } catch (error) {
      if (this.debugMode) {
        await RealtimeDebugLogger.error('TRADING_API', 'Error searching items', {
          error: error instanceof Error ? error.message : String(error),
          sku,
          title
        });
      }
      throw error;
    }
  }

  /**
   * PHASE 1: Try EXACT SKU match using SKUArray filter (FAST!)
   */
  private async tryExactSkuMatch(
    sku: string,
    title: string,
    timeRangeParams: any,
    categoryId?: string
  ): Promise<any | null> {
    let pageNumber = 1;
    const maxPages = 10; // Exact match should be quick

    while (pageNumber <= maxPages) {
      const requestBody: any = {
        ...timeRangeParams,
        SKUArray: {
          SKU: sku // EXACT SKU match - eBay filters server-side!
        },
        DetailLevel: 'ReturnAll',
        Pagination: {
          EntriesPerPage: 200,
          PageNumber: pageNumber
        },
        GranularityLevel: 'Fine'
      };

      if (categoryId) {
        requestBody.CategoryID = categoryId;
      }

      const response = await this.callAPI('GetSellerList', requestBody);

      if (response.ItemArray && response.ItemArray.Item) {
        const items = Array.isArray(response.ItemArray.Item)
          ? response.ItemArray.Item
          : [response.ItemArray.Item];

        // Check title match
        for (const item of items) {
          const itemTitle = (item.Title || '').toLowerCase();
          const searchTitle = title.toLowerCase();
          const titleMatches = itemTitle.includes(searchTitle);

          if (titleMatches) {
            return {
              itemId: item.ItemID,
              sku: item.SKU,
              title: item.Title,
              currentPrice: item.SellingStatus?.CurrentPrice?._value || item.SellingStatus?.CurrentPrice || 0,
              currency: item.SellingStatus?.CurrentPrice?._currencyID || item.Currency || 'USD',
              quantity: {
                total: item.Quantity,
                sold: item.SellingStatus?.QuantitySold || 0,
                available: (item.Quantity || 0) - (item.SellingStatus?.QuantitySold || 0)
              },
              listingStatus: item.SellingStatus?.ListingStatus || 'Unknown',
              listingType: item.ListingType,
              startTime: item.StartTime,
              endTime: item.EndTime,
              pictureUrls: item.PictureDetails?.PictureURL || [],
              categoryId: item.PrimaryCategory?.CategoryID,
              categoryName: item.PrimaryCategory?.CategoryName,
              listingUrl: item.ListingDetails?.ViewItemURL
            };
          }
        }
      }

      const hasMore = response.HasMoreItems === true || response.HasMoreItems === 'true';
      if (!hasMore) {
        break;
      }

      pageNumber++;
    }

    return null; // No exact match found
  }

  /**
   * PHASE 2: Try PARTIAL SKU match (slower, checks all items)
   */
  private async tryPartialSkuMatch(
    sku: string,
    title: string,
    timeRangeParams: any,
    categoryId?: string
  ): Promise<any | null> {
    let pageNumber = 1;
    const maxPages = 50; // Search up to 50 pages for partial match

    // Fetch items with optional category and time range filters (NO SKUArray filter)
    while (pageNumber <= maxPages) {
      const requestBody: any = {
        ...timeRangeParams, // Include time range (StartTime or EndTime)
        DetailLevel: 'ReturnAll',
        Pagination: {
          EntriesPerPage: 200, // Max allowed per page
          PageNumber: pageNumber
        },
        GranularityLevel: 'Fine'
      };

      // Add category filter if provided (SERVER-SIDE FILTERING!)
      if (categoryId) {
        requestBody.CategoryID = categoryId;
      }

      const response = await this.callAPI('GetSellerList', requestBody);

      if (response.ItemArray && response.ItemArray.Item) {
        const items = Array.isArray(response.ItemArray.Item)
          ? response.ItemArray.Item
          : [response.ItemArray.Item];

        // Check BOTH SKU (partial) and Title simultaneously for each item
        for (const item of items) {
          const itemSku = item.SKU || '';
          const itemTitle = (item.Title || '').toLowerCase();
          const searchTitle = title.toLowerCase();

          // Check BOTH conditions at once
          const skuMatches = itemSku.includes(sku); // PARTIAL match
          const titleMatches = itemTitle.includes(searchTitle);

          // ONLY return if BOTH conditions match!
          if (skuMatches && titleMatches) {
            return {
              itemId: item.ItemID,
              sku: item.SKU,
              title: item.Title,
              currentPrice: item.SellingStatus?.CurrentPrice?._value || item.SellingStatus?.CurrentPrice || 0,
              currency: item.SellingStatus?.CurrentPrice?._currencyID || item.Currency || 'USD',
              quantity: {
                total: item.Quantity,
                sold: item.SellingStatus?.QuantitySold || 0,
                available: (item.Quantity || 0) - (item.SellingStatus?.QuantitySold || 0)
              },
              listingStatus: item.SellingStatus?.ListingStatus || 'Unknown',
              listingType: item.ListingType,
              startTime: item.StartTime,
              endTime: item.EndTime,
              pictureUrls: item.PictureDetails?.PictureURL || [],
              categoryId: item.PrimaryCategory?.CategoryID,
              categoryName: item.PrimaryCategory?.CategoryName,
              listingUrl: item.ListingDetails?.ViewItemURL
            };
          }
        }
      }

      // Check if there are more pages
      const hasMore = response.HasMoreItems === true || response.HasMoreItems === 'true';
      if (!hasMore) {
        break;
      }

      pageNumber++;
    }

    return null; // No partial match found
  }
}