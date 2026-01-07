import { NextResponse } from "next/server";
import { logToDebug } from "./queryDebugMiddleware";
import { EBAY_OAUTH_SCOPES } from "../constants/ebayScopes";

export interface EbayScopeValidationResult {
    isValid: boolean;
    errorResponse?: NextResponse;
    missingScopes?: string[];
}

export interface EbayAccount {
    id: string;
    scopes: string | string[] | null;
    friendlyName?: string | null;
}

/**
 * Validates if the user has granted permission for required eBay scopes
 */
export async function validateEbayScopes(
    requiredScopes: string[],
    ebayAccount: EbayAccount,
    context: string = "eBay API"
): Promise<EbayScopeValidationResult> {
    try {
        await logToDebug(
            "EBAY_SCOPE_VALIDATION",
            "Starting eBay scope validation",
            {
                requiredScopes,
                accountId: ebayAccount.id,
                friendlyName: ebayAccount.friendlyName,
                context,
            },
            "DEBUG"
        );

        let grantedScopes: string[] = [];

        if (Array.isArray(ebayAccount.scopes)) {
            grantedScopes = ebayAccount.scopes;
        } else if (typeof ebayAccount.scopes === "string") {
            try {
                const parsed = JSON.parse(ebayAccount.scopes);
                grantedScopes = Array.isArray(parsed) ? parsed : [];
            } catch {
                grantedScopes = [];
            }
        }

        await logToDebug(
            "EBAY_SCOPE_VALIDATION",
            "Parsed granted scopes",
            {
                grantedScopes,
                accountId: ebayAccount.id,
                context,
            },
            "DEBUG"
        );

        const missingScopes = requiredScopes.filter(
            (scope) => !grantedScopes.includes(scope)
        );

        if (missingScopes.length > 0) {
            // Get scope details for better error messaging
            const missingScopeDetails = missingScopes.map((scopeId) => {
                const scope = EBAY_OAUTH_SCOPES.find((s) => s.id === scopeId);
                return {
                    id: scopeId,
                    name: scope?.name || scopeId,
                    description: scope?.description || "Unknown scope",
                };
            });

            await logToDebug(
                "EBAY_SCOPE_VALIDATION",
                "eBay scope validation failed - missing scopes",
                {
                    requiredScopes,
                    grantedScopes,
                    missingScopes,
                    missingScopeDetails,
                    accountId: ebayAccount.id,
                    friendlyName: ebayAccount.friendlyName,
                    context,
                },
                "ERROR"
            );

            const errorResponse = NextResponse.json(
                {
                    success: false,
                    message: "eBay account does not have required permissions",
                    details: {
                        accountId: ebayAccount.id,
                        friendlyName: ebayAccount.friendlyName,
                        missingScopes: missingScopeDetails,
                        action: "Please update the eBay account permissions to include the required scopes",
                    },
                },
                { status: 403 }
            );

            return {
                isValid: false,
                errorResponse,
                missingScopes,
            };
        }

        await logToDebug(
            "EBAY_SCOPE_VALIDATION",
            "eBay scope validation passed",
            {
                requiredScopes,
                grantedScopes,
                accountId: ebayAccount.id,
                context,
            },
            "INFO"
        );

        return {
            isValid: true,
        };
    } catch (error) {
        await logToDebug(
            "EBAY_SCOPE_VALIDATION",
            "eBay scope validation failed with error",
            {
                requiredScopes,
                accountId: ebayAccount.id,
                context,
                error: error instanceof Error ? error.message : "Unknown error",
                errorStack: error instanceof Error ? error.stack : null,
            },
            "ERROR"
        );

        const errorResponse = NextResponse.json(
            {
                success: false,
                message: "Internal error during eBay scope validation",
            },
            { status: 500 }
        );

        return {
            isValid: false,
            errorResponse,
        };
    }
}

/**
 * Helper function to validate a single eBay scope
 */
export async function validateSingleEbayScope(
    requiredScope: string,
    ebayAccount: EbayAccount,
    context: string = "eBay API"
): Promise<EbayScopeValidationResult> {
    return validateEbayScopes([requiredScope], ebayAccount, context);
}

/**
 * Helper function to get required scopes for common eBay operations
 */
export const EBAY_OPERATION_SCOPES = {
    // Inventory operations
    VIEW_INVENTORY: ["sell_inventory_readonly"],
    MANAGE_INVENTORY: ["sell_inventory"],

    // Order operations
    VIEW_ORDERS: ["sell_fulfillment_readonly"],
    MANAGE_ORDERS: ["sell_fulfillment"],

    // Returns operations (Post-Order API)
    VIEW_RETURNS: ["sell_fulfillment_readonly"],
    MANAGE_RETURNS: ["sell_fulfillment"],

    // Cancellations operations (Post-Order API)
    VIEW_CANCELLATIONS: ["sell_fulfillment_readonly"],
    MANAGE_CANCELLATIONS: ["sell_fulfillment"],

    // Inquiries operations (Post-Order API - INR/SNAD)
    VIEW_INQUIRIES: ["sell_fulfillment_readonly"],
    MANAGE_INQUIRIES: ["sell_fulfillment"],

    // Messaging operations (Trading API)
    VIEW_MESSAGES: ["sell_fulfillment_readonly"],
    SEND_MESSAGES: ["sell_fulfillment"],

    // Account operations
    VIEW_ACCOUNT: ["sell_account_readonly"],
    MANAGE_ACCOUNT: ["sell_account"],

    // Marketing operations
    VIEW_MARKETING: ["sell_marketing_readonly"],
    MANAGE_MARKETING: ["sell_marketing"],

    // Analytics
    VIEW_ANALYTICS: ["sell_analytics_readonly"],

    // User identity (usually required)
    USER_IDENTITY: ["identity_readonly"],

    // Basic API access (usually required)
    BASIC_ACCESS: ["api_scope"],
} as const;

/**
 * Helper function to validate scopes for specific eBay operations
 */
export async function validateEbayOperation(
    operation: keyof typeof EBAY_OPERATION_SCOPES,
    ebayAccount: EbayAccount,
    context?: string
): Promise<EbayScopeValidationResult> {
    const requiredScopes = [...EBAY_OPERATION_SCOPES[operation]];
    return validateEbayScopes(
        requiredScopes,
        ebayAccount,
        context || `eBay ${operation} operation`
    );
}
