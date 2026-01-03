/**
 * POST /api/ebay/[accountId]/cancellations/check-eligibility
 * Check if an order is eligible for cancellation
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayCancellationsService } from '@/app/lib/services/ebay-cancellations';

async function postHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        const body = await request.json();
        const { legacyOrderId } = body;

        if (!legacyOrderId) {
            return NextResponse.json(
                { success: false, error: 'legacyOrderId is required' },
                { status: 400 }
            );
        }

        const cancellationsService = await createEbayCancellationsService(authData.ebayAccount.id);
        const result = await cancellationsService.checkEligibility(legacyOrderId);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error checking cancellation eligibility:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check eligibility'
            },
            { status: 500 }
        );
    }
}

export const POST = withEbayAuth('ebay:cancellations:read', postHandler);
