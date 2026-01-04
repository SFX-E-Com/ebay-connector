'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Badge, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdContentCopy,
} from 'react-icons/md';
import { Table, TableAction, TableRef } from '@/app/components/table';
import { TableColumn } from '@/app/components/table/DataTable';
import { FilterConfig } from '@/app/hooks/useFilters';
import ApiTokenModal from '@/app/components/modals/ApiTokenModal';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  permissions: {
    endpoints?: string[];
    rateLimit?: number;
  };
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ApiTokensPage() {
  const router = useRouter();

  // Table ref for refetching data
  const tableRef = useRef<TableRef>(null);

  // UI states
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [showFullTokens, _setShowFullTokens] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
    }
  }, [router]);

  // Utility functions
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusBadge = (token: ApiToken) => {
    if (!token.isActive) {
      return <Badge bg="secondary">Inactive</Badge>;
    }

    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return <Badge bg="danger">Expired</Badge>;
    }

    return <Badge bg="success">Active</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Handle creating new token
  const handleCreateToken = async (data: any) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Show the newly created token
        setNewlyCreatedToken(result.data.token);
        setShowCreateModal(false);

        // Trigger table refresh to show the new token
        if (tableRef.current) {
          await tableRef.current.refetch();
        }
      } else {
        console.error('Failed to create token:', result.message);
      }
    } catch (error) {
      console.error('Error creating token:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Table column configuration (without actions - they're handled by the Table component now)
  const columns: TableColumn<ApiToken>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (token) => (
        <div>
          <div className="fw-medium">{token.name}</div>
          <div className="small text-muted">
            Created {formatDate(token.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'token',
      header: 'Token',
      render: (token) => (
        <div className="d-flex gap-2 align-items-center">
          <code className="small" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {showFullTokens[token.id] ? token.token : `${token.token.substring(0, 20)}...`}
          </code>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (token) => getStatusBadge(token),
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (token) => (
        <div>
          <p className="small mb-0">{token.permissions.endpoints?.length || 0} endpoints</p>
          <small className="text-muted">
            Rate limit: {token.permissions.rateLimit || 1000}/hour
          </small>
        </div>
      ),
    },
    {
      key: 'lastUsedAt',
      header: 'Last Used',
      sortable: true,
      render: (token) => (
        <span className="small">{formatDate(token.lastUsedAt)}</span>
      ),
    },
  ];

  // Table actions configuration - this is where the magic happens!
  const actions: TableAction<ApiToken>[] = [
    {
      key: 'edit',
      label: 'Edit token',
      icon: MdEdit,
      type: 'edit',
      modalComponent: ApiTokenModal,
      editEndpoint: '/api/tokens/{id}',
      variant: 'ghost',
    },
    {
      key: 'status',
      label: 'Toggle status',
      type: 'switch',
      statusEndpoint: '/api/tokens/{id}/status',
      statusField: 'isActive',
      activeLabel: 'Deactivate',
      inactiveLabel: 'Activate',
      itemNameField: 'name',
    },
    {
      key: 'delete',
      label: 'Delete token',
      icon: MdDelete,
      type: 'delete',
      deleteEndpoint: '/api/tokens/{id}',
      itemNameField: 'name',
      variant: 'ghost',
      colorPalette: 'red',
    },
  ];

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      label: 'Name',
      type: 'search',
      placeholder: 'Search tokens by name...',
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      placeholder: 'All Status',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' }
      ],
    },
  ];

  // Header actions
  const headerActions = (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id="tooltip-create">Create a new API token for accessing the eBay Connector API</Tooltip>}
    >
      <Button variant="primary" onClick={() => setShowCreateModal(true)}>
        <MdAdd style={{ marginRight: '8px' }} />
        Create Token
      </Button>
    </OverlayTrigger>
  );

  return (
    <div className="p-4 p-md-5">
      <div className="d-flex flex-column gap-4">
        {/* New Token Alert */}
        {newlyCreatedToken && (
          <Alert variant="success" dismissible onClose={() => setNewlyCreatedToken(null)}>
            <Alert.Heading>Token Created Successfully!</Alert.Heading>
            <div className="d-flex flex-column gap-2 mt-2">
              <p className="small mb-0">
                Your new API token has been created. Copy it now as it won't be shown again:
              </p>
              <div className="d-flex gap-2 align-items-center">
                <code
                  className="p-2 bg-light rounded small"
                  style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                >
                  {newlyCreatedToken}
                </code>
                <Button
                  aria-label="Copy token"
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => copyToClipboard(newlyCreatedToken)}
                >
                  <MdContentCopy />
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {/* Unified Table Component with Built-in Actions */}
        <Table
          ref={tableRef}
          endpoint="/api/tokens"
          title="API Token Management"
          description="Create and manage API tokens for accessing the eBay Connector API"
          columns={columns}
          actions={actions}
          filterConfigs={filterConfigs}
          headerActions={headerActions}
          initialPageSize={25}
          pageSizeOptions={[10, 25, 50, 100]}
        />

        {/* Create Token Modal */}
        {showCreateModal && (
          <ApiTokenModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateToken}
            isSubmitting={isCreating}
          />
        )}
      </div>
    </div>
  );
}