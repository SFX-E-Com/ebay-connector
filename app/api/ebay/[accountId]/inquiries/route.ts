/**
 * GET /api/ebay/[accountId]/inquiries
 * Search inquiries (INR cases) for an eBay account
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayInquiriesService, InquiryFilterOptions, InquiryState, InquiryType } from '@/app/lib/services/ebay-inquiries';

async function getHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const options: InquiryFilterOptions = {};

        // Inquiry state filter
        const state = searchParams.get('state') as InquiryState | null;
        if (state) {
            options.inquiryState = state;
        }

        // Inquiry type filter
        const type = searchParams.get('type') as InquiryType | null;
        if (type) {
            options.inquiryType = type;
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

        // Create service and fetch inquiries
        const inquiriesService = await createEbayInquiriesService(authData.ebayAccount.id);
        const result = await inquiriesService.searchInquiries(options);

        return NextResponse.json({
            success: true,
            data: {
                inquiries: result.members,
                total: result.total,
                limit: result.limit,
                offset: result.offset,
                hasMore: result.next !== undefined
            }
        });
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch inquiries'
            },
            { status: 500 }
        );
    }
}

export const GET = withEbayAuth('ebay:inquiries:read', getHandler, 'VIEW_INQUIRIES');
