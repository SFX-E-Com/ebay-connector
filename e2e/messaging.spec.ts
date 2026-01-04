/**
 * E2E Tests for eBay Messaging API
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_ACCOUNT_ID = process.env.TEST_EBAY_ACCOUNT_ID || 'test-account-id';
const TEST_MESSAGE_ID = process.env.TEST_MESSAGE_ID || 'test-message-id';
const TEST_ORDER_ID = process.env.TEST_ORDER_ID || 'test-order-id';

test.describe('eBay Messaging API', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Skip auth in CI or use test credentials
    if (process.env.CI) {
      test.skip();
    }

    // Login to get auth token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'test-password',
      },
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      authToken = loginData.token;
    }
  });

  test.describe('GET /api/ebay/[accountId]/messages', () => {
    test('should return messages list', async ({ request }) => {
      const response = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('messages');
      expect(data.data).toHaveProperty('total');
      expect(Array.isArray(data.data.messages)).toBe(true);
    });

    test('should support folder filter', async ({ request }) => {
      const response = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages?folderId=0&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('should support includeBody parameter', async ({ request }) => {
      const response = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages?includeBody=true&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      if (data.data.messages.length > 0) {
        const message = data.data.messages[0];
        expect(message).toHaveProperty('messageId');
        expect(message).toHaveProperty('messageType');
      }
    });

    test('should require authentication', async ({ request }) => {
      const response = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages`
      );

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /api/ebay/[accountId]/messages/[messageId]', () => {
    test('should return single message', async ({ request }) => {
      // First get a message ID
      const listResponse = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const listData = await listResponse.json();

      if (listData.data.messages.length === 0) {
        test.skip();
        return;
      }

      const messageId = listData.data.messages[0].messageId;

      // Get single message
      const response = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.messageId).toBe(messageId);
    });

    test('should return 404 for non-existent message', async ({ request }) => {
      const response = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages/nonexistent-id`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(404);
    });
  });

  test.describe('POST /api/ebay/[accountId]/messages', () => {
    test('should validate required fields', async ({ request }) => {
      const response = await request.post(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            // Missing required fields
          },
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toMatch(/MISSING_/);
    });

    test('should validate message body length', async ({ request }) => {
      const response = await request.post(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            itemId: '123456789',
            recipientId: 'buyer123',
            body: 'a'.repeat(2001), // Exceeds 2000 char limit
          },
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('BODY_TOO_LONG');
    });

    test('should send message with valid data', async ({ request }) => {
      // This test requires a valid item ID and recipient
      // Skip in automated tests
      test.skip();

      const response = await request.post(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            itemId: '123456789',
            recipientId: 'buyer123',
            body: 'Thank you for your question!',
            subject: 'Re: Your question',
            questionType: 'General',
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  test.describe('PATCH /api/ebay/[accountId]/messages/[messageId]', () => {
    test('should mark message as read', async ({ request }) => {
      // First get a message ID
      const listResponse = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const listData = await listResponse.json();

      if (listData.data.messages.length === 0) {
        test.skip();
        return;
      }

      const messageId = listData.data.messages[0].messageId;

      const response = await request.patch(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            read: true,
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.messageId).toBe(messageId);
      expect(data.data.updated.read).toBe(true);
    });

    test('should flag message', async ({ request }) => {
      const listResponse = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const listData = await listResponse.json();

      if (listData.data.messages.length === 0) {
        test.skip();
        return;
      }

      const messageId = listData.data.messages[0].messageId;

      const response = await request.patch(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            flagged: true,
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.updated.flagged).toBe(true);
    });

    test('should validate at least one action', async ({ request }) => {
      const response = await request.patch(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages/test-id`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            // No read or flagged
          },
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_REQUEST');
    });
  });

  test.describe('DELETE /api/ebay/[accountId]/messages/[messageId]', () => {
    test('should delete message', async ({ request }) => {
      // Skip - destructive operation
      test.skip();

      const response = await request.delete(
        `/api/ebay/${TEST_ACCOUNT_ID}/messages/${TEST_MESSAGE_ID}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.deleted).toBe(true);
    });
  });

  test.describe('GET /api/ebay/[accountId]/orders/[orderId]/messages', () => {
    test('should return order messages', async ({ request }) => {
      // Skip - requires valid order ID
      test.skip();

      const response = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/orders/${TEST_ORDER_ID}/messages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('orderId');
      expect(data.data).toHaveProperty('buyer');
      expect(data.data).toHaveProperty('itemMessages');
    });

    test('should validate order ID', async ({ request }) => {
      const response = await request.get(
        `/api/ebay/${TEST_ACCOUNT_ID}/orders/invalid-order/messages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('POST /api/ebay/[accountId]/orders/[orderId]/messages', () => {
    test('should validate request body', async ({ request }) => {
      const response = await request.post(
        `/api/ebay/${TEST_ACCOUNT_ID}/orders/${TEST_ORDER_ID}/messages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            // Missing body
          },
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('MISSING_BODY');
    });

    test('should send order message with valid data', async ({ request }) => {
      // Skip - requires valid order
      test.skip();

      const response = await request.post(
        `/api/ebay/${TEST_ACCOUNT_ID}/orders/${TEST_ORDER_ID}/messages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            body: 'Thank you for your purchase!',
            subject: 'Order Update',
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
