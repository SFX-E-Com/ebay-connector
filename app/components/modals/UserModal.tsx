"use client";

import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { useState } from "react";
import RoleSelect from '@/app/components/common/RoleSelect';

interface UserFormData {
    email: string;
    name: string;
    role: string;
    password?: string;
    confirmPassword?: string;
}

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
}

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormData) => void;
    user?: User | null;
    isSubmitting: boolean;
    currentUserRole: string;
}


export default function UserModal({
    isOpen,
    onClose,
    onSubmit,
    user,
    isSubmitting,
    currentUserRole,
}: UserModalProps) {
    const isEditing = !!user;
    const [formData, setFormData] = useState<UserFormData>({
        email: user?.email || "",
        name: user?.name || "",
        role: user?.role || "USER",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        if (!formData.name) {
            newErrors.name = "Name is required";
        }

        if (!isEditing) {
            if (!formData.password) {
                newErrors.password = "Password is required";
            } else if (formData.password.length < 6) {
                newErrors.password = "Password must be at least 6 characters";
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        } else if (
            formData.password &&
            formData.password !== formData.confirmPassword
        ) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        const submitData = { ...formData };
        if (isEditing && !formData.password) {
            delete submitData.password;
        }
        delete submitData.confirmPassword;

        onSubmit(submitData);
    };

    const handleClose = () => {
        setFormData({
            email: "",
            name: "",
            role: "USER",
            password: "",
            confirmPassword: "",
        });
        setErrors({});
        onClose();
    };


    return (
        <Modal show={isOpen} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title className="fs-5 fw-bold">
                    {isEditing ? "Edit User" : "Create New User"}
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
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    email: e.target.value,
                                                })
                                            }
                                            placeholder="Enter email address"
                                            isInvalid={!!errors.email}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.email}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Full Name
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="Enter full name"
                                            isInvalid={!!errors.name}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        {/* Permissions Section */}
                        <div className="d-flex flex-column gap-3">
                            <h5 className="text-dark mb-0">
                                Permissions
                            </h5>

                            <RoleSelect
                                value={formData.role}
                                onChange={(value) => setFormData({ ...formData, role: value })}
                                label="Role"
                                currentUserRole={currentUserRole}
                                placeholder="Select role..."
                            />
                        </div>

                        {/* Security Section */}
                        <div className="d-flex flex-column gap-3">
                            <h5 className="text-dark mb-0">
                                Security
                            </h5>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            {isEditing
                                                ? "New Password (Optional)"
                                                : "Password"}
                                        </Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    password: e.target.value,
                                                })
                                            }
                                            placeholder={
                                                isEditing
                                                    ? "Leave blank to keep current"
                                                    : "Enter password"
                                            }
                                            isInvalid={!!errors.password}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.password}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Confirm Password
                                        </Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    confirmPassword: e.target.value,
                                                })
                                            }
                                            placeholder="Confirm password"
                                            isInvalid={!!errors.confirmPassword}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.confirmPassword}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>
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
                            : (isEditing ? "Update User" : "Create User")}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
}
