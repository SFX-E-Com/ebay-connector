import { NextRequest, NextResponse } from 'next/server';
import { EbayAccountService } from '../../../../lib/services/ebayAccountService';
import { EbayListingService } from '../../../../lib/services/ebay-listing';

// POST /api/ebay/[accountId]/inventory-group - Create inventory item group for variations
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;

  try {
    const body = await request.json();
    const { inventoryItemGroupKey, aspects, title, description, imageUrls, variantSKUs } = body;

    if (!inventoryItemGroupKey || !variantSKUs || variantSKUs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'inventoryItemGroupKey and variantSKUs are required',
        },
        { status: 400 }
      );
    }

    // Get the eBay account
    const account = await EbayAccountService.getAccountById(accountId);

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message: 'eBay account not found',
        },
        { status: 404 }
      );
    }

    // const ebayService = new EbayListingService(account); // Not needed for direct API call

    // Create the inventory item group
    const groupData = {
      inventoryItemGroupKey,
      aspects: aspects || {},
      title: title || 'Product Group',
      description: description || '',
      imageUrls: imageUrls || [],
      variantSKUs: variantSKUs, // Array of SKUs that are variations
      variesBy: {
        specifications: [
          // Define what varies (e.g., Color, Size)
          // This should be passed in the request based on your needs
          { name: 'Color' },
          { name: 'Size' }
        ]
      }
    };

    console.log(`[INVENTORY GROUP] Creating group: ${inventoryItemGroupKey} with ${variantSKUs.length} variants`);

    // Create inventory item group using the service
    // Note: This requires a public method in EbayListingService
    // For now, we'll make a direct API call
    const response = await fetch(`https://api.${process.env.EBAY_SANDBOX === 'true' ? 'sandbox.' : ''}ebay.com/sell/inventory/v1/inventory_item_group/${inventoryItemGroupKey}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Language': 'en-US',
        'Accept-Language': 'en-US'
      },
      body: JSON.stringify(groupData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`eBay API error: ${error}`);
    }

    const responseData = response.status === 204 ? {} : await response.json();

    return NextResponse.json({
      success: true,
      message: `Inventory group ${inventoryItemGroupKey} created with ${variantSKUs.length} variations`,
      data: responseData,
      metadata: {
        account_used: account.friendlyName || account.ebayUsername,
        account_id: accountId,
        environment: process.env.EBAY_SANDBOX === 'true' ? 'sandbox' : 'production'
      }
    });

  } catch (error: any) {
    console.error('[INVENTORY GROUP] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create inventory item group',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// Example: Create multiple variations with different SKUs but same base product
// POST /api/ebay/[accountId]/bulk-variations - Create multiple variations at once
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  const { accountId } = await params;

  try {
    const body = await request.json();
    const { baseSKU, variations, commonData } = body;

    if (!baseSKU || !variations || variations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'baseSKU and variations are required',
        },
        { status: 400 }
      );
    }

    // Get the eBay account
    const account = await EbayAccountService.getAccountById(accountId);

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message: 'eBay account not found',
        },
        { status: 404 }
      );
    }

    const ebayService = new EbayListingService(account);
    const createdItems = [];

    // Create each variation as a separate inventory item
    for (const variation of variations) {
      const sku = `${baseSKU}-${variation.suffix}`;

      const inventoryItem = {
        sku: sku,
        product: {
          title: `${commonData.title} - ${variation.name}`,
          description: commonData.description,
          imageUrls: commonData.imageUrls || [],
          aspects: {
            ...commonData.aspects,
            ...variation.aspects // Variation-specific aspects (e.g., Color: "Red", Size: "Large")
          }
        },
        condition: commonData.condition || 'NEW',
        availability: {
          shipToLocationAvailability: {
            quantity: variation.quantity || 1
          }
        }
      };

      try {
        console.log(`[BULK VARIATIONS] Creating variation: ${sku}`);
        await ebayService.createOrUpdateInventoryItem(inventoryItem);
        createdItems.push({
          sku,
          success: true,
          variation: variation.name
        });
      } catch (error: any) {
        createdItems.push({
          sku,
          success: false,
          error: error.message,
          variation: variation.name
        });
      }
    }

    const successCount = createdItems.filter(item => item.success).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Created ${successCount} out of ${variations.length} variations`,
      data: {
        baseSKU,
        variations: createdItems,
        summary: {
          total: variations.length,
          succeeded: successCount,
          failed: variations.length - successCount
        }
      },
      metadata: {
        account_used: account.friendlyName || account.ebayUsername,
        account_id: accountId,
        environment: process.env.EBAY_SANDBOX === 'true' ? 'sandbox' : 'production'
      }
    });

  } catch (error: any) {
    console.error('[BULK VARIATIONS] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create variations',
        error: error.message
      },
      { status: 500 }
    );
  }
}