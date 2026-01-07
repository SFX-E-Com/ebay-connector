'use client';

import { Modal, Badge, Button } from 'react-bootstrap';
import { FiGlobe, FiUser, FiClock, FiTag, FiShield, FiCalendar } from 'react-icons/fi';
import { EbayAccount } from '@/app/hooks/useEbayAccounts';
import { EBAY_OAUTH_SCOPES } from '@/app/lib/constants/ebayScopes';

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
  if (!account) return null;

  const isActive = account.status === 'active';
  const isExpired = new Date(account.expiresAt) < new Date();
  const environment = account.environment || 'production';

  const parseArray = (value: string[] | string | undefined): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const grantedScopes = parseArray(account.scopes);
  const tags = parseArray(account.tags);

  const grantedScopeCount = grantedScopes.length;

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

          {/* Granted Scopes (Read-Only) */}
          <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="text-secondary mb-0">Granted Permissions</h5>
              <Badge bg={grantedScopeCount > 0 ? 'success' : 'secondary'}>
                {grantedScopeCount} from eBay
              </Badge>
            </div>

            {grantedScopeCount > 0 ? (
              <div className="d-flex flex-column gap-2">
                {grantedScopes.map((scope, index) => {
                  const scopeInfo = EBAY_OAUTH_SCOPES.find(s => s.url === scope || s.id === scope);
                  const displayName = scopeInfo?.name || scope.split('/').pop() || scope;
                  return (
                    <div key={index} className="d-flex align-items-center gap-2 p-2 bg-light rounded small">
                      <FiShield className="text-success" />
                      <span>{displayName}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-light rounded border">
                <div className="d-flex align-items-center gap-2">
                  <FiShield className="text-secondary" />
                  <span className="small text-muted fst-italic">
                    No scopes granted yet - Connect account to grant permissions
                  </span>
                </div>
              </div>
            )}

            <p className="small text-muted mb-0">
              These permissions were granted by eBay during OAuth. To change permissions, reconnect the account.
            </p>
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
