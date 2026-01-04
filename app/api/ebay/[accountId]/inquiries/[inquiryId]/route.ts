/**
 * GET /api/ebay/[accountId]/inquiries/[inquiryId]
 * Get a single inquiry by ID
 * 
 * POST /api/ebay/[accountId]/inquiries/[inquiryId]
 * Issue refund / Provide shipment info
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayInquiriesService } from '@/app/lib/services/ebay-inquiries';

async function getHandler(
    request: NextRequest,
    authData: EbayAuthData
) {
    try {
        // Extract inquiryId from URL
        const urlParts = request.nextUrl.pathname.split('/');
        const inquiryId = urlParts[urlParts.length - 1];

        if (!inquiryId) {
            return NextResponse.json(
                { success: false, error: 'inquiryId is required' },
                { status: 400 }
            );
        }

        const inquiriesService = await createEbayInquiriesService(authData.ebayAccount.id);
        const result = await inquiriesService.getInquiry(inquiryId);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching inquiry:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch inquiry'
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
        // Extract inquiryId from URL
        const urlParts = request.nextUrl.pathname.split('/');
        const inquiryId = urlParts[urlParts.length - 1];

        if (!inquiryId) {
            return NextResponse.json(
                { success: false, error: 'inquiryId is required' },
                { status: 400 }
            );
        }

        // Use pre-parsed body from middleware to avoid consuming request stream
        const body = authData.requestBody || {};
        const { action, comments, trackingNumber, shippingCarrierCode, shippedDate } = body;

        const inquiriesService = await createEbayInquiriesService(authData.ebayAccount.id);

        let result;
        switch (action) {
            case 'refund':
                result = await inquiriesService.issueRefund(inquiryId, comments);
                break;
            case 'shipment':
                if (!trackingNumber || !shippingCarrierCode) {
                    return NextResponse.json(
                        { success: false, error: 'trackingNumber and shippingCarrierCode are required' },
                        { status: 400 }
                    );
                }
                result = await inquiriesService.provideShipmentInfo(inquiryId, {
                    trackingNumber,
                    shippingCarrierCode,
                    shippedDate,
                    comments
                });
                break;
            case 'escalate':
                result = await inquiriesService.escalate(inquiryId, comments);
                break;
            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action. Use: refund, shipment, escalate' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error processing inquiry action:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process inquiry action'
            },
            { status: 500 }
        );
    }
}

export const GET = withEbayAuth('ebay:inquiries:read', getHandler, 'VIEW_INQUIRIES');
export const POST = withEbayAuth('ebay:inquiries:write', postHandler, 'MANAGE_INQUIRIES');
