/**
 * eBay Cancellations Service
 * Handles order cancellations via the eBay Post-Order API v2
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

// Cancellation Status Types
export type CancellationState =
    | 'CLOSED'
    | 'PENDING_BUYER_CONFIRM'
    | 'PENDING_SELLER_CONFIRM'
    | 'REFUND_ISSUED';

export type CancellationReason =
    | 'BUYER_ASKED'
    | 'BUYER_NO_SHOW'
    | 'ORDER_MISTAKE'
    | 'OUT_OF_STOCK'
    | 'UNABLE_TO_FULFILL';

export type CancellationInitiator =
    | 'BUYER'
    | 'SELLER';

// Cancellation Interfaces
export interface EbayCancellationItem {
    itemId: string;
    transactionId: string;
    quantity: number;
}

export interface EbayCancellationAmount {
    value: string;
    currency: string;
}

export interface EbayCancellation {
    cancellationId: string;
    state: CancellationState;
    reason: CancellationReason;
    requestorRole: CancellationInitiator;
    creationDate: string;
    lastModifiedDate?: string;
    buyerLoginName: string;
    sellerLoginName: string;
    legacyOrderId: string;
    orderId?: string;
    refundAmount?: EbayCancellationAmount;
    cancelCompleteDate?: string;
}

export interface EbayCancellationsSearchResponse {
    members: EbayCancellation[];
    total: number;
    limit: number;
    offset: number;
    next?: string;
    prev?: string;
}

// Filter options
export interface CancellationFilterOptions {
    cancellationState?: CancellationState;
    creationDateStart?: Date;
    creationDateEnd?: Date;
    limit?: number;
    offset?: number;
}

// Eligibility Check Response
export interface CancellationEligibilityResponse {
    eligible: boolean;
    reasons?: string[];
    eligibleCancelReason?: CancellationReason[];
}

// Create Cancellation Request
export interface CreateCancellationRequest {
    legacyOrderId: string;
    cancelReason: CancellationReason;
    buyerPaidForItem?: boolean;
    comments?: string;
}

export class EbayCancellationsService {
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
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE'
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
    // CANCELLATION SEARCH & RETRIEVAL
    // ===========================================

    /**
     * Search cancellations with optional filtering
     */
    async searchCancellations(options: CancellationFilterOptions = {}): Promise<EbayCancellationsSearchResponse> {
        const queryParams = new URLSearchParams();

        if (options.cancellationState) {
            queryParams.set('cancellation_status', options.cancellationState);
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
        const endpoint = `/cancellation/search${queryString ? `?${queryString}` : ''}`;

        return this.makePostOrderRequest(endpoint) as Promise<EbayCancellationsSearchResponse>;
    }

    /**
     * Get a single cancellation by ID
     */
    async getCancellation(cancellationId: string): Promise<EbayCancellation> {
        return this.makePostOrderRequest(`/cancellation/${cancellationId}`) as Promise<EbayCancellation>;
    }

    /**
     * Get pending cancellations (pending seller confirmation)
     */
    async getPendingCancellations(limit: number = 50): Promise<EbayCancellation[]> {
        const response = await this.searchCancellations({
            cancellationState: 'PENDING_SELLER_CONFIRM',
            limit
        });
        return response.members;
    }

    // ===========================================
    // CANCELLATION ACTIONS
    // ===========================================

    /**
     * Check if an order is eligible for cancellation
     */
    async checkEligibility(legacyOrderId: string): Promise<CancellationEligibilityResponse> {
        const body = {
            legacyOrderId
        };
        return this.makePostOrderRequest('/cancellation/check_eligibility', 'POST', body) as Promise<CancellationEligibilityResponse>;
    }

    /**
     * Create a new cancellation request
     */
    async createCancellation(request: CreateCancellationRequest): Promise<EbayCancellation> {
        return this.makePostOrderRequest('/cancellation', 'POST', request) as Promise<EbayCancellation>;
    }

    /**
     * Confirm (approve) a cancellation request
     */
    async confirmCancellation(cancellationId: string): Promise<unknown> {
        return this.makePostOrderRequest(`/cancellation/${cancellationId}/confirm`, 'POST');
    }

    /**
     * Reject a cancellation request
     */
    async rejectCancellation(cancellationId: string, comments?: string): Promise<unknown> {
        const body = {
            shipDate: new Date().toISOString(),
            trackingNumber: 'N/A',
            comments
        };
        return this.makePostOrderRequest(`/cancellation/${cancellationId}/reject`, 'POST', body);
    }
}

// Factory function to create service from account ID
export async function createEbayCancellationsService(accountId: string): Promise<EbayCancellationsService> {
    const account = await EbayAccountService.getAccountById(accountId);

    if (!account) {
        throw new Error(`eBay account not found: ${accountId}`);
    }

    return new EbayCancellationsService({
        id: account.id,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken || undefined,
        expiresAt: account.expiresAt
    });
}
