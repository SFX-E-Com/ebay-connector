"use client";

import { Modal, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useState, useEffect } from "react";
import { AVAILABLE_ENDPOINTS, DEFAULT_ENDPOINTS } from "@/app/lib/config/endpoints";

interface CreateApiTokenData {
    name: string;
    permissions?: {
        endpoints?: string[];
        rateLimit?: number;
        ebayAccountIds?: string[];
    };
    scopes?: string[];
    expiresAt?: string;
}

interface ApiToken {
    id: string;
    name: string;
    token: string;
    permissions: {
        endpoints?: string[];
        rateLimit?: number;
        ebayAccountIds?: string[];
    };
    isActive: boolean;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface EbayAccount {
    id: string;
    friendlyName?: string;
    ebayUserId: string;
    ebayUsername?: string;
    environment: 'sandbox' | 'production';
    status: string;
}

interface ApiTokenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateApiTokenData) => void;
    token?: ApiToken | null;
    isSubmitting: boolean;
}


export default function ApiTokenModal({
    isOpen,
    onClose,
    onSubmit,
    token,
    isSubmitting,
}: ApiTokenModalProps) {
    const isEditing = !!token;

    // Helper function to format date for input field
    const formatDateForInput = (dateString: string | null | undefined): string => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) return "";

            // Use local date to avoid timezone issues with date input field
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Date formatting error:', error, 'Input:', dateString);
            return "";
        }
    };

    const [formData, setFormData] = useState<CreateApiTokenData>({
        name: token?.name || "",
        permissions: {
            endpoints: token?.permissions?.endpoints || DEFAULT_ENDPOINTS,
            rateLimit: token?.permissions?.rateLimit || 1000,
            ebayAccountIds: token?.permissions?.ebayAccountIds || [],
        },
        expiresAt: formatDateForInput(token?.expiresAt),
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [ebayAccounts, setEbayAccounts] = useState<EbayAccount[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);

    // Fetch eBay accounts when modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchAccounts = async () => {
                setLoadingAccounts(true);
                try {
                    const response = await fetch('/api/ebay-accounts', {
                        credentials: 'include',
                    });
                    const result = await response.json();
                    if (result.success && result.data) {
                        setEbayAccounts(result.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch eBay accounts:', error);
                } finally {
                    setLoadingAccounts(false);
                }
            };
            fetchAccounts();
        }
    }, [isOpen]);

    // Update form data when token prop changes (for editing)
    useEffect(() => {
        if (token) {
            setFormData({
                name: token.name || "",
                permissions: {
                    endpoints: token.permissions?.endpoints || DEFAULT_ENDPOINTS,
                    rateLimit: token.permissions?.rateLimit || 1000,
                    ebayAccountIds: token.permissions?.ebayAccountIds || [],
                },
                expiresAt: formatDateForInput(token.expiresAt),
            });
        } else {
            // Reset to defaults when creating new token
            setFormData({
                name: "",
                permissions: {
                    endpoints: DEFAULT_ENDPOINTS,
                    rateLimit: 1000,
                    ebayAccountIds: [],
                },
                expiresAt: "",
            });
        }
        // Clear any existing errors when switching tokens
        setErrors({});
    }, [token]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};

        if (!formData.name) {
            newErrors.name = "Token name is required";
        } else if (formData.name.length > 100) {
            newErrors.name = "Token name must be less than 100 characters";
        }

        if (formData.permissions?.rateLimit && formData.permissions.rateLimit < 1) {
            newErrors.rateLimit = "Rate limit must be at least 1";
        }

        if (formData.permissions?.rateLimit && formData.permissions.rateLimit > 10000) {
            newErrors.rateLimit = "Rate limit cannot exceed 10,000 requests per hour";
        }

        if (formData.expiresAt && new Date(formData.expiresAt) <= new Date()) {
            newErrors.expiresAt = "Expiration date must be in the future";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        const submitData: CreateApiTokenData = {
            name: formData.name.trim(),
            permissions: {
                endpoints: formData.permissions?.endpoints || [],
                rateLimit: formData.permissions?.rateLimit || 1000,
                ebayAccountIds: formData.permissions?.ebayAccountIds || [],
            },
        };

        if (formData.expiresAt) {
            submitData.expiresAt = new Date(formData.expiresAt).toISOString();
        }

        onSubmit(submitData);
    };

    const handleClose = () => {
        setFormData({
            name: "",
            permissions: {
                endpoints: DEFAULT_ENDPOINTS,
                rateLimit: 1000,
                ebayAccountIds: [],
            },
            expiresAt: "",
        });
        setErrors({});
        onClose();
    };

    const handleAccountChange = (accountId: string, checked: boolean) => {
        const currentAccounts = formData.permissions?.ebayAccountIds || [];
        let newAccounts;

        if (checked) {
            newAccounts = [...currentAccounts, accountId];
        } else {
            newAccounts = currentAccounts.filter(id => id !== accountId);
        }

        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                ebayAccountIds: newAccounts,
            },
        });
    };

    const handleEndpointChange = (endpoint: string, checked: boolean) => {
        const currentEndpoints = formData.permissions?.endpoints || [];
        let newEndpoints;

        if (checked) {
            newEndpoints = [...currentEndpoints, endpoint];
        } else {
            newEndpoints = currentEndpoints.filter(e => e !== endpoint);
        }

        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                endpoints: newEndpoints,
            },
        });
    };

    const handleRateLimitChange = (value: string) => {
        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                rateLimit: parseInt(value) || 1000,
            },
        });
    };

    return (
        <Modal show={isOpen} onHide={handleClose} size="lg" scrollable>
            <Modal.Header closeButton>
                <Modal.Title className="fs-5 fw-bold">
                    {isEditing ? "Edit API Token" : "Create New API Token"}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <div className="d-flex flex-column gap-4">
                        {/* Basic Information Section */}
                        <div className="d-flex flex-column gap-3">
                            <h5 className="text-dark mb-0">
                                Basic Information
                            </h5>

                            <Row>
                                <Col md={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Token Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="Enter a descriptive name for this token"
                                            isInvalid={!!errors.name}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.name}
                                        </Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            Choose a name that helps you identify where this token is used
                                        </Form.Text>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Expiration Date (Optional)</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={formData.expiresAt}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    expiresAt: e.target.value,
                                                })
                                            }
                                            isInvalid={!!errors.expiresAt}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.expiresAt}
                                        </Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            Leave blank for no expiration
                                        </Form.Text>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Rate Limit (requests/hour)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.permissions?.rateLimit?.toString() || "1000"}
                                            onChange={(e) => handleRateLimitChange(e.target.value)}
                                            min={1}
                                            max={10000}
                                            placeholder="1000"
                                            isInvalid={!!errors.rateLimit}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.rateLimit}
                                        </Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            Maximum API requests per hour
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        {/* Permissions Section */}
                        <div className="d-flex flex-column gap-3">
                            <h5 className="text-dark mb-0">
                                API Permissions
                            </h5>

                            <div>
                                <p className="small text-secondary mb-3">
                                    Select which API endpoints this token can access:
                                </p>
                                <Row>
                                    {AVAILABLE_ENDPOINTS.map((endpoint) => (
                                        <Col md={6} key={endpoint.id} className="mb-3">
                                            <Form.Check
                                                type="checkbox"
                                                id={`endpoint-${endpoint.id}`}
                                                checked={formData.permissions?.endpoints?.includes(endpoint.id) || false}
                                                onChange={(e) => handleEndpointChange(endpoint.id, e.target.checked)}
                                                label={
                                                    <div className="d-flex flex-column">
                                                        <span className="small fw-medium text-dark">
                                                            {endpoint.name}
                                                        </span>
                                                        <span className="small text-secondary">
                                                            {endpoint.description}
                                                        </span>
                                                        <span className="small text-primary fw-medium">
                                                            {endpoint.id}
                                                        </span>
                                                    </div>
                                                }
                                            />
                                        </Col>
                                    ))}
                                </Row>
                                <p className="small text-secondary mt-2">
                                    Token will only be able to access the selected API endpoints
                                </p>
                            </div>
                        </div>

                        {/* eBay Account Access Section */}
                        <div className="d-flex flex-column gap-3">
                            <h5 className="text-dark mb-0">
                                eBay Account Access
                            </h5>

                            <div>
                                <p className="small text-secondary mb-3">
                                    Restrict this token to specific eBay accounts (optional):
                                </p>

                                {loadingAccounts ? (
                                    <div className="d-flex align-items-center gap-2 py-3">
                                        <Spinner animation="border" size="sm" />
                                        <span className="small text-muted">Loading accounts...</span>
                                    </div>
                                ) : ebayAccounts.length === 0 ? (
                                    <Alert variant="info" className="small mb-0">
                                        No eBay accounts found. Connect an eBay account first to restrict token access.
                                    </Alert>
                                ) : (
                                    <>
                                        <Row>
                                            {ebayAccounts.map((account) => (
                                                <Col md={6} key={account.id} className="mb-3">
                                                    <Form.Check
                                                        type="checkbox"
                                                        id={`account-${account.id}`}
                                                        checked={formData.permissions?.ebayAccountIds?.includes(account.id) || false}
                                                        onChange={(e) => handleAccountChange(account.id, e.target.checked)}
                                                        label={
                                                            <div className="d-flex flex-column">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className="small fw-medium text-dark">
                                                                        {account.friendlyName || account.ebayUsername || account.ebayUserId}
                                                                    </span>
                                                                    <span className={`badge ${account.environment === 'production' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '0.65rem' }}>
                                                                        {account.environment.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <span className="small text-secondary">
                                                                    {account.ebayUserId}
                                                                </span>
                                                            </div>
                                                        }
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                        <p className="small text-secondary mt-2">
                                            {formData.permissions?.ebayAccountIds?.length === 0
                                                ? "No accounts selected = Token can access ALL your eBay accounts"
                                                : `Token restricted to ${formData.permissions?.ebayAccountIds?.length} account(s)`}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {!isEditing && (
                            <Alert variant="warning" className="border-start border-4 border-warning">
                                <Alert.Heading className="h6">Security Notice</Alert.Heading>
                                <p className="small mb-0">
                                    Your token will be shown only once after creation. Make sure to copy and store it securely.
                                </p>
                            </Alert>
                        )}
                    </div>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <div className="d-flex gap-3 justify-content-end w-100">
                    <Button
                        variant="secondary"
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
                        {isSubmitting && (
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                        )}
                        {isSubmitting
                            ? (isEditing ? "Updating..." : "Creating...")
                            : (isEditing ? "Update Token" : "Create Token")}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
}
