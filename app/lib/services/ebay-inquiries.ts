/**
 * eBay Inquiries Service
 * Handles Item Not Received (INR) inquiries via the eBay Post-Order API v2
 */

import { EbayTokenRefreshService } from './ebayTokenRefresh';
import { EbayAccountService } from './ebayAccountService';

// Interface for eBay Account
interface EbayAccount {
    id: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
}

// eBay Post-Order API Base URLs
const EBAY_POST_ORDER_API_URLS = {
    sandbox: 'https://api.sandbox.ebay.com/post-order/v2',
    production: 'https://api.ebay.com/post-order/v2'
};

// Inquiry Status Types
export type InquiryState =
    | 'CLOSED'
    | 'ESCALATED'
    | 'PENDING_BUYER_RESPONSE'
    | 'PENDING_SELLER_RESPONSE'
    | 'PENDING_SHIPMENT_INFO';

export type InquiryType =
    | 'INR' // Item Not Received
    | 'SNAD'; // Significantly Not As Described

// Inquiry Interfaces
export interface EbayInquiryItem {
    itemId: string;
    transactionId: string;
    itemTitle?: string;
}

export interface EbayInquiryAmount {
    value: string;
    currency: string;
}

export interface EbayInquiry {
    inquiryId: string;
    inquiryType: InquiryType;
    state: InquiryState;
    creationDate: string;
    lastModifiedDate?: string;
    buyerLoginName: string;
    sellerLoginName: string;
    inquiryQuantity: number;
    refundAmount?: EbayInquiryAmount;
    item?: EbayInquiryItem;
    escalationDate?: string;
    escalationReason?: string;
}

export interface EbayInquiriesSearchResponse {
    members: EbayInquiry[];
    total: number;
    limit: number;
    offset: number;
    next?: string;
    prev?: string;
}

// Filter options for searchInquiries
export interface InquiryFilterOptions {
    inquiryState?: InquiryState;
    inquiryType?: InquiryType;
    creationDateStart?: Date;
    creationDateEnd?: Date;
    limit?: number;
    offset?: number;
}

// Shipment Info Request
export interface ProvideShipmentInfoRequest {
    trackingNumber: string;
    shippingCarrierCode: string;
    shippedDate?: string;
    comments?: string;
}

export class EbayInquiriesService {
    private basePostOrderUrl: string;
    private accessToken: string;
    private refreshToken: string | null;
    private accountId: string;
    private tokenExpiresAt: Date;
    private marketplace: string;

    constructor(account: EbayAccount, marketplace?: string) {
        const isSandbox = process.env.EBAY_SANDBOX === 'true';
        this.basePostOrderUrl = isSandbox
            ? EBAY_POST_ORDER_API_URLS.sandbox
            : EBAY_POST_ORDER_API_URLS.production;
        this.accessToken = account.accessToken;
        this.refreshToken = account.refreshToken || null;
        this.accountId = account.id;
        this.tokenExpiresAt = new Date(account.expiresAt);
        this.marketplace = marketplace || process.env.EBAY_DEFAULT_MARKETPLACE || 'EBAY_DE';
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

        await EbayTokenRefreshService.updateTokenInDatabase(this.accountId, {
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in,
            refresh_token: tokenData.refresh_token || this.refreshToken || '',
            token_type: 'Bearer'
        });
    }

    private async ensureValidToken(): Promise<void> {
        const now = new Date();
        const bufferTime = 5 * 60 * 1000;

        if (this.tokenExpiresAt.getTime() - now.getTime() < bufferTime) {
            await this.refreshAccessToken();
        }
    }

    private async makePostOrderRequest(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: unknown
    ): Promise<unknown> {
        await this.ensureValidToken();

        const url = `${this.basePostOrderUrl}${endpoint}`;
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': this.marketplace
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
            let errorMessage = `eBay Post-Order API error: ${response.status}`;
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

        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    // ===========================================
    // INQUIRY SEARCH & RETRIEVAL
    // ===========================================

    /**
     * Search inquiries with optional filtering
     */
    async searchInquiries(options: InquiryFilterOptions = {}): Promise<EbayInquiriesSearchResponse> {
        const queryParams = new URLSearchParams();

        if (options.inquiryState) {
            queryParams.set('inquiry_status', options.inquiryState);
        }
        if (options.inquiryType) {
            queryParams.set('inquiry_type', options.inquiryType);
        }

        if (options.creationDateStart) {
            queryParams.set('creation_date_range_from', options.creationDateStart.toISOString());
        }
        if (options.creationDateEnd) {
            queryParams.set('creation_date_range_to', options.creationDateEnd.toISOString());
        }

        if (options.limit) {
            queryParams.set('limit', Math.min(options.limit, 200).toString());
        }
        if (options.offset) {
            queryParams.set('offset', options.offset.toString());
        }

        const queryString = queryParams.toString();
        const endpoint = `/inquiry/search${queryString ? `?${queryString}` : ''}`;

        return this.makePostOrderRequest(endpoint) as Promise<EbayInquiriesSearchResponse>;
    }

    /**
     * Get a single inquiry by ID
     */
    async getInquiry(inquiryId: string): Promise<EbayInquiry> {
        return this.makePostOrderRequest(`/inquiry/${inquiryId}`) as Promise<EbayInquiry>;
    }

    /**
     * Get inquiries pending seller response
     */
    async getPendingInquiries(limit: number = 50): Promise<EbayInquiry[]> {
        const response = await this.searchInquiries({
            inquiryState: 'PENDING_SELLER_RESPONSE',
            limit
        });
        return response.members;
    }

    // ===========================================
    // INQUIRY ACTIONS
    // ===========================================

    /**
     * Issue a refund to resolve the inquiry
     */
    async issueRefund(inquiryId: string, comments?: string): Promise<unknown> {
        const body: any = {};
        // Only include comments if provided to avoid sending undefined values
        if (comments !== undefined && comments !== '') {
            body.comments = comments;
        }
        return this.makePostOrderRequest(`/inquiry/${inquiryId}/issue_refund`, 'POST', body);
    }

    /**
     * Provide shipment tracking info to resolve INR inquiry
     */
    async provideShipmentInfo(inquiryId: string, request: ProvideShipmentInfoRequest): Promise<unknown> {
        // Filter out undefined values to avoid API errors
        const body: any = {
            trackingNumber: request.trackingNumber,
            shippingCarrierCode: request.shippingCarrierCode
        };
        if (request.shippedDate !== undefined && request.shippedDate !== '') {
            body.shippedDate = request.shippedDate;
        }
        if (request.comments !== undefined && request.comments !== '') {
            body.comments = request.comments;
        }
        return this.makePostOrderRequest(`/inquiry/${inquiryId}/provide_shipment_info`, 'POST', body);
    }

    /**
     * Escalate inquiry to eBay for resolution
     */
    async escalate(inquiryId: string, comments?: string): Promise<unknown> {
        const body: any = {};
        // Only include comments if provided to avoid sending undefined values
        if (comments !== undefined && comments !== '') {
            body.comments = comments;
        }
        return this.makePostOrderRequest(`/inquiry/${inquiryId}/escalate`, 'POST', body);
    }
}

// Factory function to create service from account ID
export async function createEbayInquiriesService(
    accountId: string,
    marketplace?: string
): Promise<EbayInquiriesService> {
    const account = await EbayAccountService.getAccountById(accountId);

    if (!account) {
        throw new Error(`eBay account not found: ${accountId}`);
    }

    return new EbayInquiriesService({
        id: account.id,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken || undefined,
        expiresAt: account.expiresAt
    }, marketplace);
}
