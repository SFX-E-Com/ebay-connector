"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form, Button, Alert, Card, Spinner } from "react-bootstrap";
import { FiLock, FiShield } from "react-icons/fi";
import axios from "axios";

interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
}

export default function ChangePasswordPage() {
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<PasswordChangeData>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // Redirect to login if no user found
            router.push("/login");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (formData.newPassword.length < 8) {
            setError("New password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post("/api/auth/change-password", {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });

            if (response.data.success) {
                // Redirect to dashboard after successful password change
                router.push("/dashboard");
            } else {
                setError(response.data.message || "Failed to change password");
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    "An error occurred while changing password"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    if (!user) {
        return null; // Will redirect to login
    }

    // Helper to get initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3">
            <div style={{ maxWidth: '32rem', width: '100%' }}>
                <Card className="shadow-lg rounded-4">
                    <Card.Body className="p-4 p-md-5">
                        <div className="d-flex flex-column gap-4">
                            {/* Header */}
                            <div className="d-flex flex-column gap-3 text-center">
                                <div
                                    className="rounded-circle bg-danger bg-opacity-10 text-danger d-inline-flex align-items-center justify-content-center mx-auto"
                                    style={{ width: '3.5rem', height: '3.5rem' }}
                                >
                                    <FiLock size={24} />
                                </div>
                                <h2 className="fw-bold text-dark mb-0">
                                    Password Change Required
                                </h2>

                                {/* User Info */}
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex gap-3 align-items-center justify-content-center">
                                        <div
                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                            style={{ width: '2rem', height: '2rem', fontSize: '0.875rem' }}
                                        >
                                            {getInitials(user?.name || user?.email)}
                                        </div>
                                        <p className="text-dark fw-medium mb-0">
                                            Hello, {user?.name || user?.email}
                                        </p>
                                    </div>
                                    <p className="text-muted small mb-0">
                                        For security reasons, you must change your password before continuing.
                                    </p>
                                </div>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="danger" className="mb-0">
                                    {error}
                                </Alert>
                            )}

                            {/* Password Change Form */}
                            <Form onSubmit={handleSubmit}>
                                <div className="d-flex flex-column gap-3">
                                    <Form.Group>
                                        <Form.Label className="text-dark">Current Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleInputChange}
                                            autoComplete="current-password"
                                            disabled={isLoading}
                                            size="lg"
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label className="text-dark">New Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleInputChange}
                                            autoComplete="new-password"
                                            disabled={isLoading}
                                            size="lg"
                                            minLength={8}
                                            required
                                        />
                                        <Form.Text className="text-muted">
                                            Password must be at least 8 characters long
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label className="text-dark">Confirm New Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            autoComplete="new-password"
                                            disabled={isLoading}
                                            size="lg"
                                            minLength={8}
                                            required
                                        />
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-100"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Changing Password...
                                            </>
                                        ) : (
                                            <>
                                                <FiLock size={16} style={{ marginRight: '8px' }} />
                                                Change Password
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Form>

                            {/* Footer */}
                            <div className="d-flex gap-2 justify-content-center pt-3">
                                <FiShield className="text-success" />
                                <p className="small text-muted mb-0 text-center">
                                    Your new password will be securely encrypted and stored.
                                </p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}
