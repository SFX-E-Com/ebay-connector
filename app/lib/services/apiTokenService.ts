import {
  db,
  Collections,
  ApiToken,
  ApiTokenPermissions,
  ApiUsage,
  User,
  getDoc,
  queryDocs,
  createDoc,
  updateDoc,
  countDocs,
  generateId
} from './firestore';
import crypto from 'crypto';
import { DEFAULT_ENDPOINTS } from '../config/endpoints';

export interface CreateApiTokenData {
  name: string;
  permissions?: {
    endpoints?: string[];
    rateLimit?: number;
    ebayAccountIds?: string[];  // Optional: restrict token to specific eBay accounts
  };
  expiresAt?: Date;
}

export interface ApiTokenResponse {
  id: string;
  name: string;
  token: string;
  permissions: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiTokenWithUser extends ApiTokenResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export class ApiTokenService {
  /**
   * Generate a new API token with the format: ebay_live_[32_random_chars]
   */
  static generateTokenString(): string {
    const randomBytes = crypto.randomBytes(16);
    const tokenSuffix = randomBytes.toString('hex');
    return `ebay_live_${tokenSuffix}`;
  }

  /**
   * Create a new API token for a user
   */
  static async createToken(
    userId: string,
    data: CreateApiTokenData
  ): Promise<ApiTokenResponse> {
    const token = this.generateTokenString();

    // Default permissions for new tokens
    const defaultPermissions = {
      endpoints: DEFAULT_ENDPOINTS,
      rateLimit: 1000,
      ...data.permissions
    };

    const apiToken = await createDoc<ApiToken>(Collections.API_TOKENS, {
      id: generateId(),
      userId,
      name: data.name,
      token,
      permissions: defaultPermissions,
      isActive: true,
      isDeleted: false,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: apiToken.id,
      name: apiToken.name,
      token: apiToken.token,
      permissions: apiToken.permissions,
      isActive: apiToken.isActive,
      isDeleted: apiToken.isDeleted,
      lastUsedAt: apiToken.lastUsedAt || null,
      expiresAt: apiToken.expiresAt || null,
      createdAt: apiToken.createdAt,
      updatedAt: apiToken.updatedAt,
    };
  }

  /**
   * Get all API tokens for a user (excludes deleted tokens by default)
   */
  static async getUserTokens(
    userId: string,
    options?: {
      status?: 'active' | 'inactive' | 'all'
    }
  ): Promise<ApiTokenResponse[]> {
    const conditions: Array<{ field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown }> = [
      { field: 'userId', op: '==', value: userId },
      { field: 'isDeleted', op: '==', value: false }
    ];

    // Add status filtering
    if (options?.status === 'active') {
      conditions.push({ field: 'isActive', op: '==', value: true });
    } else if (options?.status === 'inactive') {
      conditions.push({ field: 'isActive', op: '==', value: false });
    }

    const tokens = await queryDocs<ApiToken>(
      Collections.API_TOKENS,
      conditions,
      { orderBy: { field: 'createdAt', direction: 'desc' } }
    );

    return tokens.map(t => ({
      id: t.id,
      name: t.name,
      token: t.token,
      permissions: t.permissions,
      isActive: t.isActive,
      isDeleted: t.isDeleted,
      lastUsedAt: t.lastUsedAt || null,
      expiresAt: t.expiresAt || null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  /**
   * Get API token by token string (for authentication)
   */
  static async getTokenByString(token: string): Promise<ApiTokenWithUser | null> {
    const tokens = await queryDocs<ApiToken>(
      Collections.API_TOKENS,
      [
        { field: 'token', op: '==', value: token },
        { field: 'isActive', op: '==', value: true },
        { field: 'isDeleted', op: '==', value: false }
      ]
    );

    if (tokens.length === 0) {
      return null;
    }

    const apiToken = tokens[0];

    // Check if token is expired
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      return null;
    }

    // Get the associated user
    const user = await getDoc<User>(Collections.USERS, apiToken.userId);

    if (!user) {
      return null;
    }

    return {
      id: apiToken.id,
      name: apiToken.name,
      token: apiToken.token,
      permissions: apiToken.permissions,
      isActive: apiToken.isActive,
      isDeleted: apiToken.isDeleted,
      lastUsedAt: apiToken.lastUsedAt || null,
      expiresAt: apiToken.expiresAt || null,
      createdAt: apiToken.createdAt,
      updatedAt: apiToken.updatedAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        role: user.role,
      }
    };
  }

  /**
   * Update token last used timestamp
   */
  static async updateLastUsed(tokenId: string): Promise<void> {
    await updateDoc<ApiToken>(Collections.API_TOKENS, tokenId, {
      lastUsedAt: new Date()
    });
  }

  /**
   * Revoke (deactivate) an API token
   */
  static async revokeToken(tokenId: string, userId: string): Promise<void> {
    // Verify ownership first
    const token = await getDoc<ApiToken>(Collections.API_TOKENS, tokenId);
    if (!token || token.userId !== userId) {
      throw new Error('Token not found or access denied');
    }

    await updateDoc<ApiToken>(Collections.API_TOKENS, tokenId, {
      isActive: false
    });
  }

  /**
   * Activate an API token
   */
  static async activateToken(tokenId: string, userId: string): Promise<ApiTokenResponse> {
    // Verify ownership first
    const token = await getDoc<ApiToken>(Collections.API_TOKENS, tokenId);
    if (!token || token.userId !== userId) {
      throw new Error('Token not found or access denied');
    }

    await updateDoc<ApiToken>(Collections.API_TOKENS, tokenId, {
      isActive: true
    });

    const updatedToken = await getDoc<ApiToken>(Collections.API_TOKENS, tokenId);

    return {
      id: updatedToken!.id,
      name: updatedToken!.name,
      token: updatedToken!.token,
      permissions: updatedToken!.permissions,
      isActive: updatedToken!.isActive,
      isDeleted: updatedToken!.isDeleted,
      lastUsedAt: updatedToken!.lastUsedAt || null,
      expiresAt: updatedToken!.expiresAt || null,
      createdAt: updatedToken!.createdAt,
      updatedAt: updatedToken!.updatedAt,
    };
  }

  /**
   * Deactivate an API token
   */
  static async deactivateToken(tokenId: string, userId: string): Promise<ApiTokenResponse> {
    // Verify ownership first
    const token = await getDoc<ApiToken>(Collections.API_TOKENS, tokenId);
    if (!token || token.userId !== userId) {
      throw new Error('Token not found or access denied');
    }

    await updateDoc<ApiToken>(Collections.API_TOKENS, tokenId, {
      isActive: false
    });

    const updatedToken = await getDoc<ApiToken>(Collections.API_TOKENS, tokenId);

    return {
      id: updatedToken!.id,
      name: updatedToken!.name,
      token: updatedToken!.token,
      permissions: updatedToken!.permissions,
      isActive: updatedToken!.isActive,
      isDeleted: updatedToken!.isDeleted,
      lastUsedAt: updatedToken!.lastUsedAt || null,
      expiresAt: updatedToken!.expiresAt || null,
      createdAt: updatedToken!.createdAt,
      updatedAt: updatedToken!.updatedAt,
    };
  }

  /**
   * Soft delete an API token (mark as deleted)
   */
  static async deleteToken(tokenId: string, userId: string): Promise<void> {
    // Verify ownership first
    const token = await getDoc<ApiToken>(Collections.API_TOKENS, tokenId);
    if (!token || token.userId !== userId) {
      throw new Error('Token not found or access denied');
    }

    await updateDoc<ApiToken>(Collections.API_TOKENS, tokenId, {
      isActive: false,
      isDeleted: true
    });
  }

  /**
   * Update token details (name, permissions, expiresAt)
   */
  static async updateTokenPermissions(
    tokenId: string,
    userId: string,
    updateData: {
      name?: string;
      permissions?: ApiTokenPermissions;
      expiresAt?: Date;
    }
  ): Promise<ApiTokenResponse> {
    // Verify ownership first
    const token = await getDoc<ApiToken>(Collections.API_TOKENS, tokenId);
    if (!token || token.userId !== userId) {
      throw new Error('Token not found or access denied');
    }

    const dataToUpdate: Partial<ApiToken> = {};

    if (updateData.name !== undefined) {
      dataToUpdate.name = updateData.name;
    }
    if (updateData.permissions !== undefined) {
      dataToUpdate.permissions = updateData.permissions;
    }
    if (updateData.expiresAt !== undefined) {
      dataToUpdate.expiresAt = updateData.expiresAt;
    }

    await updateDoc<ApiToken>(Collections.API_TOKENS, tokenId, dataToUpdate);

    const updatedToken = await getDoc<ApiToken>(Collections.API_TOKENS, tokenId);

    return {
      id: updatedToken!.id,
      name: updatedToken!.name,
      token: updatedToken!.token,
      permissions: updatedToken!.permissions,
      isActive: updatedToken!.isActive,
      isDeleted: updatedToken!.isDeleted,
      lastUsedAt: updatedToken!.lastUsedAt || null,
      expiresAt: updatedToken!.expiresAt || null,
      createdAt: updatedToken!.createdAt,
      updatedAt: updatedToken!.updatedAt,
    };
  }

  /**
   * Get token by ID (for user's own tokens)
   */
  static async getTokenById(tokenId: string, userId: string): Promise<ApiTokenResponse | null> {
    const token = await getDoc<ApiToken>(Collections.API_TOKENS, tokenId);

    if (!token || token.userId !== userId || token.isDeleted) {
      return null;
    }

    return {
      id: token.id,
      name: token.name,
      token: token.token,
      permissions: token.permissions,
      isActive: token.isActive,
      isDeleted: token.isDeleted,
      lastUsedAt: token.lastUsedAt || null,
      expiresAt: token.expiresAt || null,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
    };
  }

  /**
   * Validate API token format
   */
  static isValidTokenFormat(token: string): boolean {
    const tokenRegex = /^ebay_(live|test)_[a-f0-9]{32}$/;
    return tokenRegex.test(token);
  }

  /**
   * Get token usage statistics
   */
  static async getTokenUsageStats(tokenId: string, userId: string) {
    // Get token to verify ownership
    const token = await this.getTokenById(tokenId, userId);
    if (!token) {
      throw new Error('Token not found or access denied');
    }

    // Get usage stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all usage records for this token in the last 30 days
    const usageRecords = await queryDocs<ApiUsage>(
      Collections.API_USAGE,
      [
        { field: 'apiTokenId', op: '==', value: tokenId },
        { field: 'createdAt', op: '>=', value: thirtyDaysAgo }
      ]
    );

    // Calculate stats in memory (Firestore doesn't support aggregate queries like Prisma)
    const totalRequests = usageRecords.length;
    const totalResponseTime = usageRecords.reduce((sum, r) => sum + (r.responseTime || 0), 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    // Group by endpoint
    const endpointCounts: Record<string, number> = {};
    for (const record of usageRecords) {
      endpointCounts[record.endpoint] = (endpointCounts[record.endpoint] || 0) + 1;
    }

    const usageByEndpoint = Object.entries(endpointCounts).map(([endpoint, requests]) => ({
      endpoint,
      requests
    }));

    return {
      totalRequests,
      averageResponseTime,
      usageByEndpoint,
      period: '30 days'
    };
  }

  /**
   * Check if token has access to a specific eBay account
   * Returns true if:
   * - Token has no ebayAccountIds restriction (empty or undefined)
   * - Token's ebayAccountIds includes the accountId
   */
  static hasAccountAccess(token: ApiTokenResponse | ApiTokenWithUser, accountId: string): boolean {
    const permissions = token.permissions as ApiTokenPermissions;
    const ebayAccountIds = permissions?.ebayAccountIds;

    // If no restrictions, allow access to all accounts
    if (!ebayAccountIds || ebayAccountIds.length === 0) {
      return true;
    }

    // Check if accountId is in the allowed list
    return ebayAccountIds.includes(accountId);
  }

  /**
   * Check if user has reached their token limit
   */
  static async checkTokenLimit(userId: string): Promise<boolean> {
    const activeTokens = await countDocs(Collections.API_TOKENS, [
      { field: 'userId', op: '==', value: userId },
      { field: 'isActive', op: '==', value: true },
      { field: 'isDeleted', op: '==', value: false }
    ]);

    // For now, limit to 10 tokens per user
    const TOKEN_LIMIT = 10;
    return activeTokens < TOKEN_LIMIT;
  }
}

export const apiTokenService = ApiTokenService;