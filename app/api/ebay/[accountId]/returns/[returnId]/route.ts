/**
 * GET /api/ebay/[accountId]/returns/[returnId]
 * Get a single return by ID
 * 
 * POST /api/ebay/[accountId]/returns/[returnId]
 * Accept return / Issue refund
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayReturnsService } from '@/app/lib/services/ebay-returns';

async function getHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        // Extract returnId from URL
        const urlParts = request.nextUrl.pathname.split('/');
        const returnId = urlParts[urlParts.length - 1];

        if (!returnId) {
            return NextResponse.json(
                { success: false, error: 'returnId is required' },
                { status: 400 }
            );
        }

        const returnsService = await createEbayReturnsService(authData.ebayAccount.id);
        const result = await returnsService.getReturn(returnId);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching return:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch return'
            },
            { status: 500 }
        );
    }
}

async function postHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        // Extract returnId from URL
        const urlParts = request.nextUrl.pathname.split('/');
        const returnId = urlParts[urlParts.length - 1];

        if (!returnId) {
            return NextResponse.json(
                { success: false, error: 'returnId is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { action, comments, refundAmount } = body;

        const returnsService = await createEbayReturnsService(authData.ebayAccount.id);

        let result;
        switch (action) {
            case 'accept':
                result = await returnsService.acceptReturn(returnId, comments);
                break;
            case 'refund':
                result = await returnsService.issueRefund(returnId, { refundAmount, comments });
                break;
            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action. Use: accept, refund' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error processing return action:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process return action'
            },
            { status: 500 }
        );
    }
}

export const GET = withEbayAuth('ebay:returns:read', getHandler);
export const POST = withEbayAuth('ebay:returns:write', postHandler);
