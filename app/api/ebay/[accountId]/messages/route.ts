/**
 * eBay Messages API Routes
 * GET  - List messages from inbox/sent
 * POST - Send a message to buyer/seller
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayMessagingService } from '@/app/lib/services/ebay-messaging';

// ============================================
// GET /api/ebay/[accountId]/messages
// ============================================

async function getMessagesHandler(
  request: NextRequest,
  authData: EbayAuthData
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const folderId = searchParams.get('folderId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const includeBody = searchParams.get('includeBody') === 'true';
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const messagingService = await createEbayMessagingService(authData.ebayAccount.id);

    const result = await messagingService.getMyMessages({
      folderId: folderId ? parseInt(folderId, 10) : undefined,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      includeBody,
      limit: limit ? parseInt(limit, 10) : 25,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Messages API] Error fetching messages:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MESSAGES_FETCH_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/ebay/[accountId]/messages
// ============================================

async function sendMessageHandler(
  request: NextRequest,
  authData: EbayAuthData
): Promise<NextResponse> {
  try {
    // Get body from authData (already parsed by middleware)
    const body = authData.requestBody;

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Request body is required',
          },
        },
        { status: 400 }
      );
    }

    const { itemId, recipientId, body: messageBody, subject, questionType, emailCopyToSender } = body;

    // Validate required fields
    if (!itemId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ITEM_ID',
            message: 'itemId is required',
          },
        },
        { status: 400 }
      );
    }

    if (!recipientId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_RECIPIENT',
            message: 'recipientId is required',
          },
        },
        { status: 400 }
      );
    }

    if (!messageBody) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_BODY',
            message: 'Message body is required',
          },
        },
        { status: 400 }
      );
    }

    if (messageBody.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BODY_TOO_LONG',
            message: 'Message body must be 2000 characters or less',
          },
        },
        { status: 400 }
      );
    }

    const messagingService = await createEbayMessagingService(authData.ebayAccount.id);

    const result = await messagingService.sendMessage({
      itemId,
      recipientId,
      body: messageBody,
      subject,
      questionType,
      emailCopyToSender,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Messages API] Error sending message:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MESSAGE_SEND_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

// ============================================
// Export Route Handlers
// ============================================

export const GET = withEbayAuth(
  'ebay:messages:read',
  getMessagesHandler,
  'VIEW_ORDERS' // Messages require fulfillment scope
);

export const POST = withEbayAuth(
  'ebay:messages:write',
  sendMessageHandler,
  'MANAGE_ORDERS' // Sending messages requires write scope
);
