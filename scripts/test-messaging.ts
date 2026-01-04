/**
 * eBay Messaging API Test Script
 *
 * This script helps verify the messaging API setup and test endpoints.
 * Run with: npx tsx scripts/test-messaging.ts
 */

import * as readline from 'readline';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestConfig {
  token: string;
  accountId: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testGetMessages(config: TestConfig) {
  console.log('\n📬 Testing: GET /api/ebay/[accountId]/messages');
  console.log('─'.repeat(60));

  try {
    const response = await fetch(
      `${BASE_URL}/api/ebay/${config.accountId}/messages?limit=5&includeBody=true`,
      {
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      console.log(`Total messages: ${data.data.total}`);
      console.log(`Messages returned: ${data.data.messages.length}`);

      if (data.data.messages.length > 0) {
        console.log('\nFirst message:');
        const msg = data.data.messages[0];
        console.log(`  ID: ${msg.messageId}`);
        console.log(`  Type: ${msg.messageType}`);
        console.log(`  Subject: ${msg.subject || 'N/A'}`);
        console.log(`  From: ${msg.sender || 'N/A'}`);
        console.log(`  Read: ${msg.read}`);
      }
    } else {
      console.log('❌ Error:', data.error || data.message);
    }

    return data;
  } catch (error) {
    console.log('❌ Request failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function testGetSingleMessage(config: TestConfig, messageId: string) {
  console.log('\n📨 Testing: GET /api/ebay/[accountId]/messages/[messageId]');
  console.log('─'.repeat(60));

  try {
    const response = await fetch(
      `${BASE_URL}/api/ebay/${config.accountId}/messages/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      console.log(`Message ID: ${data.data.messageId}`);
      console.log(`Subject: ${data.data.subject || 'N/A'}`);
      console.log(`Body: ${data.data.body?.substring(0, 100) || 'N/A'}...`);
    } else {
      console.log('❌ Error:', data.error || data.message);
    }

    return data;
  } catch (error) {
    console.log('❌ Request failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function testSendMessage(config: TestConfig) {
  console.log('\n📤 Testing: POST /api/ebay/[accountId]/messages');
  console.log('─'.repeat(60));

  const itemId = await prompt('Enter Item ID: ');
  const recipientId = await prompt('Enter Recipient Username: ');
  const body = await prompt('Enter message body: ');
  const subject = await prompt('Enter subject (optional): ');

  try {
    const response = await fetch(
      `${BASE_URL}/api/ebay/${config.accountId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          recipientId,
          body,
          subject: subject || undefined,
          questionType: 'General',
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Message sent successfully!');
    } else {
      console.log('❌ Error:', data.error || data.message);
    }

    return data;
  } catch (error) {
    console.log('❌ Request failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function testMarkAsRead(config: TestConfig, messageId: string) {
  console.log('\n✓ Testing: PATCH /api/ebay/[accountId]/messages/[messageId]');
  console.log('─'.repeat(60));

  try {
    const response = await fetch(
      `${BASE_URL}/api/ebay/${config.accountId}/messages/${messageId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          read: true,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Message marked as read!');
    } else {
      console.log('❌ Error:', data.error || data.message);
    }

    return data;
  } catch (error) {
    console.log('❌ Request failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function testOrderMessages(config: TestConfig) {
  console.log('\n📦 Testing: GET /api/ebay/[accountId]/orders/[orderId]/messages');
  console.log('─'.repeat(60));

  const orderId = await prompt('Enter Order ID: ');

  try {
    const response = await fetch(
      `${BASE_URL}/api/ebay/${config.accountId}/orders/${orderId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      console.log(`Order ID: ${data.data.orderId}`);
      console.log(`Buyer: ${data.data.buyer}`);
      console.log(`Total Items: ${data.data.totalItems}`);
      console.log(`Items with messages: ${data.data.itemMessages.length}`);
    } else {
      console.log('❌ Error:', data.error || data.message);
    }

    return data;
  } catch (error) {
    console.log('❌ Request failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  eBay Messaging API Test Script');
  console.log('═'.repeat(60));

  // Get configuration
  console.log('\n📋 Configuration');
  console.log('─'.repeat(60));

  const token = await prompt('Enter your auth token: ');
  const accountId = await prompt('Enter eBay account ID: ');

  const config: TestConfig = { token, accountId };

  // Main menu
  let running = true;
  while (running) {
    console.log('\n\n📌 Available Tests:');
    console.log('─'.repeat(60));
    console.log('1. Get Messages (list)');
    console.log('2. Get Single Message');
    console.log('3. Send Message');
    console.log('4. Mark Message as Read');
    console.log('5. Get Order Messages');
    console.log('6. Run All Tests (read-only)');
    console.log('0. Exit');
    console.log('─'.repeat(60));

    const choice = await prompt('\nSelect test (0-6): ');

    switch (choice) {
      case '1':
        await testGetMessages(config);
        break;

      case '2': {
        const messageId = await prompt('Enter Message ID: ');
        await testGetSingleMessage(config, messageId);
        break;
      }

      case '3':
        await testSendMessage(config);
        break;

      case '4': {
        const messageId = await prompt('Enter Message ID: ');
        await testMarkAsRead(config, messageId);
        break;
      }

      case '5':
        await testOrderMessages(config);
        break;

      case '6':
        console.log('\n🚀 Running all read-only tests...\n');
        const messagesData = await testGetMessages(config);

        if (messagesData?.data?.messages?.length > 0) {
          const firstMessageId = messagesData.data.messages[0].messageId;
          await testGetSingleMessage(config, firstMessageId);
        }

        console.log('\n✅ All read-only tests completed!');
        break;

      case '0':
        running = false;
        break;

      default:
        console.log('❌ Invalid choice');
    }

    if (running && choice !== '0') {
      await prompt('\nPress Enter to continue...');
    }
  }

  console.log('\n👋 Goodbye!\n');
  rl.close();
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  rl.close();
  process.exit(1);
});
