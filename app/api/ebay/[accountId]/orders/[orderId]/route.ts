/**
 * GET /api/ebay/[accountId]/orders/[orderId]
 * Get a single order by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayOrdersService } from '@/app/lib/services/ebay-orders';

async function getHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        // Get orderId from params via authData
        const orderId = authData.requestBody?.orderId ||
            new URL(request.url).pathname.split('/').pop();

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: 'Order ID is required' },
                { status: 400 }
            );
        }

        const ordersService = await createEbayOrdersService(authData.ebayAccount.id);
        const order = await ordersService.getOrder(orderId);

        return NextResponse.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch order'
            },
            { status: 500 }
        );
    }
}

export const GET = withEbayAuth('ebay:orders:read', getHandler);
