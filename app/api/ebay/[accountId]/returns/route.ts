/**
 * GET /api/ebay/[accountId]/returns
 * Search returns for an eBay account
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayReturnsService, ReturnFilterOptions, ReturnState } from '@/app/lib/services/ebay-returns';

async function getHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const options: ReturnFilterOptions = {};

        // Return state filter
        const state = searchParams.get('state') as ReturnState | null;
        if (state) {
            options.returnState = state;
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

        // Create service and fetch returns
        const returnsService = await createEbayReturnsService(authData.ebayAccount.id);
        const result = await returnsService.searchReturns(options);

        return NextResponse.json({
            success: true,
            data: {
                returns: result.members,
                total: result.total,
                limit: result.limit,
                offset: result.offset,
                hasMore: result.next !== undefined
            }
        });
    } catch (error) {
        console.error('Error fetching returns:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch returns'
            },
            { status: 500 }
        );
    }
}

export const GET = withEbayAuth('ebay:returns:read', getHandler);
