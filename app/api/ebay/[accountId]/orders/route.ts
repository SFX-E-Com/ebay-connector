/**
 * GET /api/ebay/[accountId]/orders
 * Get orders for an eBay account
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayOrdersService, OrderFilterOptions, OrderFulfillmentStatus } from '@/app/lib/services/ebay-orders';

async function getHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const options: OrderFilterOptions = {};

        // Order IDs (comma-separated)
        const orderIds = searchParams.get('orderIds');
        if (orderIds) {
            options.orderIds = orderIds.split(',').map(id => id.trim());
        }

        // Fulfillment status filter
        const status = searchParams.get('status') as OrderFulfillmentStatus | null;
        if (status && ['NOT_STARTED', 'IN_PROGRESS', 'FULFILLED'].includes(status)) {
            options.fulfillmentStatus = status;
        }

        // Date filters
        const creationDateStart = searchParams.get('creationDateStart');
        if (creationDateStart) {
            options.creationDateStart = new Date(creationDateStart);
        }

        const creationDateEnd = searchParams.get('creationDateEnd');
        if (creationDateEnd) {
            options.creationDateEnd = new Date(creationDateEnd);
        }

        // Pagination
        const limit = searchParams.get('limit');
        if (limit) {
            options.limit = Math.min(parseInt(limit, 10), 200);
        }

        const offset = searchParams.get('offset');
        if (offset) {
            options.offset = parseInt(offset, 10);
        }

        // Create service and fetch orders
        const ordersService = await createEbayOrdersService(authData.ebayAccount.id);

        const result = await ordersService.getOrders(options);

        return NextResponse.json({
            success: true,
            data: {
                orders: result.orders,
                total: result.total,
                limit: result.limit,
                offset: result.offset,
                hasMore: result.next !== undefined
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch orders'
            },
            { status: 500 }
        );
    }
}

export const GET = withEbayAuth('ebay:orders:read', getHandler);
