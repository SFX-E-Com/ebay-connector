/**
 * eBay Orders Service
 * Handles order retrieval and fulfillment via the eBay Fulfillment API
 */

// Interface for eBay Account (same as in ebay-listing.ts)
interface EbayAccount {
    id: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
}

// eBay Fulfillment API Base URLs
const EBAY_FULFILLMENT_API_URLS = {
    sandbox: 'https://api.sandbox.ebay.com/sell/fulfillment/v1',
    production: 'https://api.ebay.com/sell/fulfillment/v1'
};

// Order Status Types
export type OrderFulfillmentStatus =
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'FULFILLED';

export type OrderPaymentStatus =
    | 'FAILED'
    | 'FULLY_REFUNDED'
    | 'PAID'
    | 'PARTIALLY_REFUNDED'
    | 'PENDING';

// Line Item Fulfillment Status
export type LineItemFulfillmentStatus =
    | 'FULFILLED'
    | 'IN_PROGRESS'
    | 'NOT_STARTED';

// Shipping Carrier Enum (common carriers)
export type ShippingCarrier =
    | 'DHL'
    | 'DHL_EXPRESS'
    | 'DPD'
    | 'FEDEX'
    | 'GLS'
    | 'HERMES'
    | 'ROYAL_MAIL'
    | 'UPS'
    | 'USPS'
    | 'OTHER';

// Order Interfaces
export interface EbayBuyer {
    username: string;
    taxAddress?: {
        city: string;
        stateOrProvince: string;
        postalCode: string;
        countryCode: string;
    };
}

export interface EbayPricing {
    value: string;
    currency: string;
}

export interface EbayLineItem {
    lineItemId: string;
    legacyItemId: string;
    legacyVariationId?: string;
    sku?: string;
    title: string;
    quantity: number;
    lineItemCost: EbayPricing;
    lineItemFulfillmentStatus: LineItemFulfillmentStatus;
    total: EbayPricing;
    deliveryCost?: {
        shippingCost: EbayPricing;
    };
    variationAspects?: Array<{
        name: string;
        value: string;
    }>;
}

export interface EbayShippingAddress {
    fullName: string;
    contactAddress: {
        addressLine1: string;
        addressLine2?: string;
        city: string;
        stateOrProvince?: string;
        postalCode: string;
        countryCode: string;
    };
    primaryPhone?: {
        phoneNumber: string;
    };
    email?: string;
}

export interface EbayFulfillmentPlan {
    fulfillmentPlanId: string;
    lineItemFulfillmentPlans: Array<{
        lineItemId: string;
        quantity: number;
    }>;
    shippingStep?: {
        shippingCarrierCode?: string;
        shippingServiceCode?: string;
        shipTo: EbayShippingAddress;
    };
}

export interface EbayOrder {
    orderId: string;
    legacyOrderId?: string;
    creationDate: string;
    lastModifiedDate?: string;
    orderFulfillmentStatus: OrderFulfillmentStatus;
    orderPaymentStatus: OrderPaymentStatus;
    buyer: EbayBuyer;
    pricingSummary: {
        priceSubtotal: EbayPricing;
        deliveryCost?: EbayPricing;
        total: EbayPricing;
        adjustment?: EbayPricing;
    };
    lineItems: EbayLineItem[];
    fulfillmentStartInstructions?: Array<{
        fulfillmentInstructionsType: 'SHIP_TO' | 'PREPARE_FOR_PICKUP';
        shippingStep?: {
            shippingCarrierCode?: string;
            shippingServiceCode?: string;
            shipTo: EbayShippingAddress;
        };
    }>;
    fulfillmentHrefs?: string[];
    salesRecordReference?: string;
}

export interface EbayOrdersResponse {
    href: string;
    total: number;
    limit: number;
    offset: number;
    orders: EbayOrder[];
    next?: string;
    prev?: string;
    warnings?: Array<{
        errorId: number;
        message: string;
    }>;
}

// Shipping Fulfillment Request
export interface ShippingFulfillmentRequest {
    lineItems: Array<{
        lineItemId: string;
        quantity: number;
    }>;
    shippedDate: string; // ISO 8601 format
    shippingCarrierCode: ShippingCarrier | string;
    trackingNumber: string;
}

export interface ShippingFulfillmentResponse {
    fulfillmentId: string;
    lineItems: Array<{
        lineItemId: string;
        quantity: number;
    }>;
    shippedDate: string;
    shippingCarrierCode: string;
    trackingNumber: string;
}

// Filter options for getOrders
export interface OrderFilterOptions {
    creationDateStart?: Date;
    creationDateEnd?: Date;
    lastModifiedDateStart?: Date;
    lastModifiedDateEnd?: Date;
    fulfillmentStatus?: OrderFulfillmentStatus;
    paymentStatus?: OrderPaymentStatus; // Client-side filter (not supported by eBay API)
    orderIds?: string[];
    limit?: number;
    offset?: number;
}

// Import token refresh service
import { EbayTokenRefreshService } from './ebayTokenRefresh';

export class EbayOrdersService {
    private baseFulfillmentUrl: string;
    private accessToken: string;
    private refreshToken: string | null;
    private accountId: string;
    private tokenExpiresAt: Date;

    constructor(account: EbayAccount) {
        const isSandbox = process.env.EBAY_SANDBOX === 'true';
        this.baseFulfillmentUrl = isSandbox
            ? EBAY_FULFILLMENT_API_URLS.sandbox
            : EBAY_FULFILLMENT_API_URLS.production;
        this.accessToken = this.decryptToken(account.accessToken);
        this.refreshToken = account.refreshToken ? this.decryptToken(account.refreshToken) : null;
        this.accountId = account.id;
        this.tokenExpiresAt = new Date(account.expiresAt);
    }

    private decryptToken(encryptedToken: string): string {
        // Token is stored encrypted - implement decryption if needed
        return encryptedToken;
    }

    private async refreshAccessToken(): Promise<void> {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        const clientId = process.env.EBAY_CLIENT_ID;
        const clientSecret = process.env.EBAY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('eBay client credentials not configured');
        }

        const isSandbox = process.env.EBAY_SANDBOX === 'true';
        const tokenUrl = isSandbox
            ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
            : 'https://api.ebay.com/identity/v1/oauth2/token';

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
        }

        const tokenData = await response.json();
        this.accessToken = tokenData.access_token;
        this.tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

        // Update token in database
        await EbayTokenRefreshService.updateTokenInDatabase(this.accountId, {
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in,
            refresh_token: tokenData.refresh_token || this.refreshToken || '',
            token_type: 'Bearer'
        });
    }

    private async ensureValidToken(): Promise<void> {
        const now = new Date();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

        if (this.tokenExpiresAt.getTime() - now.getTime() < bufferTime) {
            await this.refreshAccessToken();
        }
    }

    private async makeFulfillmentRequest(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: unknown
    ): Promise<unknown> {
        await this.ensureValidToken();

        const url = `${this.baseFulfillmentUrl}${endpoint}`;
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const options: RequestInit = {
            method,
            headers
        };

        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `eBay Fulfillment API error: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorBody);
                if (errorJson.errors && errorJson.errors.length > 0) {
                    errorMessage = errorJson.errors.map((e: { message: string }) => e.message).join(', ');
                }
            } catch {
                errorMessage += ` - ${errorBody}`;
            }
            throw new Error(errorMessage);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    // ===========================================
    // ORDER RETRIEVAL
    // ===========================================

    /**
     * Get orders with optional filtering
     */
    async getOrders(options: OrderFilterOptions = {}): Promise<EbayOrdersResponse> {
        const queryParams = new URLSearchParams();

        // Handle order IDs (comma-separated, max 50)
        if (options.orderIds && options.orderIds.length > 0) {
            queryParams.set('orderIds', options.orderIds.slice(0, 50).join(','));
        } else {
            // Build filter string for date and status filters
            const filters: string[] = [];

            if (options.creationDateStart) {
                // Validate dates before calling toISOString()
                if (isNaN(options.creationDateStart.getTime())) {
                    throw new Error('Invalid creationDateStart date');
                }
                const endDate = options.creationDateEnd
                    ? (isNaN(options.creationDateEnd.getTime()) ? '' : options.creationDateEnd.toISOString())
                    : '';
                filters.push(`creationdate:[${options.creationDateStart.toISOString()}..${endDate}]`);
            }

            if (options.lastModifiedDateStart) {
                // Validate dates before calling toISOString()
                if (isNaN(options.lastModifiedDateStart.getTime())) {
                    throw new Error('Invalid lastModifiedDateStart date');
                }
                const endDate = options.lastModifiedDateEnd
                    ? (isNaN(options.lastModifiedDateEnd.getTime()) ? '' : options.lastModifiedDateEnd.toISOString())
                    : '';
                filters.push(`lastmodifieddate:[${options.lastModifiedDateStart.toISOString()}..${endDate}]`);
            }

            if (options.fulfillmentStatus) {
                const statusMap: Record<OrderFulfillmentStatus, string> = {
                    'NOT_STARTED': '{NOT_STARTED}',
                    'IN_PROGRESS': '{IN_PROGRESS}',
                    'FULFILLED': '{FULFILLED}'
                };
                filters.push(`orderfulfillmentstatus:${statusMap[options.fulfillmentStatus]}`);
            }

            if (filters.length > 0) {
                queryParams.set('filter', filters.join(','));
            }
        }

        // Pagination - request more if we need to filter by payment status
        const requestLimit = options.paymentStatus
            ? Math.min((options.limit || 50) * 2, 200) // Request extra to compensate for filtering
            : options.limit;

        if (requestLimit) {
            queryParams.set('limit', Math.min(requestLimit, 200).toString());
        }
        if (options.offset && !options.paymentStatus) {
            // Only use offset if not filtering by payment status (pagination gets complex with client-side filtering)
            queryParams.set('offset', options.offset.toString());
        }

        const queryString = queryParams.toString();
        const endpoint = `/order${queryString ? `?${queryString}` : ''}`;

        const response = await this.makeFulfillmentRequest(endpoint) as EbayOrdersResponse;

        // Apply client-side payment status filter (eBay API doesn't support this filter)
        if (options.paymentStatus) {
            const filteredOrders = response.orders.filter(
                order => order.orderPaymentStatus === options.paymentStatus
            );

            // Apply limit after filtering
            const limitedOrders = options.limit
                ? filteredOrders.slice(0, options.limit)
                : filteredOrders;

            return {
                ...response,
                orders: limitedOrders,
                total: filteredOrders.length,
            };
        }

        return response;
    }

    /**
     * Get a single order by ID
     */
    async getOrder(orderId: string): Promise<EbayOrder> {
        return this.makeFulfillmentRequest(`/order/${orderId}`) as Promise<EbayOrder>;
    }

    /**
     * Get orders that need fulfillment (NOT_STARTED or IN_PROGRESS)
     */
    async getPendingOrders(limit: number = 50): Promise<EbayOrder[]> {
        const [notStarted, inProgress] = await Promise.all([
            this.getOrders({ fulfillmentStatus: 'NOT_STARTED', limit }),
            this.getOrders({ fulfillmentStatus: 'IN_PROGRESS', limit })
        ]);

        return [...notStarted.orders, ...inProgress.orders];
    }

    // ===========================================
    // SHIPPING FULFILLMENT
    // ===========================================

    /**
     * Create a shipping fulfillment for an order
     */
    async createShippingFulfillment(
        orderId: string,
        fulfillment: ShippingFulfillmentRequest
    ): Promise<ShippingFulfillmentResponse> {
        return this.makeFulfillmentRequest(
            `/order/${orderId}/shipping_fulfillment`,
            'POST',
            fulfillment
        ) as Promise<ShippingFulfillmentResponse>;
    }

    /**
     * Ship all line items in an order with tracking info
     */
    async shipOrder(
        orderId: string,
        trackingNumber: string,
        carrierCode: ShippingCarrier | string,
        shippedDate?: Date
    ): Promise<ShippingFulfillmentResponse> {
        // First get the order to get line items
        const order = await this.getOrder(orderId);

        // Get all unfulfilled line items
        const lineItems = order.lineItems
            .filter(item => item.lineItemFulfillmentStatus !== 'FULFILLED')
            .map(item => ({
                lineItemId: item.lineItemId,
                quantity: item.quantity
            }));

        if (lineItems.length === 0) {
            throw new Error('No unfulfilled line items in this order');
        }

        const fulfillment: ShippingFulfillmentRequest = {
            lineItems,
            shippedDate: (shippedDate || new Date()).toISOString(),
            shippingCarrierCode: carrierCode,
            trackingNumber
        };

        return this.createShippingFulfillment(orderId, fulfillment);
    }

    /**
     * Get shipping fulfillments for an order
     */
    async getShippingFulfillments(orderId: string): Promise<{ fulfillments: ShippingFulfillmentResponse[] }> {
        return this.makeFulfillmentRequest(
            `/order/${orderId}/shipping_fulfillment`
        ) as Promise<{ fulfillments: ShippingFulfillmentResponse[] }>;
    }

    /**
     * Get a specific shipping fulfillment
     */
    async getShippingFulfillment(orderId: string, fulfillmentId: string): Promise<ShippingFulfillmentResponse> {
        return this.makeFulfillmentRequest(
            `/order/${orderId}/shipping_fulfillment/${fulfillmentId}`
        ) as Promise<ShippingFulfillmentResponse>;
    }
}

// Factory function to create service from account ID
import { EbayAccountService } from './ebayAccountService';

export async function createEbayOrdersService(accountId: string): Promise<EbayOrdersService> {
    const account = await EbayAccountService.getAccountById(accountId);

    if (!account) {
        throw new Error(`eBay account not found: ${accountId}`);
    }

    return new EbayOrdersService({
        id: account.id,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken || undefined,
        expiresAt: account.expiresAt
    });
}

