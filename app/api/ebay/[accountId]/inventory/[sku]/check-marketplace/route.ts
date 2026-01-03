import { NextRequest, NextResponse } from 'next/server';
import { EbayAccountService } from '../../../../../../lib/services/ebayAccountService';

// GET /api/ebay/[accountId]/inventory/[sku]/check-marketplace - Check inventory item availability across marketplaces
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string; sku: string }> }
): Promise<NextResponse> {
  const { accountId, sku } = await params;

  try {
    console.log(`[CHECK MARKETPLACE API] Checking SKU ${sku} across marketplaces`);

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

    const baseUrl = `https://api.${process.env.EBAY_SANDBOX === 'true' ? 'sandbox.' : ''}ebay.com/sell/inventory/v1`;

    // Test different marketplaces with their proper locales
    const marketplaces = [
      { id: 'EBAY_US', locale: 'en-US', currency: 'USD' },
      { id: 'EBAY_DE', locale: 'de-DE', currency: 'EUR' },
      { id: 'EBAY_GB', locale: 'en-GB', currency: 'GBP' },
      { id: 'EBAY_FR', locale: 'fr-FR', currency: 'EUR' },
      { id: 'EBAY_IT', locale: 'it-IT', currency: 'EUR' },
      { id: 'EBAY_ES', locale: 'es-ES', currency: 'EUR' },
      { id: 'EBAY_AU', locale: 'en-AU', currency: 'AUD' }
    ];

    const results: any = {
      sku,
      marketplaceAvailability: {},
      rawResponses: {}
    };

    // First, get the item without any marketplace header
    console.log('[CHECK MARKETPLACE API] Fetching without marketplace header...');
    try {
      const response = await fetch(`${baseUrl}/inventory_item/${encodeURIComponent(sku)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        results.defaultItem = {
          exists: true,
          locale: data.locale,
          product: data.product?.title,
          availability: data.availability,
          condition: data.condition
        };
        console.log('[CHECK MARKETPLACE API] Default item locale:', data.locale);
      } else {
        results.defaultItem = { exists: false };
        console.log('[CHECK MARKETPLACE API] Default item Error:', response);
      }
    } catch (error: any) {
      console.error('[CHECK MARKETPLACE API] Error fetching default:', error.message);
      results.defaultItem = { error: error.message };
    }

    // Check each marketplace
    for (const marketplace of marketplaces) {
      console.log(`[CHECK MARKETPLACE API] Checking ${marketplace.id}...`);

      try {
        // Try to get the inventory item with marketplace header
        const invResponse = await fetch(`${baseUrl}/inventory_item/${encodeURIComponent(sku)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': marketplace.id
          }
        });

        const invStatus = invResponse.ok;
        let invData = null;
        if (invStatus) {
          invData = await invResponse.json();
        }

        // Try to create an offer (this is what actually fails)
        const offerResponse = await fetch(`${baseUrl}/offer`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': marketplace.id
          },
          body: JSON.stringify({
            sku: sku,
            marketplaceId: marketplace.id,
            format: 'FIXED_PRICE',
            categoryId: '9355',
            pricingSummary: {
              price: {
                value: '99.99',
                currency: marketplace.currency
              }
            },
            availableQuantity: 1,
            merchantLocationKey: 'DEFAULT_LOCATION'
          })
        });

        const offerStatus = offerResponse.status;
        let offerError = null;

        if (!offerResponse.ok) {
          const errorText = await offerResponse.text();
          try {
            const errorData = JSON.parse(errorText);
            offerError = errorData.errors?.[0]?.message || errorText;
          } catch {
            offerError = errorText;
          }
        }

        results.marketplaceAvailability[marketplace.id] = {
          inventoryItemAccessible: invStatus,
          inventoryLocale: invData?.locale,
          offerCreatable: offerStatus === 201 || offerStatus === 200,
          offerStatus: offerStatus,
          offerError: offerError
        };

        // If offer was created successfully, delete it to clean up
        if (offerStatus === 201 || offerStatus === 200) {
          const offerData = await offerResponse.json();
          if (offerData.offerId) {
            // Try to delete the test offer
            await fetch(`${baseUrl}/offer/${offerData.offerId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${account.accessToken}`,
                'X-EBAY-C-MARKETPLACE-ID': marketplace.id
              }
            });
          }
        }

      } catch (error: any) {
        console.error(`[CHECK MARKETPLACE API] Error checking ${marketplace.id}:`, error.message);
        results.marketplaceAvailability[marketplace.id] = {
          error: error.message
        };
      }
    }

    // Analyze results
    const availableMarketplaces = Object.entries(results.marketplaceAvailability)
      .filter(([_, status]: any) => status.offerCreatable)
      .map(([marketplace]) => marketplace);

    const problematicMarketplaces = Object.entries(results.marketplaceAvailability)
      .filter(([_, status]: any) => status.inventoryItemAccessible && !status.offerCreatable)
      .map(([marketplace]) => marketplace);

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        sku,
        defaultLocale: results.defaultItem?.locale,
        availableForOffers: availableMarketplaces,
        problematicMarketplaces: problematicMarketplaces,
        totalMarketplacesChecked: marketplaces.length,
        recommendation: problematicMarketplaces.includes('EBAY_DE')
          ? 'The inventory item exists but cannot create offers for EBAY_DE. This is eBay\'s marketplace synchronization issue.'
          : 'Item is available for offer creation in some marketplaces.'
      }
    });

  } catch (error: any) {
    console.error('[CHECK MARKETPLACE API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check marketplace availability',
        error: error.message,
      },
      { status: 500 }
    );
  }
}