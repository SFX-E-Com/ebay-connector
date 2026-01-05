'use client';

import { Modal, Form, Button, Badge, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import EbayScopeSelector from './EbayScopeSelector';
import { EbayAccount } from '@/app/hooks/useEbayAccounts';
import { DEFAULT_SCOPES, EBAY_OAUTH_SCOPES } from '@/app/lib/constants/ebayScopes';

interface EditEbayAccountFormData {
  friendlyName: string;
  tags: string[];
  ebayUsername?: string;
  selectedScopes: string[];
  status: 'active' | 'disabled';
}

interface EditEbayAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditEbayAccountFormData) => void;
  isSubmitting: boolean;
  account: EbayAccount | null;
}

export default function EditEbayAccountModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  account,
}: EditEbayAccountModalProps) {
  const [formData, setFormData] = useState<EditEbayAccountFormData>({
    friendlyName: '',
    tags: [],
    ebayUsername: '',
    selectedScopes: [],
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (account && isOpen) {
      // Parse JSON fields safely
      const parseTags = (tags: any): string[] => {
        if (Array.isArray(tags)) return tags;
        if (typeof tags === 'string') {
          try {
            const parsed = JSON.parse(tags);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      const parseScopes = (scopes: any): string[] => {
        let parsedScopes: string[] = [];

        if (Array.isArray(scopes)) {
          parsedScopes = scopes;
        } else if (typeof scopes === 'string') {
          try {
            const parsed = JSON.parse(scopes);
            parsedScopes = Array.isArray(parsed) ? parsed : [];
          } catch {
            parsedScopes = [];
          }
        }

        // Convert URLs to scope IDs using EBAY_OAUTH_SCOPES mapping
        const scopeIds = parsedScopes.map(scope => {
          // If it's already an ID, keep it
          if (EBAY_OAUTH_SCOPES.find(s => s.id === scope)) {
            return scope;
          }
          // If it's a URL, convert to ID
          const scopeObj = EBAY_OAUTH_SCOPES.find(s => s.url === scope);
          return scopeObj ? scopeObj.id : scope;
        }).filter(Boolean);

        // Add missing required scopes using DEFAULT_SCOPES
        const missingRequiredScopes = DEFAULT_SCOPES.filter(
          scopeId => !scopeIds.includes(scopeId)
        );

        console.log('EditEbayAccountModal - Original scopes:', parsedScopes);
        console.log('EditEbayAccountModal - Converted scope IDs:', scopeIds);
        console.log('EditEbayAccountModal - Final scopes with required:', [...scopeIds, ...missingRequiredScopes]);

        return [...scopeIds, ...missingRequiredScopes];
      };

      setFormData({
        friendlyName: account.friendlyName || '',
        tags: parseTags(account.tags),
        ebayUsername: account.ebayUsername || '',
        selectedScopes: parseScopes(account.userSelectedScopes),
        status: account.status === 'active' ? 'active' : 'disabled',
      });
    }
  }, [account, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.friendlyName) {
      newErrors.friendlyName = 'Friendly name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  const handleClose = () => {
    setErrors({});
    setTagInput('');
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Edit eBay Account</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="d-flex flex-column gap-4">
            {/* Basic Information Section */}
            <div className="d-flex flex-column gap-3">
              <h5 className="text-secondary mb-0">Basic Information</h5>

              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Friendly Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.friendlyName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          friendlyName: e.target.value,
                        })
                      }
                      placeholder="e.g., Main Store Account"
                      isInvalid={!!errors.friendlyName}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.friendlyName}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>eBay Username (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.ebayUsername}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ebayUsername: e.target.value,
                        })
                      }
                      placeholder="Your eBay username"
                    />
                    <Form.Text className="text-muted">
                      If known, helps with identification
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Account Status Section */}
            <div className="d-flex flex-column gap-3">
              <h5 className="text-secondary mb-0">Account Status</h5>
              <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                <div>
                  <p className="mb-1 fw-medium">Enable Account</p>
                  <p className="mb-0 small text-muted">
                    {formData.status === 'active'
                      ? 'Account is active and can be used for API calls'
                      : 'Account is disabled and will not process any requests'}
                  </p>
                </div>
                <Form.Check
                  type="switch"
                  id="account-status-switch"
                  checked={formData.status === 'active'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.checked ? 'active' : 'disabled',
                    })
                  }
                  disabled={isSubmitting}
                  className="fs-4"
                />
              </div>
            </div>

            {/* Organization Section */}
            <div className="d-flex flex-column gap-3">
              <h5 className="text-secondary mb-0">Organization</h5>

              <Form.Group>
                <Form.Label>Tags</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag (e.g., electronics, books)"
                    onKeyDown={handleTagInputKeyDown}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                <Form.Text className="text-muted">
                  Tags help organize and filter your accounts
                </Form.Text>
              </Form.Group>

              {formData.tags.length > 0 && (
                <div className="d-flex flex-column gap-2">
                  <p className="small fw-medium text-dark mb-0">
                    Current Tags:
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        bg="primary"
                        className="px-3 py-2"
                        style={{ cursor: 'pointer' }}
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <small className="text-muted">
                    Click on a tag to remove it
                  </small>
                </div>
              )}
            </div>

            {/* eBay Permissions Section */}
            <EbayScopeSelector
              selectedScopes={formData.selectedScopes}
              onScopeChange={(scopes) => setFormData({ ...formData, selectedScopes: scopes })}
              disabled={isSubmitting}
            />

            {/* Update Info */}
            <div className="d-flex flex-column gap-3">
              <h5 className="text-secondary mb-0">Important Notes</h5>
              <Alert variant="info" className="mb-0">
                <p className="small fw-medium mb-2">
                  About updating permissions:
                </p>
                <div className="d-flex flex-column gap-1 small">
                  <p className="mb-0">• Changing scopes may require re-authentication with eBay</p>
                  <p className="mb-0">• You may need to reconnect the account after saving changes</p>
                  <p className="mb-0">• Current tokens will remain valid until they expire</p>
                </div>
              </Alert>
            </div>
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <div className="d-flex gap-2 justify-content-end w-100">
          <Button
            variant="outline-secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : 'Update Account'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
