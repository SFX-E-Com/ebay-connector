import { NextRequest } from "next/server";
import {
    withQueryDebugLogging,
    logToDebug,
} from "@/app/lib/middleware/queryDebugMiddleware";
import { withEbayAuth, EbayAuthData } from "@/app/lib/middleware/ebayAuth";
import { EbayErrorHandler } from "@/app/lib/services/ebayErrorHandler";
import { getEbayConfig, getEbayUrls } from "@/app/lib/config/ebay";

interface InventoryItem {
    sku: string;
    product?: {
        title?: string;
        description?: string;
        imageUrls?: string[];
        brand?: string;
        mpn?: string;
        aspects?: Record<string, string[]>;
    };
    condition?: string;
    conditionDescription?: string;
    packageWeightAndSize?: {
        dimensions?: {
            height?: number;
            length?: number;
            width?: number;
            unit?: string;
        };
        packageType?: string;
        weight?: {
            value?: number;
            unit?: string;
        };
    };
    availability?: {
        pickupAtLocationAvailability?: Array<{
            availabilityType?: string;
            fulfillmentTime?: {
                value?: number;
                unit?: string;
            };
            merchantLocationKey?: string;
        }>;
        shipToLocationAvailability?: {
            availabilityDistributions?: Array<{
                fulfillmentTime?: {
                    value?: number;
                    unit?: string;
                };
                merchantLocationKey?: string;
                quantity?: number;
            }>;
        };
    };
}

interface InventoryResponse {
    inventoryItems: InventoryItem[];
    href?: string;
    limit?: number;
    next?: string;
    prev?: string;
    size?: number;
    total?: number;
}

async function fetchEbayInventory(
    accessToken: string,
    limit: number = 50,
    offset: number = 0
): Promise<InventoryResponse> {
    try {
        const config = getEbayConfig();
        const urls = getEbayUrls(config.isProduction);
        const apiUrl = `${urls.api}/sell/inventory/v1/inventory_item`;

        console.log('=== EBAY API CALL DEBUG ===');
        console.log('API URL:', apiUrl);
        console.log('Access Token Length:', accessToken?.length || 0);
        console.log('Access Token Empty:', !accessToken || accessToken === '');
        console.log('Access Token Type:', typeof accessToken);

        await logToDebug("EBAY_INVENTORY", "Making eBay Inventory API call", {
            limit,
            offset,
            environment: config.isProduction ? "production" : "sandbox",
            apiUrl,
            tokenLength: accessToken?.length || 0,
            tokenEmpty: !accessToken || accessToken === ''
        }, "DEBUG");

        const queryParams = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
        });

        const response = await fetch(
            `${urls.api}/sell/inventory/v1/inventory_item?${queryParams}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "Accept-Language": "en-US",
                    "X-EBAY-C-MARKETPLACE-ID": config.isProduction ? "EBAY_US" : "EBAY_US",
                },
            }
        );

        const responseText = await response.text();

        console.log('=== EBAY API RESPONSE DEBUG ===');
        console.log('Status:', response.status, response.statusText);
        console.log('Response Length:', responseText.length);
        console.log('Response Preview:', responseText.substring(0, 500));

        await logToDebug("EBAY_INVENTORY", "eBay Inventory API response received", {
            statusCode: response.status,
            statusText: response.statusText,
            hasContent: !!responseText,
            contentLength: responseText.length,
            contentPreview: responseText.substring(0, 500)
        }, "DEBUG");

        if (!response.ok) {
            // Use the new error handler for eBay API errors
            const error = {
                response: {
                    status: response.status,
                    statusText: response.statusText,
                    data: responseText ? JSON.parse(responseText) : null
                }
            };
            await EbayErrorHandler.handleEbayError(error, 'eBay Inventory API');
        }

        const data = responseText ? JSON.parse(responseText) : {};

        await logToDebug("EBAY_INVENTORY", "eBay Inventory API call successful", {
            totalItems: data.total || 0,
            returnedItems: data.inventoryItems?.length || 0,
            hasNext: !!data.next,
            hasPrev: !!data.prev
        }, "INFO");

        return data;

    } catch (error) {
        // If it's already an EbayApiError, just re-throw it
        if (error instanceof Error && error.name === 'EbayApiError') {
            throw error;
        }

        // Handle other errors with the error handler
        throw await EbayErrorHandler.handleEbayError(error, 'eBay Inventory API');
    }
}

const getHandler = withEbayAuth('ebay:inventory:read', async (request: NextRequest, authData: EbayAuthData, { params }: { params: Promise<{ accountId: string }> }) => {
    const config = getEbayConfig();
    const { accountId } = await params;

    try {
        // DEBUG: Log token info (not the full token for security)
        const tokenPreview = authData.ebayAccount.accessToken 
            ? `${authData.ebayAccount.accessToken.substring(0, 20)}...${authData.ebayAccount.accessToken.substring(authData.ebayAccount.accessToken.length - 10)}`
            : 'NO_TOKEN';
        
        console.log('=== INVENTORY API DEBUG ===');
        console.log('Account ID:', accountId);
        console.log('Token Length:', authData.ebayAccount.accessToken?.length || 0);
        console.log('Token Preview:', tokenPreview);
        console.log('Token Expires At:', authData.ebayAccount.expiresAt);
        console.log('Environment:', config.isProduction ? 'PRODUCTION' : 'SANDBOX');
        console.log('eBay Username:', authData.ebayAccount.ebayUsername);
        console.log('Account Status:', authData.ebayAccount.status);

        await logToDebug("EBAY_INVENTORY", "View Inventory API Called", {
            accountId,
            userId: authData.user.id,
            userEmail: authData.user.email,
            environment: config.isProduction ? "production" : "sandbox",
            tokenLength: authData.ebayAccount.accessToken?.length || 0,
            tokenPreview,
            expiresAt: authData.ebayAccount.expiresAt?.toISOString()
        }, "INFO");

        // Parse query parameters for pagination
        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
        const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

        await logToDebug("EBAY_INVENTORY", "Processing inventory request parameters", {
            requestedLimit: url.searchParams.get("limit"),
            processedLimit: limit,
            requestedOffset: url.searchParams.get("offset"),
            processedOffset: offset
        }, "DEBUG");

        // Fetch inventory from eBay
        const inventoryData = await fetchEbayInventory(
            authData.ebayAccount.accessToken,
            limit,
            offset
        );

        await logToDebug("EBAY_INVENTORY", "Inventory data processed successfully", {
            accountId: authData.ebayAccount.id,
            friendlyName: authData.ebayAccount.friendlyName || "Unknown",
            totalInventoryItems: inventoryData.total || 0,
            returnedItems: inventoryData.inventoryItems?.length || 0,
            currentOffset: offset,
            currentLimit: limit,
            hasMoreResults: !!inventoryData.next
        }, "INFO");

        return Response.json({
            success: true,
            data: {
                account: {
                    id: authData.ebayAccount.id,
                    friendlyName: authData.ebayAccount.friendlyName,
                },
                inventory: {
                    items: inventoryData.inventoryItems || [],
                    pagination: {
                        total: inventoryData.total || 0,
                        limit: inventoryData.limit || limit,
                        offset: offset,
                        size: inventoryData.size || (inventoryData.inventoryItems?.length || 0),
                        hasNext: !!inventoryData.next,
                        hasPrev: !!inventoryData.prev,
                        nextUrl: inventoryData.next || null,
                        prevUrl: inventoryData.prev || null,
                    },
                    metadata: {
                        requiredScope: "sell.inventory.readonly",
                        environment: config.isProduction ? "production" : "sandbox",
                        fetchedAt: new Date().toISOString(),
                    },
                },
            },
        });

    } catch (error) {
        await logToDebug("EBAY_INVENTORY", "View Inventory API failed with error", {
            accountId,
            userId: authData.user.id,
            userEmail: authData.user.email,
            error: error instanceof Error ? error.message : "Unknown error",
            errorStack: error instanceof Error ? error.stack : null,
            errorType: error instanceof Error ? error.constructor.name : typeof error
        }, "ERROR");

        // Handle EbayApiError with proper response
        if (error instanceof Error && error.name === 'EbayApiError') {
            const ebayError = error as any; // Cast to access EbayApiError properties

            return Response.json(
                {
                    success: false,
                    message: ebayError.message,
                    data: {
                        account: {
                            id: authData.ebayAccount.id,
                        },
                        errorType: ebayError.type,
                        ebayErrorId: ebayError.ebayErrorId,
                        category: ebayError.category,
                        domain: ebayError.domain,
                        userFriendlyMessage: EbayErrorHandler.getUserFriendlyMessage(ebayError),
                        isRetryable: EbayErrorHandler.isRetryableError(ebayError)
                    }
                },
                { status: ebayError.statusCode || 500 }
            );
        }

        // Handle other errors
        return Response.json(
            {
                success: false,
                message: "Failed to fetch inventory data",
                error: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}, 'VIEW_INVENTORY');

export const GET = withQueryDebugLogging(getHandler);