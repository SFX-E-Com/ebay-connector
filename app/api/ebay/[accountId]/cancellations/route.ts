/**
 * GET /api/ebay/[accountId]/cancellations
 * Search cancellations for an eBay account
 * 
 * POST /api/ebay/[accountId]/cancellations
 * Create a new cancellation request
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import {
    createEbayCancellationsService,
    CancellationFilterOptions,
    CancellationState,
    CancellationReason
} from '@/app/lib/services/ebay-cancellations';

async function getHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const options: CancellationFilterOptions = {};

        // Cancellation state filter
        const state = searchParams.get('state') as CancellationState | null;
        if (state) {
            options.cancellationState = state;
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

        // Create service and fetch cancellations
        const cancellationsService = await createEbayCancellationsService(authData.ebayAccount.id);
        const result = await cancellationsService.searchCancellations(options);

        return NextResponse.json({
            success: true,
            data: {
                cancellations: result.members,
                total: result.total,
                limit: result.limit,
                offset: result.offset,
                hasMore: result.next !== undefined
            }
        });
    } catch (error) {
        console.error('Error fetching cancellations:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch cancellations'
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
        const body = await request.json();

        // Validate required fields
        const { legacyOrderId, cancelReason } = body;
        if (!legacyOrderId) {
            return NextResponse.json(
                { success: false, error: 'legacyOrderId is required' },
                { status: 400 }
            );
        }
        if (!cancelReason) {
            return NextResponse.json(
                { success: false, error: 'cancelReason is required' },
                { status: 400 }
            );
        }

        // Create service and create cancellation
        const cancellationsService = await createEbayCancellationsService(authData.ebayAccount.id);
        const result = await cancellationsService.createCancellation({
            legacyOrderId,
            cancelReason: cancelReason as CancellationReason,
            buyerPaidForItem: body.buyerPaidForItem,
            comments: body.comments
        });

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error creating cancellation:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create cancellation'
            },
            { status: 500 }
        );
    }
}

export const GET = withEbayAuth('ebay:cancellations:read', getHandler);
export const POST = withEbayAuth('ebay:cancellations:write', postHandler);
