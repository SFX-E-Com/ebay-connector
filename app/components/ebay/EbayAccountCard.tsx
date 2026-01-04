'use client';

import { Card, Badge, Button, Form } from 'react-bootstrap';
import { MdDelete, MdEdit, MdContentCopy } from 'react-icons/md';
import { FiUser, FiTag } from 'react-icons/fi';
import { EbayAccount } from '@/app/hooks/useEbayAccounts';

interface EbayAccountCardProps {
  account: EbayAccount;
  onView?: (account: EbayAccount) => void;
  onConnect?: (accountId: string) => void;
  onToggleStatus?: (accountId: string, isActive: boolean) => void;
  onDelete?: (accountId: string) => void;
  onEdit?: (account: EbayAccount) => void;
  isDisabled?: boolean;
  isConnecting?: boolean;
  isDeleting?: boolean;
}

export default function EbayAccountCard({
  account,
  onView,
  onConnect,
  onToggleStatus,
  onDelete,
  onEdit,
  isDisabled = false,
  isConnecting = false,
  isDeleting = false,
}: EbayAccountCardProps) {
  const isActive = account.status === 'active';
  const isExpired = new Date(account.expiresAt) < new Date();
  const environment = account.environment || 'production';

  // Determine if this account has ever been connected to eBay
  const hasBeenConnected = account.ebayUserId &&
                           account.lastUsedAt &&
                           !account.ebayUserId.startsWith('placeholder_');
  const isFirstTimeConnection = !hasBeenConnected;

  const displayName = account.friendlyName || account.ebayUsername || account.ebayUserId;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card
      className={`h-100 shadow ebay-account-card ${isDisabled ? 'disabled' : ''}`}
      style={{
        width: '380px',
        height: '420px',
        borderRadius: '16px',
        cursor: 'pointer',
        opacity: isDisabled ? 0.7 : 1,
      }}
      onClick={() => onView?.(account)}
    >
      <Card.Body className="p-4 d-flex flex-column h-100">
        <div className="d-flex flex-column gap-3 flex-grow-1">
          {/* Top Content */}
          <div className="d-flex flex-column gap-3 flex-grow-1">
            {/* Header Section */}
            <div>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex flex-column gap-1">
                  <h5
                    className={`mb-0 fw-semibold ${isDisabled ? 'text-muted' : ''}`}
                    style={{
                      letterSpacing: '-0.025em',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {displayName}
                  </h5>
                  {account.friendlyName && account.ebayUsername && (
                    <div className="d-flex align-items-center gap-1">
                      <FiUser className="text-secondary" size={14} />
                      <small className="text-secondary font-monospace text-truncate">
                        @{account.ebayUsername}
                      </small>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#198754' : '#dee2e6',
                    flexShrink: 0,
                  }}
                  role="status"
                  aria-label={isActive ? 'Account is active' : 'Account is inactive'}
                  title={isActive ? 'Active' : 'Inactive'}
                />
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white p-3 rounded-3 border">
              <div className="d-flex justify-content-between">
                <div className="d-flex flex-column gap-1">
                  <small className="text-secondary fw-medium text-uppercase">
                    Environment
                  </small>
                  <Badge
                    bg={environment === 'production' ? 'success' : 'warning'}
                    className="rounded-2"
                  >
                    {environment.toUpperCase()}
                  </Badge>
                </div>

                <div className="d-flex flex-column align-items-center gap-1">
                  <small className="text-secondary fw-medium text-uppercase">
                    Status
                  </small>
                  <Badge
                    bg={isActive ? 'success' : 'secondary'}
                    className="rounded-2"
                  >
                    {isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                {isExpired && (
                  <div className="d-flex flex-column align-items-end gap-1">
                    <small className="text-secondary fw-medium text-uppercase">
                      Token
                    </small>
                    <Badge bg="danger" className="rounded-2">
                      Expired
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Account Details */}
            <div className="d-flex flex-column gap-2">
              {/* Account ID Row */}
              <div className="d-flex align-items-start gap-2">
                <FiTag className="text-success mt-1" size={14} />
                <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
                  <small className="text-secondary fw-medium">
                    Account ID
                  </small>
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <small className="font-monospace fw-medium text-truncate flex-grow-1">
                      {account.id}
                    </small>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(account.id);
                      }}
                      aria-label="Copy account ID"
                    >
                      <MdContentCopy size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="d-flex flex-column gap-2 mt-auto">
            <Button
              variant={isFirstTimeConnection ? 'warning' : 'primary'}
              size="sm"
              className="w-100 rounded-3"
              disabled={isDisabled || isConnecting}
              onClick={(e) => {
                e.stopPropagation();
                onConnect?.(account.id);
              }}
            >
              {isConnecting
                ? (isFirstTimeConnection ? 'Connecting...' : 'Reconnecting...')
                : (isFirstTimeConnection ? 'Connect Account' : 'Reconnect Account')
              }
            </Button>

            <div className="d-flex justify-content-between w-100">
              {hasBeenConnected ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <Form.Check
                    type="switch"
                    id={`status-switch-${account.id}`}
                    label={isActive ? 'Active' : 'Inactive'}
                    checked={isActive}
                    onChange={(e) => onToggleStatus?.(account.id, e.target.checked)}
                    className="small fw-medium"
                  />
                </div>
              ) : (
                <div />
              )}

              <div className="d-flex gap-1">
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(account);
                  }}
                  aria-label="Edit account"
                >
                  <MdEdit size={18} />
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className="text-danger p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(account.id);
                  }}
                  disabled={isDeleting}
                  aria-label="Delete account"
                >
                  <MdDelete size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
