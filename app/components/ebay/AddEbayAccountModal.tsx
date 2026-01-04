'use client';

import { Modal, Form, Button, Badge, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useState } from 'react';
import EbayScopeSelector from './EbayScopeSelector';
import { DEFAULT_SCOPES } from '@/app/lib/constants/ebayScopes';

interface EbayAccountFormData {
  friendlyName: string;
  tags: string[];
  ebayUsername?: string;
  selectedScopes: string[];
}

interface AddEbayAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EbayAccountFormData) => void;
  isSubmitting: boolean;
}

export default function AddEbayAccountModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: AddEbayAccountModalProps) {
  const [formData, setFormData] = useState<EbayAccountFormData>({
    friendlyName: '',
    tags: [],
    ebayUsername: '',
    selectedScopes: DEFAULT_SCOPES,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

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
    setFormData({
      friendlyName: '',
      tags: [],
      ebayUsername: '',
      selectedScopes: DEFAULT_SCOPES,
    });
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
        <Modal.Title className="fw-bold">Add eBay Account</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="d-flex flex-column gap-4">
            {/* Basic Information Section */}
            <div className="d-flex flex-column gap-3">
              <h5 className="text-dark mb-0">Basic Information</h5>

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

            {/* Organization Section */}
            <div className="d-flex flex-column gap-3">
              <h5 className="text-dark mb-0">Organization</h5>

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

            {/* Connection Info */}
            <div className="d-flex flex-column gap-3">
              <h5 className="text-dark mb-0">Next Steps</h5>
              <Alert variant="warning" className="mb-0">
                <p className="small fw-medium mb-2">
                  After creating this account:
                </p>
                <div className="d-flex flex-column gap-1 small">
                  <p className="mb-0">• Click "Connect Account" to authorize with eBay</p>
                  <p className="mb-0">• Complete the OAuth flow with your selected permissions</p>
                  <p className="mb-0">• Your account will be ready to use for API calls</p>
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
            variant="warning"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : 'Create Account'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
