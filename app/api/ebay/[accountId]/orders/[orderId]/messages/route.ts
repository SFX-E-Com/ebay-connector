/**
 * eBay Order Messages API Routes
 * GET  - Get messages related to order's items
 * POST - Send a message to the order's buyer
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';
import { createEbayMessagingService } from '@/app/lib/services/ebay-messaging';
import { createEbayOrdersService } from '@/app/lib/services/ebay-orders';

// ============================================
// Helper to extract orderId from URL
// ============================================

function getOrderIdFromUrl(request: NextRequest): string | null {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  // Pattern: /api/ebay/[accountId]/orders/[orderId]/messages
  const ordersIndex = pathSegments.indexOf('orders');
  if (ordersIndex !== -1 && ordersIndex + 1 < pathSegments.length) {
    return pathSegments[ordersIndex + 1];
  }
  return null;
}

// ============================================
// GET /api/ebay/[accountId]/orders/[orderId]/messages
// ============================================

async function getOrderMessagesHandler(
  request: NextRequest,
  authData: EbayAuthData
): Promise<NextResponse> {
  try {
    const orderId = getOrderIdFromUrl(request);

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ORDER_ID',
            message: 'Order ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Get the order to find item IDs
    const ordersService = await createEbayOrdersService(authData.ebayAccount.id);
    const order = await ordersService.getOrder(orderId);

    if (!order || !order.lineItems || order.lineItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: `Order ${orderId} not found or has no items`,
          },
        },
        { status: 404 }
      );
    }

    // Get messages for each item in the order
    const messagingService = await createEbayMessagingService(authData.ebayAccount.id);
    const allMessages: Array<{
      itemId: string;
      itemTitle: string;
      messages: unknown[];
    }> = [];

    for (const lineItem of order.lineItems) {
      const itemId = lineItem.legacyItemId;
      if (itemId) {
        try {
          const result = await messagingService.getMemberMessages(itemId);
          allMessages.push({
            itemId,
            itemTitle: lineItem.title,
            messages: result.messages,
          });
        } catch (error) {
          // Continue with other items if one fails
          console.warn(`[Order Messages] Failed to get messages for item ${itemId}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        buyer: order.buyer?.username,
        itemMessages: allMessages,
        totalItems: order.lineItems.length,
      },
    });
  } catch (error) {
    console.error('[Order Messages API] Error fetching messages:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order messages';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ORDER_MESSAGES_FETCH_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/ebay/[accountId]/orders/[orderId]/messages
// ============================================

async function sendOrderMessageHandler(
  request: NextRequest,
  authData: EbayAuthData
): Promise<NextResponse> {
  try {
    const orderId = getOrderIdFromUrl(request);

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ORDER_ID',
            message: 'Order ID is required',
          },
        },
        { status: 400 }
      );
    }

    const body = authData.requestBody;

    if (!body || !body.body) {
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

    if (body.body.length > 2000) {
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

    // Get the order to find buyer and item information
    const ordersService = await createEbayOrdersService(authData.ebayAccount.id);
    const order = await ordersService.getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: `Order ${orderId} not found`,
          },
        },
        { status: 404 }
      );
    }

    if (!order.buyer?.username) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BUYER_NOT_FOUND',
            message: 'Buyer information not available for this order',
          },
        },
        { status: 400 }
      );
    }

    // Use first line item's ID for the message
    const firstLineItem = order.lineItems[0];
    if (!firstLineItem?.legacyItemId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'No item found in order to associate message with',
          },
        },
        { status: 400 }
      );
    }

    const messagingService = await createEbayMessagingService(authData.ebayAccount.id);

    const result = await messagingService.sendMessage({
      itemId: firstLineItem.legacyItemId,
      recipientId: order.buyer.username,
      body: body.body,
      subject: body.subject,
      questionType: body.questionType || 'General',
      emailCopyToSender: body.emailCopyToSender,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        orderId,
        recipientId: order.buyer.username,
        itemId: firstLineItem.legacyItemId,
      },
    });
  } catch (error) {
    console.error('[Order Messages API] Error sending message:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ORDER_MESSAGE_SEND_ERROR',
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
  getOrderMessagesHandler,
  'VIEW_ORDERS'
);

export const POST = withEbayAuth(
  'ebay:messages:write',
  sendOrderMessageHandler,
  'MANAGE_ORDERS'
);
