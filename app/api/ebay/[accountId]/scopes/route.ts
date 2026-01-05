import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { withQueryDebugLogging } from '@/app/lib/middleware/queryDebugMiddleware';
import { EbayAccountService } from '@/app/lib/services/ebayAccountService';

const getHandler = withEbayAuth('ebay:account:read', async (request: NextRequest, authData: EbayAuthData, { params }: { params: Promise<{ accountId: string }> }) => {
    const { accountId: _accountId } = await params;

    try {
        // Fetch full account data from database to get all fields
        const fullAccount = await EbayAccountService.getAccountById(authData.ebayAccount.id);

        if (!fullAccount) {
            return NextResponse.json(
                { success: false, message: "Account not found" },
                { status: 404 }
            );
        }

        // Get scopes - they're already arrays in Firestore
        const grantedScopes = Array.isArray(fullAccount.scopes)
            ? fullAccount.scopes.map((scope: string) => String(scope))
            : [];

        const userSelectedScopes = Array.isArray(fullAccount.userSelectedScopes)
            ? fullAccount.userSelectedScopes
            : [];

        return NextResponse.json({
            success: true,
            data: {
                account: {
                    id: fullAccount.id,
                    friendlyName: fullAccount.friendlyName,
                    ebayUsername: fullAccount.ebayUsername,
                    status: fullAccount.status,
                },
                scopes: {
                    granted: grantedScopes, // What eBay actually granted
                    userSelected: userSelectedScopes, // What user selected in UI
                    grantedCount: grantedScopes.length,
                    userSelectedCount: userSelectedScopes.length,
                    lastUpdated: fullAccount.updatedAt,
                    createdAt: fullAccount.createdAt,
                },
                token: {
                    type: fullAccount.tokenType,
                    expiresAt: fullAccount.expiresAt,
                    lastUsedAt: fullAccount.lastUsedAt,
                },
                permissions: {
                    canReadInventory: grantedScopes.some((scope: string) =>
                        scope.includes('sell.inventory') || scope.includes('api_scope')
                    ),
                    canManageInventory: grantedScopes.some((scope: string) =>
                        scope.includes('sell.inventory') && !scope.includes('readonly')
                    ),
                    canManageAccount: grantedScopes.some((scope: string) =>
                        scope.includes('sell.account')
                    ),
                    canManageFulfillment: grantedScopes.some((scope: string) =>
                        scope.includes('sell.fulfillment')
                    ),
                }
            }
        });

    } catch (error) {
        console.error('Error fetching scope information:', error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch scope information",
                error: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}, 'BASIC_ACCESS');

export const GET = withQueryDebugLogging(getHandler);