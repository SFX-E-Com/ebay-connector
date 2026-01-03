/**
 * GET /api/ebay/[accountId]/orders/pending
 * Get orders that need fulfillment (NOT_STARTED or IN_PROGRESS)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayOrdersService } from '@/app/lib/services/ebay-orders';

async function getHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const ordersService = await createEbayOrdersService(authData.ebayAccount.id);
        const orders = await ordersService.getPendingOrders(Math.min(limit, 100));

        return NextResponse.json({
            success: true,
            data: {
                orders,
                total: orders.length
            }
        });
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch pending orders'
            },
            { status: 500 }
        );
    }
}

export const GET = withEbayAuth('ebay:orders:read', getHandler);
