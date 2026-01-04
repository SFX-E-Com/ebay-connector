'use client';

import { useState } from 'react';
import { Spinner, Row, Col } from 'react-bootstrap';
import { useFilters, FilterConfig } from '@/app/hooks/useFilters';
import { usePagination } from '@/app/hooks/usePagination';
import { FilterBar } from '@/app/components/table/FilterBar';
import { Pagination } from '@/app/components/table/Pagination';
import EbayAccountCard from './EbayAccountCard';
import EbayAccountViewModal from './EbayAccountViewModal';
import { EbayAccount } from '@/app/hooks/useEbayAccounts';

interface EbayAccountsListViewProps {
  accounts: EbayAccount[];
  loading?: boolean;
  onView?: (account: EbayAccount) => void;
  onConnect?: (accountId: string) => void;
  onToggleStatus?: (accountId: string, isActive: boolean) => void;
  onDelete?: (accountId: string) => void;
  onEdit?: (account: EbayAccount) => void;
  isConnecting?: Record<string, boolean>;
  isDeleting?: Record<string, boolean>;
}

export default function EbayAccountsListView({
  accounts,
  loading = false,
  onView,
  onConnect,
  onToggleStatus,
  onDelete,
  onEdit,
  isConnecting = {},
  isDeleting = {},
}: EbayAccountsListViewProps) {
  const [selectedAccount, setSelectedAccount] = useState<EbayAccount | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Search',
      placeholder: 'Search accounts...',
      searchFields: ['friendlyName', 'ebayUsername', 'ebayUserId']
    },
    {
      key: 'status',
      type: 'select',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      key: 'environment',
      type: 'select',
      label: 'Environment',
      options: [
        { value: 'production', label: 'Production' },
        { value: 'sandbox', label: 'Sandbox' }
      ]
    },
    {
      key: 'hasExpired',
      type: 'boolean',
      label: 'Expired',
    },
  ];

  const enhancedAccounts = accounts.map(account => ({
    ...account,
    environment: typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_EBAY_SANDBOX === 'true' ? 'sandbox' : 'production')
      : 'production',
    hasExpired: new Date(account.expiresAt) < new Date()
  }));

  const {
    filteredData,
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters
  } = useFilters(enhancedAccounts, filterConfigs);

  const {
    paginatedData,
    pagination,
    goToPage,
    setPageSize
  } = usePagination(filteredData, {
    initialPageSize: 12,
    pageSizeOptions: [6, 12, 24, 48]
  });

  const handleView = (account: EbayAccount) => {
    setSelectedAccount(account);
    setIsViewModalOpen(true);
    onView?.(account);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedAccount(null);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={setFilter}
        onClearFilter={clearFilter}
        onClearAllFilters={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
        showFilterCount={true}
      />

      {/* Results Summary */}
      <div>
        <p className="small text-muted mb-0">
          Showing {pagination.totalItems} account{pagination.totalItems !== 1 ? 's' : ''}
          {hasActiveFilters && ` (filtered from ${accounts.length} total)`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="d-flex flex-column gap-3 align-items-center">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted">Loading accounts...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && paginatedData.length === 0 && (
        <div className="text-center py-5">
          <div className="d-flex flex-column gap-3 align-items-center">
            <p className="fs-5 fw-medium text-muted">
              {hasActiveFilters ? 'No accounts match your filters' : 'No eBay accounts found'}
            </p>
            <p className="text-muted">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or clearing filters'
                : 'Connect your first eBay account to get started'
              }
            </p>
          </div>
        </div>
      )}

      {/* Account Cards Grid */}
      {!loading && paginatedData.length > 0 && (
        <Row className="g-4">
          {paginatedData.map((account) => (
            <Col key={account.id} xs={12} md={6} lg={4} xl={3}>
              <EbayAccountCard
                account={account}
                onView={handleView}
                onConnect={onConnect}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
                onEdit={onEdit}
                isConnecting={isConnecting[account.id]}
                isDeleting={isDeleting[account.id]}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={goToPage}
          onPageSizeChange={setPageSize}
          showPageSizeSelector={true}
          showPageInfo={true}
          showNavButtons={true}
        />
      )}

      {/* View Modal */}
      <EbayAccountViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        account={selectedAccount}
      />
    </div>
  );
}
