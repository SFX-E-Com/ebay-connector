'use client';

import { Modal, Badge, Button } from 'react-bootstrap';
import { FiGlobe, FiUser, FiClock, FiTag, FiShield, FiCalendar } from 'react-icons/fi';
import { EbayAccount } from '@/app/hooks/useEbayAccounts';
import { EBAY_OAUTH_SCOPES, SCOPE_CATEGORIES } from '@/app/lib/constants/ebayScopes';
import EbayScopeCategory from './scope/EbayScopeCategory';
import { useState } from 'react';

interface EbayAccountViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: EbayAccount | null;
}

export default function EbayAccountViewModal({
  isOpen,
  onClose,
  account,
}: EbayAccountViewModalProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  if (!account) return null;

  const handleCategoryToggle = (categoryKey: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryKey)
        ? prev.filter(cat => cat !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const isActive = account.status === 'active';
  const isExpired = new Date(account.expiresAt) < new Date();
  const environment = process.env.NEXT_PUBLIC_EBAY_SANDBOX === 'true' ? 'sandbox' : 'production';

  // Safely parse scopes and tags
  const scopeIds = Array.isArray(account.userSelectedScopes)
    ? account.userSelectedScopes
    : typeof account.userSelectedScopes === 'string'
      ? (account.userSelectedScopes ? JSON.parse(account.userSelectedScopes) : [])
      : [];

  const tags = Array.isArray(account.tags)
    ? account.tags
    : typeof account.tags === 'string'
      ? (account.tags ? JSON.parse(account.tags) : [])
      : [];

  // Get scope objects from IDs
  const accountScopes = EBAY_OAUTH_SCOPES.filter(scope => scopeIds.includes(scope.id));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>eBay Account Details</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="d-flex flex-column gap-4">
          {/* Account Header */}
          <div>
            <h4 className="mb-2">
              {account.friendlyName || account.ebayUsername || account.ebayUserId}
            </h4>

            {/* Status Badges */}
            <div className="d-flex gap-2 flex-wrap">
              <Badge
                bg={environment === 'production' ? 'success' : 'warning'}
              >
                {environment.toUpperCase()}
              </Badge>

              {account.ebayUsername && (
                <Badge bg="success">
                  AUTO-AUTH
                </Badge>
              )}

              <Badge
                bg={isActive ? 'success' : 'secondary'}
              >
                {isActive ? 'Active' : 'Disabled'}
              </Badge>

              {isExpired && (
                <Badge bg="danger" className="border border-danger">
                  Expired
                </Badge>
              )}
            </div>
          </div>

          <hr className="my-0" />

          {/* Account Information */}
          <div className="d-flex flex-column gap-3">
            <h5 className="text-secondary mb-0">Account Information</h5>

            <div className="d-flex flex-column gap-2 small">
              {account.friendlyName && (
                <div className="d-flex align-items-center gap-2">
                  <FiTag className="text-secondary" />
                  <span className="fw-medium text-secondary" style={{ minWidth: '120px' }}>
                    Friendly Name:
                  </span>
                  <span className="fw-semibold">
                    {account.friendlyName}
                  </span>
                </div>
              )}

              <div className="d-flex align-items-center gap-2">
                <FiGlobe className="text-secondary" />
                <span className="fw-medium text-secondary" style={{ minWidth: '120px' }}>
                  eBay User ID:
                </span>
                <span className="font-monospace">
                  {account.ebayUserId}
                </span>
              </div>

              {account.ebayUsername && (
                <div className="d-flex align-items-center gap-2">
                  <FiUser className="text-secondary" />
                  <span className="fw-medium text-secondary" style={{ minWidth: '120px' }}>
                    Username:
                  </span>
                  <span className="font-monospace">
                    {account.ebayUsername}
                  </span>
                </div>
              )}

              <div className="d-flex align-items-center gap-2">
                <FiShield className="text-secondary" />
                <span className="fw-medium text-secondary" style={{ minWidth: '120px' }}>
                  Token Type:
                </span>
                <span>
                  {account.tokenType}
                </span>
              </div>
            </div>
          </div>

          <hr className="my-0" />

          {/* Timestamps */}
          <div className="d-flex flex-column gap-3">
            <h5 className="text-secondary mb-0">Timeline</h5>

            <div className="d-flex flex-column gap-2 small">
              <div className="d-flex align-items-center gap-2">
                <FiCalendar className="text-secondary" />
                <span className="fw-medium text-secondary" style={{ minWidth: '120px' }}>
                  Connected:
                </span>
                <span>
                  {formatDate(account.createdAt)}
                </span>
              </div>

              {account.lastUsedAt && (
                <div className="d-flex align-items-center gap-2">
                  <FiClock className="text-secondary" />
                  <span className="fw-medium text-secondary" style={{ minWidth: '120px' }}>
                    Last Used:
                  </span>
                  <span>
                    {formatDate(account.lastUsedAt)}
                  </span>
                </div>
              )}

              <div className="d-flex align-items-center gap-2">
                <FiCalendar className={isExpired ? 'text-danger' : 'text-secondary'} />
                <span className="fw-medium text-secondary" style={{ minWidth: '120px' }}>
                  Expires:
                </span>
                <span className={isExpired ? 'text-danger fw-semibold' : ''}>
                  {formatDate(account.expiresAt)}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <FiClock className="text-secondary" />
                <span className="fw-medium text-secondary" style={{ minWidth: '120px' }}>
                  Updated:
                </span>
                <span>
                  {formatDate(account.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          <hr className="my-0" />

          {/* Scopes */}
          <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="text-secondary mb-0">Permissions & Scopes</h5>
              <Badge
                bg={accountScopes.length > 0 ? 'primary' : 'secondary'}
              >
                {accountScopes.length} permissions granted
              </Badge>
            </div>

            {accountScopes.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {Object.keys(SCOPE_CATEGORIES).map((categoryKey) => (
                  <EbayScopeCategory
                    key={categoryKey}
                    categoryKey={categoryKey}
                    isExpanded={expandedCategories.includes(categoryKey)}
                    onToggle={() => handleCategoryToggle(categoryKey)}
                    selectedScopes={scopeIds}
                    onScopeToggle={() => {}} // Read-only mode
                    disabled={true}
                  />
                ))}
              </div>
            ) : (
              <div className="p-3 bg-white rounded border">
                <div className="d-flex align-items-center gap-2">
                  <FiShield className="text-secondary" />
                  <span className="small text-muted fst-italic">
                    No specific scopes granted - Basic access only
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <>
              <hr className="my-0" />
              <div className="d-flex flex-column gap-3">
                <h5 className="text-secondary mb-0">Tags</h5>
                <div className="d-flex gap-2 flex-wrap">
                  {tags.map((tag: string, index: number) => (
                    <Badge key={index} bg="warning" text="dark" className="border border-warning">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
