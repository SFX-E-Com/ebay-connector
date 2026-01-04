/**
 * eBay Single Message API Routes
 * GET    - Get message details
 * PATCH  - Update message (mark read/flagged)
 * DELETE - Delete message
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayMessagingService } from '@/app/lib/services/ebay-messaging';

// ============================================
// Helper to extract messageId from URL
// ============================================

function getMessageIdFromUrl(request: NextRequest): string | null {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  // Pattern: /api/ebay/[accountId]/messages/[messageId]
  const messagesIndex = pathSegments.indexOf('messages');
  if (messagesIndex !== -1 && messagesIndex + 1 < pathSegments.length) {
    return pathSegments[messagesIndex + 1];
  }
  return null;
}

// ============================================
// GET /api/ebay/[accountId]/messages/[messageId]
// ============================================

async function getMessageHandler(
  request: NextRequest,
  authData: EbayAuthData
): Promise<NextResponse> {
  try {
    const messageId = getMessageIdFromUrl(request);

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_MESSAGE_ID',
            message: 'Message ID is required',
          },
        },
        { status: 400 }
      );
    }

    const messagingService = await createEbayMessagingService(authData.ebayAccount.id);
    const message = await messagingService.getMessage(messageId);

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MESSAGE_NOT_FOUND',
            message: `Message with ID ${messageId} not found`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('[Messages API] Error fetching message:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch message';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MESSAGE_FETCH_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/ebay/[accountId]/messages/[messageId]
// ============================================

async function updateMessageHandler(
  request: NextRequest,
  authData: EbayAuthData
): Promise<NextResponse> {
  try {
    const messageId = getMessageIdFromUrl(request);

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_MESSAGE_ID',
            message: 'Message ID is required',
          },
        },
        { status: 400 }
      );
    }

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

    const { read, flagged } = body;

    // Validate at least one action
    if (read === undefined && flagged === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'At least one of "read" or "flagged" must be provided',
          },
        },
        { status: 400 }
      );
    }

    const messagingService = await createEbayMessagingService(authData.ebayAccount.id);

    // Update read status
    if (read !== undefined) {
      await messagingService.markAsRead([messageId], read);
    }

    // Update flagged status
    if (flagged !== undefined) {
      await messagingService.flagMessages([messageId], flagged);
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        updated: {
          read: read !== undefined ? read : null,
          flagged: flagged !== undefined ? flagged : null,
        },
      },
    });
  } catch (error) {
    console.error('[Messages API] Error updating message:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to update message';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MESSAGE_UPDATE_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/ebay/[accountId]/messages/[messageId]
// ============================================

async function deleteMessageHandler(
  request: NextRequest,
  authData: EbayAuthData
): Promise<NextResponse> {
  try {
    const messageId = getMessageIdFromUrl(request);

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_MESSAGE_ID',
            message: 'Message ID is required',
          },
        },
        { status: 400 }
      );
    }

    const messagingService = await createEbayMessagingService(authData.ebayAccount.id);
    await messagingService.deleteMessages([messageId]);

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        deleted: true,
      },
    });
  } catch (error) {
    console.error('[Messages API] Error deleting message:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MESSAGE_DELETE_ERROR',
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
  getMessageHandler,
  'VIEW_ORDERS'
);

export const PATCH = withEbayAuth(
  'ebay:messages:write',
  updateMessageHandler,
  'MANAGE_ORDERS'
);

export const DELETE = withEbayAuth(
  'ebay:messages:write',
  deleteMessageHandler,
  'MANAGE_ORDERS'
);
