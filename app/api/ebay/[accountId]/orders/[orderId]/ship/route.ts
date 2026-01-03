/**
 * POST /api/ebay/[accountId]/orders/[orderId]/ship
 * Create shipping fulfillment for an order
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayOrdersService, ShippingCarrier } from '@/app/lib/services/ebay-orders';

interface ShipOrderRequest {
    trackingNumber: string;
    carrierCode: ShippingCarrier | string;
    shippedDate?: string;
    lineItems?: Array<{
        lineItemId: string;
        quantity: number;
    }>;
}

async function postHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        // Get orderId from URL path
        const urlParts = new URL(request.url).pathname.split('/');
        const shipIndex = urlParts.indexOf('ship');
        const orderId = shipIndex > 0 ? urlParts[shipIndex - 1] : null;

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: 'Order ID is required' },
                { status: 400 }
            );
        }

        const body: ShipOrderRequest = authData.requestBody || await request.json();

        // Validate required fields
        if (!body.trackingNumber) {
            return NextResponse.json(
                { success: false, error: 'Tracking number is required' },
                { status: 400 }
            );
        }

        if (!body.carrierCode) {
            return NextResponse.json(
                { success: false, error: 'Carrier code is required' },
                { status: 400 }
            );
        }

        const ordersService = await createEbayOrdersService(authData.ebayAccount.id);

        let result;

        if (body.lineItems && body.lineItems.length > 0) {
            // Ship specific line items
            result = await ordersService.createShippingFulfillment(orderId, {
                lineItems: body.lineItems,
                shippedDate: body.shippedDate || new Date().toISOString(),
                shippingCarrierCode: body.carrierCode,
                trackingNumber: body.trackingNumber
            });
        } else {
            // Ship all unfulfilled items
            result = await ordersService.shipOrder(
                orderId,
                body.trackingNumber,
                body.carrierCode,
                body.shippedDate ? new Date(body.shippedDate) : undefined
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Shipping fulfillment created successfully',
            data: result
        });
    } catch (error) {
        console.error('Error creating shipping fulfillment:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create shipping fulfillment'
            },
            { status: 500 }
        );
    }
}

export const POST = withEbayAuth('ebay:orders:write', postHandler);
