/**
 * Unit tests for eBay Messaging Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EbayMessagingService } from '../ebay-messaging';

// Mock account data
const mockAccount = {
  id: 'test-account-id',
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  ebayUserId: 'test-user-id',
  ebayUsername: 'test-username',
};

// Mock successful response for GetMyMessages
const mockGetMyMessagesResponse = `<?xml version="1.0" encoding="UTF-8"?>
<GetMyMessagesResponse xmlns="urn:ebay:apis:eBLBaseComponents">
  <Ack>Success</Ack>
  <Messages>
    <Message>
      <MessageID>12345</MessageID>
      <MessageType>AskSellerQuestion</MessageType>
      <Subject>Question about item</Subject>
      <Sender>buyer123</Sender>
      <CreationDate>2024-01-15T10:30:00Z</CreationDate>
      <Read>false</Read>
      <Replied>false</Replied>
      <Flagged>false</Flagged>
      <HighPriority>false</HighPriority>
      <Folder>
        <FolderID>0</FolderID>
      </Folder>
    </Message>
  </Messages>
  <Summary>
    <TotalMessageCount>1</TotalMessageCount>
  </Summary>
</GetMyMessagesResponse>`;

// Mock successful response for AddMemberMessageAAQToPartner
const mockSendMessageResponse = `<?xml version="1.0" encoding="UTF-8"?>
<AddMemberMessageAAQToPartnerResponse xmlns="urn:ebay:apis:eBLBaseComponents">
  <Ack>Success</Ack>
</AddMemberMessageAAQToPartnerResponse>`;

// Mock successful response for ReviseMyMessages
const mockReviseMessagesResponse = `<?xml version="1.0" encoding="UTF-8"?>
<ReviseMyMessagesResponse xmlns="urn:ebay:apis:eBLBaseComponents">
  <Ack>Success</Ack>
</ReviseMyMessagesResponse>`;

// Mock successful response for DeleteMyMessages
const mockDeleteMessagesResponse = `<?xml version="1.0" encoding="UTF-8"?>
<DeleteMyMessagesResponse xmlns="urn:ebay:apis:eBLBaseComponents">
  <Ack>Success</Ack>
</DeleteMyMessagesResponse>`;

// Mock error response
const mockErrorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<GetMyMessagesResponse xmlns="urn:ebay:apis:eBLBaseComponents">
  <Ack>Failure</Ack>
  <Errors>
    <ErrorCode>931</ErrorCode>
    <ShortMessage>Auth token is invalid</ShortMessage>
    <LongMessage>The auth token is invalid or expired</LongMessage>
  </Errors>
</GetMyMessagesResponse>`;

describe('EbayMessagingService', () => {
  let service: EbayMessagingService;

  beforeEach(() => {
    vi.stubEnv('EBAY_SANDBOX', 'false');
    vi.stubEnv('EBAY_DEFAULT_MARKETPLACE', 'EBAY_DE');
    service = new EbayMessagingService(mockAccount, 'EBAY_DE');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('constructor', () => {
    it('should initialize with production URL when EBAY_SANDBOX is false', () => {
      vi.stubEnv('EBAY_SANDBOX', 'false');
      const svc = new EbayMessagingService(mockAccount);
      expect(svc).toBeDefined();
    });

    it('should initialize with sandbox URL when EBAY_SANDBOX is true', () => {
      vi.stubEnv('EBAY_SANDBOX', 'true');
      const svc = new EbayMessagingService(mockAccount);
      expect(svc).toBeDefined();
    });

    it('should use default marketplace from env if not provided', () => {
      vi.stubEnv('EBAY_DEFAULT_MARKETPLACE', 'EBAY_US');
      const svc = new EbayMessagingService(mockAccount);
      expect(svc).toBeDefined();
    });
  });

  describe('getMyMessages', () => {
    it('should fetch messages successfully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGetMyMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.getMyMessages();

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].messageId).toBe('12345');
      expect(result.messages[0].messageType).toBe('AskSellerQuestion');
      expect(result.messages[0].subject).toBe('Question about item');
      expect(result.messages[0].sender).toBe('buyer123');
      expect(result.messages[0].read).toBe(false);
      expect(result.total).toBe(1);
    });

    it('should include folder filter in request', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGetMyMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      await service.getMyMessages({ folderId: 1 });

      expect(fetchMock).toHaveBeenCalled();
      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('<FolderID>1</FolderID>');
    });

    it('should include date range in request', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGetMyMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      const startTime = new Date('2024-01-01');
      const endTime = new Date('2024-01-31');
      await service.getMyMessages({ startTime, endTime });

      expect(fetchMock).toHaveBeenCalled();
      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('<StartTime>');
      expect(requestBody).toContain('<EndTime>');
    });

    it('should include pagination in request', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGetMyMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      await service.getMyMessages({ limit: 10, offset: 20 });

      expect(fetchMock).toHaveBeenCalled();
      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('<EntriesPerPage>10</EntriesPerPage>');
    });

    it('should throw on API error response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockErrorResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(service.getMyMessages()).rejects.toMatchObject({
        success: false,
        ack: 'Failure',
      });
    });
  });

  describe('getMessage', () => {
    it('should fetch a single message by ID', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGetMyMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.getMessage('12345');

      expect(result).not.toBeNull();
      expect(result?.messageId).toBe('12345');
    });

    it('should return null if message not found', async () => {
      const emptyResponse = `<?xml version="1.0" encoding="UTF-8"?>
<GetMyMessagesResponse xmlns="urn:ebay:apis:eBLBaseComponents">
  <Ack>Success</Ack>
  <Messages></Messages>
</GetMyMessagesResponse>`;

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(emptyResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.getMessage('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSendMessageResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.sendMessage({
        itemId: '123456789',
        recipientId: 'buyer123',
        body: 'Hello, thank you for your question!',
        questionType: 'General',
      });

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalled();
      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('<ItemID>123456789</ItemID>');
      expect(requestBody).toContain('<RecipientID>buyer123</RecipientID>');
      expect(requestBody).toContain('<Body>Hello, thank you for your question!</Body>');
    });

    it('should include subject when provided', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSendMessageResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      await service.sendMessage({
        itemId: '123456789',
        recipientId: 'buyer123',
        body: 'Hello!',
        subject: 'Re: Your Question',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('<Subject>Re: Your Question</Subject>');
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockReviseMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.markAsRead(['12345', '67890'], true);

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalled();
      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('<MessageID>12345</MessageID>');
      expect(requestBody).toContain('<MessageID>67890</MessageID>');
      expect(requestBody).toContain('<Read>true</Read>');
    });

    it('should mark messages as unread', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockReviseMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      await service.markAsRead(['12345'], false);

      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('<Read>false</Read>');
    });
  });

  describe('flagMessages', () => {
    it('should flag messages', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockReviseMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.flagMessages(['12345'], true);

      expect(result.success).toBe(true);
      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('<Flagged>true</Flagged>');
    });

    it('should unflag messages', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockReviseMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      await service.flagMessages(['12345'], false);

      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('<Flagged>false</Flagged>');
    });
  });

  describe('deleteMessages', () => {
    it('should delete messages', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockDeleteMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.deleteMessages(['12345', '67890']);

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalled();
      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('<MessageID>12345</MessageID>');
      expect(requestBody).toContain('<MessageID>67890</MessageID>');
    });
  });

  describe('API headers', () => {
    it('should include correct headers in requests', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGetMyMessagesResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      await service.getMyMessages();

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['X-EBAY-API-IAF-TOKEN']).toBe('test-access-token');
      expect(headers['X-EBAY-API-SITEID']).toBeDefined();
      expect(headers['X-EBAY-API-CALL-NAME']).toBe('GetMyMessages');
      expect(headers['Content-Type']).toBe('text/xml');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', fetchMock);

      await expect(service.getMyMessages()).rejects.toThrow('Network error');
    });

    it('should extract error details from failure response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockErrorResponse),
      });
      vi.stubGlobal('fetch', fetchMock);

      try {
        await service.getMyMessages();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toMatchObject({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: '931',
              shortMessage: 'Auth token is invalid',
            }),
          ]),
        });
      }
    });
  });
});
