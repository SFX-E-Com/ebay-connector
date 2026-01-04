/**
 * eBay Messaging Service
 * Handles buyer-seller messaging via the eBay Trading API (XML-based)
 *
 * Key eBay Trading API methods:
 * - GetMyMessages: Retrieve messages from eBay inbox
 * - GetMemberMessages: Get messages about specific items
 * - AddMemberMessageAAQToPartner: Send message to buyer/seller
 * - ReviseMyMessages: Mark messages as read/flagged
 * - DeleteMyMessages: Delete messages
 */

import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { TRADING_API_CONFIG, getSiteId } from '../config/trading-api';
import { EbayAccountService } from './ebayAccountService';

// ============================================
// Types
// ============================================

interface EbayAccount {
  id: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  ebayUserId: string;
  ebayUsername: string | null;
}

export interface EbayMessage {
  messageId: string;
  externalMessageId?: string;
  messageType: string;
  subject?: string;
  body?: string;
  sender?: string;
  recipientUserId?: string;
  sendToName?: string;
  creationDate: string;
  receiveDate?: string;
  expirationDate?: string;
  read: boolean;
  replied: boolean;
  flagged: boolean;
  highPriority: boolean;
  folder: string;
  itemId?: string;
  itemTitle?: string;
  itemEndTime?: string;
  responseDetails?: {
    responseEnabled: boolean;
    responseUrl?: string;
  };
}

export interface MessageFilterOptions {
  folderId?: number; // 0=Inbox, 1=Sent, 2=Other
  startTime?: Date;
  endTime?: Date;
  messageStatus?: 'Answered' | 'Unanswered';
  messageIds?: string[];
  includeBody?: boolean;
  limit?: number;
  offset?: number;
}

export interface MemberMessage {
  messageId?: string;
  senderUserId: string;
  senderEmail?: string;
  recipientUserId?: string;
  subject?: string;
  body: string;
  messageType: string;
  questionType?: string;
  creationDate?: string;
  displayToPublic?: boolean;
}

export interface SendMessageParams {
  itemId: string;
  recipientId: string;
  body: string;
  subject?: string;
  questionType?: 'General' | 'Shipping' | 'Payment' | 'MultipleItemShipping' | 'CustomizedSubject' | 'None';
  emailCopyToSender?: boolean;
}

export interface MessagesResponse {
  messages: EbayMessage[];
  total: number;
  hasMore: boolean;
}

export interface MemberMessagesResponse {
  messages: MemberMessage[];
  paginationResult?: {
    totalNumberOfEntries: number;
    totalNumberOfPages: number;
  };
}

// ============================================
// Service Class
// ============================================

export class EbayMessagingService {
  private xmlParser: XMLParser;
  private xmlBuilder: XMLBuilder;
  private accessToken: string;
  private siteId: number;
  private apiUrl: string;
  private accountId: string;

  constructor(account: EbayAccount, marketplace: string = 'EBAY_DE') {
    this.accessToken = account.accessToken;
    this.siteId = getSiteId(marketplace);
    this.accountId = account.id;
    this.apiUrl = process.env.EBAY_SANDBOX === 'true'
      ? TRADING_API_CONFIG.sandbox.url
      : TRADING_API_CONFIG.production.url;

    // Configure XML parser
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '_',
      textNodeName: '_value',
      parseAttributeValue: true,
      trimValues: true,
    });

    // Configure XML builder
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '_',
      textNodeName: '_value',
      format: true,
      indentBy: '  ',
    });
  }

  // ============================================
  // Private Methods
  // ============================================

  private buildHeaders(callName: string): Record<string, string> {
    return {
      'X-EBAY-API-IAF-TOKEN': this.accessToken,
      'X-EBAY-API-SITEID': this.siteId.toString(),
      'X-EBAY-API-COMPATIBILITY-LEVEL': TRADING_API_CONFIG.production.version,
      'X-EBAY-API-CALL-NAME': callName,
      'Content-Type': 'text/xml',
    };
  }

  private buildXmlRequest(callName: string, body: Record<string, unknown>): string {
    const request = {
      [`${callName}Request`]: {
        '_xmlns': 'urn:ebay:apis:eBLBaseComponents',
        'ErrorLanguage': 'en_US',
        'WarningLevel': 'High',
        ...body,
      },
    };

    return '<?xml version="1.0" encoding="utf-8"?>\n' + this.xmlBuilder.build(request);
  }

  private parseResponse(xml: string, callName: string): Record<string, unknown> {
    const parsed = this.xmlParser.parse(xml);
    const responseKey = `${callName}Response`;

    if (!parsed[responseKey]) {
      console.error('[Messaging API] Invalid response format:', xml.substring(0, 500));
      throw new Error('Invalid XML response format');
    }

    const response = parsed[responseKey];

    if (response.Ack === 'Failure' || response.Ack === 'PartialFailure') {
      const errors = this.extractErrors(response);
      console.error('[Messaging API] API errors:', errors);
      throw {
        success: false,
        errors,
        ack: response.Ack,
      };
    }

    return response;
  }

  private extractErrors(response: Record<string, unknown>): Array<{ code: string; shortMessage: string; longMessage?: string }> {
    const errors = (response.Errors || []) as Array<Record<string, unknown>>;
    const errorArray = Array.isArray(errors) ? errors : [errors];

    return errorArray.map((error) => ({
      code: String(error.ErrorCode || 'UNKNOWN'),
      shortMessage: String(error.ShortMessage || 'Unknown error'),
      longMessage: error.LongMessage ? String(error.LongMessage) : undefined,
    }));
  }

  private async callAPI(callName: string, requestBody: Record<string, unknown>): Promise<Record<string, unknown>> {
    const headers = this.buildHeaders(callName);
    const xml = this.buildXmlRequest(callName, requestBody);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: xml,
      });

      const responseXml = await response.text();
      return this.parseResponse(responseXml, callName);
    } catch (error) {
      console.error(`[Messaging API] Error in ${callName}:`, error);
      throw error;
    }
  }

  // ============================================
  // Public Methods - Message Retrieval
  // ============================================

  /**
   * Get messages from eBay inbox/sent folders
   */
  async getMyMessages(options: MessageFilterOptions = {}): Promise<MessagesResponse> {
    const requestBody: Record<string, unknown> = {
      DetailLevel: options.includeBody ? 'ReturnMessages' : 'ReturnHeaders',
    };

    // Folder ID: 0=Inbox, 1=Sent
    if (options.folderId !== undefined) {
      requestBody.FolderID = options.folderId;
    }

    // Time range
    if (options.startTime) {
      requestBody.StartTime = options.startTime.toISOString();
    }
    if (options.endTime) {
      requestBody.EndTime = options.endTime.toISOString();
    }

    // Specific message IDs
    if (options.messageIds && options.messageIds.length > 0) {
      requestBody.MessageIDs = {
        MessageID: options.messageIds,
      };
    }

    // Pagination
    if (options.limit || options.offset) {
      requestBody.Pagination = {
        EntriesPerPage: Math.min(options.limit || 25, 25), // Max 25 per eBay
        PageNumber: Math.floor((options.offset || 0) / 25) + 1,
      };
    }

    const response = await this.callAPI('GetMyMessages', requestBody);

    // Parse messages
    const messagesData = response.Messages as Record<string, unknown> | undefined;
    let messages: EbayMessage[] = [];

    if (messagesData && messagesData.Message) {
      const messageArray = Array.isArray(messagesData.Message)
        ? messagesData.Message
        : [messagesData.Message];

      messages = messageArray.map((msg: Record<string, unknown>) => this.parseMessage(msg));
    }

    const summary = response.Summary as Record<string, unknown> | undefined;
    const totalCount = summary?.TotalMessageCount as number || messages.length;

    return {
      messages,
      total: totalCount,
      hasMore: messages.length >= 25,
    };
  }

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string): Promise<EbayMessage | null> {
    const result = await this.getMyMessages({
      messageIds: [messageId],
      includeBody: true,
    });

    return result.messages.length > 0 ? result.messages[0] : null;
  }

  /**
   * Get messages about a specific item (buyer-seller communication)
   */
  async getMemberMessages(itemId: string, options: {
    mailMessageType?: 'All' | 'AskSellerQuestion' | 'ResponseToASQQuestion';
    messageStatus?: 'Answered' | 'Unanswered';
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    pageNumber?: number;
  } = {}): Promise<MemberMessagesResponse> {
    const requestBody: Record<string, unknown> = {
      ItemID: itemId,
      MailMessageType: options.mailMessageType || 'All',
    };

    if (options.messageStatus) {
      requestBody.MessageStatus = options.messageStatus;
    }

    if (options.startTime) {
      requestBody.StartCreationTime = options.startTime.toISOString();
    }
    if (options.endTime) {
      requestBody.EndCreationTime = options.endTime.toISOString();
    }

    if (options.limit || options.pageNumber) {
      requestBody.Pagination = {
        EntriesPerPage: Math.min(options.limit || 25, 200),
        PageNumber: options.pageNumber || 1,
      };
    }

    const response = await this.callAPI('GetMemberMessages', requestBody);

    const memberMessages = response.MemberMessage as Record<string, unknown> | undefined;
    let messages: MemberMessage[] = [];

    if (memberMessages && memberMessages.MemberMessageExchange) {
      const exchanges = Array.isArray(memberMessages.MemberMessageExchange)
        ? memberMessages.MemberMessageExchange
        : [memberMessages.MemberMessageExchange];

      messages = exchanges.map((exchange: Record<string, unknown>) => {
        const question = exchange.Question as Record<string, unknown> | undefined;
        const response = exchange.Response as string | undefined;
        const msgId = exchange.MessageID as string | undefined;

        return {
          messageId: msgId,
          senderUserId: (question?.SenderID as string) || '',
          senderEmail: question?.SenderEmail as string | undefined,
          subject: question?.Subject as string | undefined,
          body: (question?.Body as string) || response || '',
          messageType: (question?.MessageType as string) || 'Unknown',
          questionType: question?.QuestionType as string | undefined,
          creationDate: question?.CreationDate as string | undefined,
          displayToPublic: exchange.MessageStatus === 'Answered',
        };
      });
    }

    const paginationResult = response.PaginationResult as Record<string, unknown> | undefined;

    return {
      messages,
      paginationResult: paginationResult ? {
        totalNumberOfEntries: (paginationResult.TotalNumberOfEntries as number) || 0,
        totalNumberOfPages: (paginationResult.TotalNumberOfPages as number) || 0,
      } : undefined,
    };
  }

  // ============================================
  // Public Methods - Send Messages
  // ============================================

  /**
   * Send a message to a buyer/seller about an item
   */
  async sendMessage(params: SendMessageParams): Promise<{ success: boolean }> {
    const requestBody: Record<string, unknown> = {
      ItemID: params.itemId,
      MemberMessage: {
        Body: params.body,
        RecipientID: params.recipientId,
        QuestionType: params.questionType || 'General',
        EmailCopyToSender: params.emailCopyToSender ?? false,
      },
    };

    if (params.subject) {
      (requestBody.MemberMessage as Record<string, unknown>).Subject = params.subject;
    }

    await this.callAPI('AddMemberMessageAAQToPartner', requestBody);

    return { success: true };
  }

  // ============================================
  // Public Methods - Message Management
  // ============================================

  /**
   * Mark messages as read/unread
   */
  async markAsRead(messageIds: string[], read: boolean = true): Promise<{ success: boolean }> {
    const requestBody: Record<string, unknown> = {
      MessageIDs: {
        MessageID: messageIds,
      },
      Read: read,
    };

    await this.callAPI('ReviseMyMessages', requestBody);

    return { success: true };
  }

  /**
   * Flag/unflag messages
   */
  async flagMessages(messageIds: string[], flagged: boolean = true): Promise<{ success: boolean }> {
    const requestBody: Record<string, unknown> = {
      MessageIDs: {
        MessageID: messageIds,
      },
      Flagged: flagged,
    };

    await this.callAPI('ReviseMyMessages', requestBody);

    return { success: true };
  }

  /**
   * Delete messages
   */
  async deleteMessages(messageIds: string[]): Promise<{ success: boolean }> {
    const requestBody: Record<string, unknown> = {
      MessageIDs: {
        MessageID: messageIds,
      },
    };

    await this.callAPI('DeleteMyMessages', requestBody);

    return { success: true };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private parseMessage(msg: Record<string, unknown>): EbayMessage {
    return {
      messageId: String(msg.MessageID || ''),
      externalMessageId: msg.ExternalMessageID ? String(msg.ExternalMessageID) : undefined,
      messageType: String(msg.MessageType || 'Unknown'),
      subject: msg.Subject ? String(msg.Subject) : undefined,
      body: msg.Text ? String(msg.Text) : undefined,
      sender: msg.Sender ? String(msg.Sender) : undefined,
      recipientUserId: msg.RecipientUserID ? String(msg.RecipientUserID) : undefined,
      sendToName: msg.SendToName ? String(msg.SendToName) : undefined,
      creationDate: String(msg.CreationDate || new Date().toISOString()),
      receiveDate: msg.ReceiveDate ? String(msg.ReceiveDate) : undefined,
      expirationDate: msg.ExpirationDate ? String(msg.ExpirationDate) : undefined,
      read: msg.Read === true || msg.Read === 'true',
      replied: msg.Replied === true || msg.Replied === 'true',
      flagged: msg.Flagged === true || msg.Flagged === 'true',
      highPriority: msg.HighPriority === true || msg.HighPriority === 'true',
      folder: String((msg.Folder as Record<string, unknown>)?.FolderID || '0'),
      itemId: msg.ItemID ? String(msg.ItemID) : undefined,
      itemTitle: msg.ItemTitle ? String(msg.ItemTitle) : undefined,
      itemEndTime: msg.ItemEndTime ? String(msg.ItemEndTime) : undefined,
      responseDetails: msg.ResponseDetails ? {
        responseEnabled: (msg.ResponseDetails as Record<string, unknown>).ResponseEnabled === true,
        responseUrl: (msg.ResponseDetails as Record<string, unknown>).ResponseURL
          ? String((msg.ResponseDetails as Record<string, unknown>).ResponseURL)
          : undefined,
      } : undefined,
    };
  }
}

// ============================================
// Factory Function
// ============================================

export async function createEbayMessagingService(
  accountId: string,
  marketplace?: string
): Promise<EbayMessagingService> {
  const account = await EbayAccountService.getAccountById(accountId);

  if (!account) {
    throw new Error(`eBay account not found: ${accountId}`);
  }

  const defaultMarketplace = process.env.EBAY_DEFAULT_MARKETPLACE || 'EBAY_DE';

  return new EbayMessagingService(
    {
      id: account.id,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || null,
      expiresAt: account.expiresAt,
      ebayUserId: account.ebayUserId,
      ebayUsername: account.ebayUsername || null,
    },
    marketplace || defaultMarketplace
  );
}
