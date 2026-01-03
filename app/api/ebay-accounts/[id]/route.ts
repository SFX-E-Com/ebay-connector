import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '../../../lib/services/auth';
import { EbayAccountService } from '../../../lib/services/ebayAccountService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const decoded = TokenService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Await params and fetch specific eBay account
    const { id } = await params;
    const ebayAccount = await EbayAccountService.getAccountById(id);

    if (!ebayAccount || ebayAccount.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'eBay account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ebayAccount,
    });
  } catch (error) {
    console.error('Error fetching eBay account:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const decoded = TokenService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const updateData = await request.json();

    // Await params and verify ownership
    const { id } = await params;
    const existingAccount = await EbayAccountService.getAccountById(id);

    if (!existingAccount || existingAccount.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'eBay account not found' },
        { status: 404 }
      );
    }

    // Process update data
    const processedData: Record<string, unknown> = {};

    if (updateData.friendlyName !== undefined) {
      processedData.friendlyName = updateData.friendlyName;
    }
    if (updateData.status !== undefined) {
      processedData.status = updateData.status;
    }
    if (updateData.tags !== undefined) {
      processedData.tags = updateData.tags;
    }
    if (updateData.selectedScopes !== undefined) {
      processedData.userSelectedScopes = updateData.selectedScopes;
    }
    if (updateData.userSelectedScopes !== undefined) {
      processedData.userSelectedScopes = updateData.userSelectedScopes;
    }

    // Update eBay account
    const updatedAccount = await EbayAccountService.updateAccount(id, processedData);

    return NextResponse.json({
      success: true,
      message: 'eBay account updated successfully',
      data: updatedAccount,
    });
  } catch (error) {
    console.error('Error updating eBay account:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const decoded = TokenService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Await params and delete eBay account
    const { id } = await params;
    const deleted = await EbayAccountService.deleteAccount(id, decoded.userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'eBay account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'eBay account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting eBay account:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}