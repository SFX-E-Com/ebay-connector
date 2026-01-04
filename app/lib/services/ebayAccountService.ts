/**
 * eBay Account Service
 * Manages eBay account connections and tokens in Firestore
 */

import {
    db,
    Collections,
    EbayAccount,
    getDoc,
    queryDocs,
    createDoc,
    updateDoc,
    deleteDoc,
    generateId
} from './firestore';

export interface CreateEbayAccountData {
    userId: string;
    ebayUserId: string;
    ebayUsername?: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    tokenType?: string;
    scopes?: string[];
    userSelectedScopes?: string[];
    status?: string;
    friendlyName?: string;
    tags?: string[];
}

export interface EbayAccountResponse {
    id: string;
    ebayUserId: string;
    ebayUsername: string | null;
    expiresAt: string; // ISO string for JSON serialization
    tokenType: string;
    scopes: string[];
    userSelectedScopes: string[];
    status: string;
    friendlyName: string | null;
    tags: string[];
    lastUsedAt: string | null; // ISO string for JSON serialization
    createdAt: string; // ISO string for JSON serialization
    updatedAt: string; // ISO string for JSON serialization
}

export interface EbayAccountWithTokens {
    id: string;
    ebayUserId: string;
    ebayUsername: string | null;
    expiresAt: Date; // Keep as Date for internal use
    tokenType: string;
    scopes: string[];
    userSelectedScopes: string[];
    status: string;
    friendlyName: string | null;
    tags: string[];
    lastUsedAt: Date | null; // Keep as Date for internal use
    createdAt: Date; // Keep as Date for internal use
    updatedAt: Date; // Keep as Date for internal use
    accessToken: string;
    refreshToken: string | null;
    userId: string;
}

export class EbayAccountService {
    /**
     * Get all eBay accounts for a user
     */
    static async getUserAccounts(userId: string): Promise<EbayAccountResponse[]> {
        const accounts = await queryDocs<EbayAccount>(
            Collections.EBAY_ACCOUNTS,
            [{ field: 'userId', op: '==', value: userId }],
            { orderBy: { field: 'createdAt', direction: 'desc' } }
        );

        return accounts.map(account => this.mapToResponse(account));
    }

    /**
     * Get a single eBay account by ID
     */
    static async getAccountById(accountId: string): Promise<EbayAccountWithTokens | null> {
        const account = await getDoc<EbayAccount>(Collections.EBAY_ACCOUNTS, accountId);

        if (!account) return null;

        return {
            id: account.id,
            ebayUserId: account.ebayUserId,
            ebayUsername: account.ebayUsername || null,
            expiresAt: account.expiresAt, // Keep as Date
            tokenType: account.tokenType,
            scopes: account.scopes,
            userSelectedScopes: account.userSelectedScopes,
            status: account.status,
            friendlyName: account.friendlyName || null,
            tags: account.tags,
            lastUsedAt: account.lastUsedAt || null,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
            accessToken: account.accessToken,
            refreshToken: account.refreshToken || null,
            userId: account.userId,
        };
    }

    /**
     * Get eBay account by eBay User ID (for upsert operations)
     */
    static async getAccountByEbayUserId(userId: string, ebayUserId: string): Promise<EbayAccountWithTokens | null> {
        const accounts = await queryDocs<EbayAccount>(
            Collections.EBAY_ACCOUNTS,
            [
                { field: 'userId', op: '==', value: userId },
                { field: 'ebayUserId', op: '==', value: ebayUserId }
            ]
        );

        if (accounts.length === 0) return null;

        const account = accounts[0];
        return {
            id: account.id,
            ebayUserId: account.ebayUserId,
            ebayUsername: account.ebayUsername || null,
            expiresAt: account.expiresAt, // Keep as Date
            tokenType: account.tokenType,
            scopes: account.scopes,
            userSelectedScopes: account.userSelectedScopes,
            status: account.status,
            friendlyName: account.friendlyName || null,
            tags: account.tags,
            lastUsedAt: account.lastUsedAt || null,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
            accessToken: account.accessToken,
            refreshToken: account.refreshToken || null,
            userId: account.userId,
        };
    }

    /**
     * Create a new eBay account connection
     */
    static async createAccount(data: CreateEbayAccountData): Promise<EbayAccountResponse> {
        // Filter out undefined values for Firestore compatibility
        const accountData: any = {
            id: generateId(),
            userId: data.userId,
            ebayUserId: data.ebayUserId,
            accessToken: data.accessToken,
            expiresAt: data.expiresAt,
            tokenType: data.tokenType || 'Bearer',
            scopes: data.scopes || [],
            userSelectedScopes: data.userSelectedScopes || [],
            status: data.status || 'active',
            tags: data.tags || [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Only include optional fields if they have values
        if (data.ebayUsername !== undefined) {
            accountData.ebayUsername = data.ebayUsername;
        }
        if (data.refreshToken !== undefined) {
            accountData.refreshToken = data.refreshToken;
        }
        if (data.friendlyName !== undefined) {
            accountData.friendlyName = data.friendlyName;
        }

        const account = await createDoc<EbayAccount>(Collections.EBAY_ACCOUNTS, accountData);

        return this.mapToResponse(account);
    }

    /**
     * Create or update eBay account (upsert)
     */
    static async upsertAccount(data: CreateEbayAccountData): Promise<EbayAccountResponse> {
        const existing = await this.getAccountByEbayUserId(data.userId, data.ebayUserId);

        if (existing) {
            // Filter out undefined values for Firestore compatibility
            const updateData: any = {
                accessToken: data.accessToken,
                expiresAt: data.expiresAt,
                tokenType: data.tokenType || 'Bearer',
                scopes: data.scopes || [],
                userSelectedScopes: data.userSelectedScopes || [],
                status: data.status || 'active',
                tags: data.tags || [],
            };

            // Only include optional fields if they have values
            if (data.ebayUsername !== undefined) {
                updateData.ebayUsername = data.ebayUsername;
            }
            if (data.refreshToken !== undefined) {
                updateData.refreshToken = data.refreshToken;
            }
            if (data.friendlyName !== undefined) {
                updateData.friendlyName = data.friendlyName;
            }

            await updateDoc<EbayAccount>(Collections.EBAY_ACCOUNTS, existing.id, updateData);

            const updated = await getDoc<EbayAccount>(Collections.EBAY_ACCOUNTS, existing.id);
            return this.mapToResponse(updated!);
        } else {
            // Create new account
            return this.createAccount(data);
        }
    }

    /**
     * Update an existing eBay account
     */
    static async updateAccount(
        accountId: string,
        data: Partial<Omit<CreateEbayAccountData, 'userId' | 'ebayUserId'>>
    ): Promise<EbayAccountResponse | null> {
        const existing = await getDoc<EbayAccount>(Collections.EBAY_ACCOUNTS, accountId);

        if (!existing) return null;

        await updateDoc<EbayAccount>(Collections.EBAY_ACCOUNTS, accountId, data);

        const updated = await getDoc<EbayAccount>(Collections.EBAY_ACCOUNTS, accountId);
        return this.mapToResponse(updated!);
    }

    /**
     * Update tokens for an eBay account
     */
    static async updateTokens(
        accountId: string,
        accessToken: string,
        expiresAt: Date,
        refreshToken?: string
    ): Promise<void> {
        const updateData: Partial<EbayAccount> = {
            accessToken,
            expiresAt,
            lastUsedAt: new Date(),
        };

        if (refreshToken) {
            updateData.refreshToken = refreshToken;
        }

        await updateDoc<EbayAccount>(Collections.EBAY_ACCOUNTS, accountId, updateData);
    }

    /**
     * Update last used timestamp
     */
    static async updateLastUsed(accountId: string): Promise<void> {
        await updateDoc<EbayAccount>(Collections.EBAY_ACCOUNTS, accountId, {
            lastUsedAt: new Date(),
        });
    }

    /**
     * Delete an eBay account
     */
    static async deleteAccount(accountId: string, userId: string): Promise<boolean> {
        const account = await getDoc<EbayAccount>(Collections.EBAY_ACCOUNTS, accountId);

        if (!account || account.userId !== userId) {
            return false;
        }

        await deleteDoc(Collections.EBAY_ACCOUNTS, accountId);
        return true;
    }

    /**
     * Check if token is expired
     */
    static isTokenExpired(expiresAt: Date): boolean {
        // Add a 5 minute buffer
        const bufferMs = 5 * 60 * 1000;
        return new Date().getTime() > (new Date(expiresAt).getTime() - bufferMs);
    }

    /**
     * Map database entity to response object (excludes sensitive tokens)
     */
    private static mapToResponse(account: EbayAccount): EbayAccountResponse {
        return {
            id: account.id,
            ebayUserId: account.ebayUserId,
            ebayUsername: account.ebayUsername || null,
            expiresAt: account.expiresAt.toISOString(),
            tokenType: account.tokenType,
            scopes: account.scopes,
            userSelectedScopes: account.userSelectedScopes,
            status: account.status,
            friendlyName: account.friendlyName || null,
            tags: account.tags,
            lastUsedAt: account.lastUsedAt ? account.lastUsedAt.toISOString() : null,
            createdAt: account.createdAt.toISOString(),
            updatedAt: account.updatedAt.toISOString(),
        };
    }
}

export const ebayAccountService = EbayAccountService;
