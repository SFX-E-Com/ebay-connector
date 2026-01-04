'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Badge, Alert, Spinner, Form, Card } from 'react-bootstrap';
import {
  MdVisibility,
  MdSync,
} from 'react-icons/md';
import PageHeader from '@/app/components/common/PageHeader';
import axios from 'axios';
import { formatDateShort } from '@/app/lib/utils/date';

interface Product {
  itemId: string;
  title: string;
  sku?: string;
  currentPrice: string;
  currency: string;
  quantityAvailable: string;
  quantitySold?: string;
  sellingStatus: string;
  listingType: string;
  startTime: string;
  endTime?: string;
  pictureUrls?: string[];
}

interface PaginationInfo {
  pageNumber: number;
  entriesPerPage: number;
  totalPages: number;
  totalEntries: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    fetchAccounts();
  }, [router]);

  useEffect(() => {
    if (selectedAccount) {
      fetchProducts(currentPage);
    }
  }, [selectedAccount, currentPage]);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/ebay-accounts');
      if (response.data.success) {
        // Filter for active accounts - check isActive property
        const activeAccounts = response.data.data.filter((acc: any) => acc.isActive === true);
        setAccounts(response.data.data); // Show all accounts in dropdown
        console.log('Accounts:', response.data.data);
        console.log('Active accounts:', activeAccounts);

        // Select first active account by default, or first account if none are active
        if (activeAccounts.length > 0) {
          setSelectedAccount(activeAccounts[0].id);
        } else if (response.data.data.length > 0) {
          setSelectedAccount(response.data.data[0].id);
          setError('Your eBay accounts need to be reconnected to access the Trading API. Please go to eBay Accounts and reconnect.');
        } else {
          setError('No eBay accounts found. Please connect an account first.');
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch accounts');
      setLoading(false);
    }
  };

  const fetchProducts = async (page = 1) => {
    if (!selectedAccount) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.get(
        `/api/ebay/${selectedAccount}/legacy-listings?page=${page}&limit=${pageSize}`
      );

      if (response.data.success) {
        setProducts(response.data.data.items || []);
        setPagination(response.data.data.pagination);
      } else {
        setError(response.data.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch products';
      setError(errorMessage);

      // If token expired, show reconnection hint
      if (err.response?.data?.actionRequired === 'reconnect' || errorMessage.includes('expired')) {
        setError('Your eBay token has expired. Please go to eBay Accounts page and reconnect your account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProducts(currentPage);
    setIsRefreshing(false);
  };

  const handleViewProduct = (product: Product) => {
    // Open eBay listing in new tab
    if (product.itemId) {
      window.open(`https://www.ebay.com/itm/${product.itemId}`, '_blank');
    }
  };

  const handleMigrateProduct = async (product: Product) => {
    try {
      const response = await axios.post(`/api/ebay/${selectedAccount}/migrate-single`, {
        listingId: product.itemId
      });

      if (response.data.success) {
        alert(`Product migrated successfully! SKU: ${response.data.data.inventorySku}`);
      } else {
        alert(`Migration failed: ${response.data.message}`);
      }
    } catch (error: any) {
      alert(`Migration error: ${error.response?.data?.message || error.message}`);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' ||
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.itemId.includes(searchTerm) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && product.sellingStatus === 'Active') ||
      (statusFilter === 'completed' && product.sellingStatus === 'Completed') ||
      (statusFilter === 'ended' && product.sellingStatus === 'Ended');

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      'Active': 'success',
      'Completed': 'info',
      'Ended': 'secondary',
      'Sold': 'primary',
    };

    return (
      <Badge bg={colorMap[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-4 p-md-5">
      <div className="d-flex flex-column gap-4">
        {/* Page Header */}
        <PageHeader
          title="Products"
          subtitle="Manage your eBay product listings"
          showRefresh={true}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Account Selector and Filters */}
        <Card>
          <Card.Body>
            <div className="d-flex flex-wrap gap-3">
              {/* Account Selector */}
              <div style={{ flex: '1', minWidth: '200px' }}>
                <p className="small mb-2 text-muted">eBay Account</p>
                <Form.Select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  disabled={accounts.length === 0}
                >
                  <option value="">Select account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.friendlyName || account.ebayUsername}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/* Search */}
              <div style={{ flex: '1', minWidth: '250px' }}>
                <p className="small mb-2 text-muted">Search</p>
                <Form.Control
                  placeholder="Search by title, SKU, or item ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div style={{ minWidth: '150px' }}>
                <p className="small mb-2 text-muted">Status</p>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="ended">Ended</option>
                </Form.Select>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Results Summary */}
        {!loading && pagination && (
          <div className="d-flex justify-content-between">
            <p className="small text-muted mb-0">
              Showing {filteredProducts.length} of {pagination.totalEntries} products
              {searchTerm && ` (filtered)`}
            </p>
            {pagination.totalPages > 1 && (
              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <p className="small mb-0 align-self-center">
                  Page {pagination.pageNumber} of {pagination.totalPages}
                </p>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => {}}>
            <div className="d-flex flex-column gap-2">
              {error}
              {error.includes('expired') && (
                <Button
                  size="sm"
                  variant="info"
                  onClick={() => router.push('/ebay-connections')}
                >
                  Go to eBay Accounts
                </Button>
              )}
            </div>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="d-flex flex-column gap-3 align-items-center">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted">Loading products...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-5">
            <div className="d-flex flex-column gap-3 align-items-center">
              <p className="fs-5 fw-medium text-muted">
                {searchTerm ? 'No products match your search' : 'No products found'}
              </p>
              <p className="text-muted">
                {selectedAccount
                  ? 'Your eBay products will appear here once they are listed'
                  : 'Please select an eBay account to view products'
                }
              </p>
            </div>
          </div>
        )}

        {/* Products Table */}
        {!loading && !error && filteredProducts.length > 0 && (
          <Card>
            <Card.Body className="p-0">
              <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Item ID</th>
                      <th>Title</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Started</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.itemId}>
                        <td>
                          <span className="small font-monospace">
                            {product.itemId}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <span className="small fw-medium" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {product.title}
                            </span>
                            {product.pictureUrls && product.pictureUrls[0] && (
                              <img
                                src={product.pictureUrls[0]}
                                alt={product.title}
                                style={{
                                  height: '40px',
                                  width: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '6px'
                                }}
                              />
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="small">
                            {product.sku || '-'}
                          </span>
                        </td>
                        <td>
                          <span className="small fw-medium">
                            {product.currency} {product.currentPrice}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="small">
                              Available: {product.quantityAvailable}
                            </span>
                            {product.quantitySold && (
                              <span className="small text-muted">
                                Sold: {product.quantitySold}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {getStatusBadge(product.sellingStatus)}
                        </td>
                        <td>
                          <Badge bg="secondary" className="text-white">
                            {product.listingType}
                          </Badge>
                        </td>
                        <td>
                          <span className="small">
                            {formatDateShort(product.startTime)}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex justify-content-center gap-1">
                            <Button
                              aria-label="View on eBay"
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => handleViewProduct(product)}
                            >
                              <MdVisibility />
                            </Button>
                            <Button
                              aria-label="Migrate to Inventory API"
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => handleMigrateProduct(product)}
                              title="Migrate to Inventory API"
                            >
                              <MdSync />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
}