/**
 * eBay Returns Service
 * Handles return requests via the eBay Post-Order API v2
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

// Return Status Types
export type ReturnState =
    | 'CLOSED'
    | 'ESCALATED'
    | 'ITEM_SHIPPED'
    | 'PENDING_BUYER_RETURNED'
    | 'PENDING_ESCALATION'
    | 'PENDING_REFUND'
    | 'PENDING_SELLER_ACTION'
    | 'PENDING_SHIPMENT'
    | 'REFUND_ISSUED'
    | 'RETURN_REQUESTED'
    | 'RETURN_REJECTED';

export type ReturnReason =
    | 'ARRIVED_DAMAGED'
    | 'ARRIVED_LATE'
    | 'BUYER_CANCEL'
    | 'DEFECTIVE'
    | 'DOESNT_MATCH_LISTING'
    | 'MISSING_PARTS'
    | 'NOT_SATISFIED'
    | 'ORDERED_WRONG_ITEM'
    | 'NO_REASON'
    | 'PAID_WRONG_AMOUNT';

export type RefundMethod =
    | 'MONEY_BACK'
    | 'STORE_CREDIT';

// Return Interfaces
export interface EbayReturnItem {
    itemId: string;
    transactionId: string;
    returnQuantity: number;
    itemTitle?: string;
}

export interface EbayReturnAmount {
    value: string;
    currency: string;
}

export interface EbayRefund {
    refundAmount: EbayReturnAmount;
    refundDate?: string;
    refundId?: string;
    refundStatus?: string;
}

export interface EbayReturn {
    returnId: string;
    state: ReturnState;
    reason: ReturnReason;
    returnRequest: {
        returnReason: ReturnReason;
        comments?: string;
    };
    sellerResponse?: {
        actionType: string;
        comments?: string;
    };
    creationDate: string;
    lastModifiedDate?: string;
    buyerLoginName: string;
    sellerLoginName: string;
    returnItems: EbayReturnItem[];
    returnEstimate?: {
        estimatedRefund?: EbayReturnAmount;
    };
    actualRefund?: EbayRefund;
}

export interface EbayReturnsSearchResponse {
    members: EbayReturn[];
    total: number;
    limit: number;
    offset: number;
    next?: string;
    prev?: string;
}

// Filter options for searchReturns
export interface ReturnFilterOptions {
    returnState?: ReturnState;
    creationDateStart?: Date;
    creationDateEnd?: Date;
    limit?: number;
    offset?: number;
}

// Refund Request
export interface IssueRefundRequest {
    refundAmount?: EbayReturnAmount;
    comments?: string;
}

export class EbayReturnsService {
    private basePostOrderUrl: string;
    private accessToken: string;
    private refreshToken: string | null;
    private accountId: string;
    private tokenExpiresAt: Date;

    constructor(account: EbayAccount) {
        const isSandbox = process.env.EBAY_SANDBOX === 'true';
        this.basePostOrderUrl = isSandbox
            ? EBAY_POST_ORDER_API_URLS.sandbox
            : EBAY_POST_ORDER_API_URLS.production;
        this.accessToken = account.accessToken;
        this.refreshToken = account.refreshToken || null;
        this.accountId = account.id;
        this.tokenExpiresAt = new Date(account.expiresAt);
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
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

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
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE' // Default marketplace
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
    // RETURN SEARCH & RETRIEVAL
    // ===========================================

    /**
     * Search returns with optional filtering
     */
    async searchReturns(options: ReturnFilterOptions = {}): Promise<EbayReturnsSearchResponse> {
        const queryParams = new URLSearchParams();

        if (options.returnState) {
            queryParams.set('return_state', options.returnState);
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
        const endpoint = `/return/search${queryString ? `?${queryString}` : ''}`;

        return this.makePostOrderRequest(endpoint) as Promise<EbayReturnsSearchResponse>;
    }

    /**
     * Get a single return by ID
     */
    async getReturn(returnId: string): Promise<EbayReturn> {
        return this.makePostOrderRequest(`/return/${returnId}`) as Promise<EbayReturn>;
    }

    /**
     * Get returns pending seller action
     */
    async getPendingReturns(limit: number = 50): Promise<EbayReturn[]> {
        const response = await this.searchReturns({
            returnState: 'PENDING_SELLER_ACTION',
            limit
        });
        return response.members;
    }

    // ===========================================
    // RETURN ACTIONS
    // ===========================================

    /**
     * Accept a return request
     */
    async acceptReturn(returnId: string, comments?: string): Promise<unknown> {
        const body = {
            acceptType: 'FULL_REFUND',
            comments
        };
        return this.makePostOrderRequest(`/return/${returnId}/accept`, 'POST', body);
    }

    /**
     * Issue a refund for a return
     */
    async issueRefund(returnId: string, request: IssueRefundRequest = {}): Promise<unknown> {
        return this.makePostOrderRequest(`/return/${returnId}/issue_refund`, 'POST', request);
    }

    /**
     * Provide return shipping label
     */
    async provideReturnShippingLabel(
        returnId: string,
        trackingNumber: string,
        carrierCode: string
    ): Promise<unknown> {
        const body = {
            trackingNumber,
            carrierEnum: carrierCode
        };
        return this.makePostOrderRequest(`/return/${returnId}/provide_tracking_info`, 'POST', body);
    }
}

// Factory function to create service from account ID
export async function createEbayReturnsService(accountId: string): Promise<EbayReturnsService> {
    const account = await EbayAccountService.getAccountById(accountId);

    if (!account) {
        throw new Error(`eBay account not found: ${accountId}`);
    }

    return new EbayReturnsService({
        id: account.id,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken || undefined,
        expiresAt: account.expiresAt
    });
}
