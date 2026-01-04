'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { FiLogIn, FiShield } from 'react-icons/fi';
import axios from 'axios';

interface LoginCredentials {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/login', credentials);

      if (response.data.success) {
        // Store user data and token for client-side API calls
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('token', response.data.data.token);

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'An error occurred during login'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3">
      <div style={{ maxWidth: '28rem', width: '100%' }}>
        <Card className="shadow-lg rounded-4">
          <Card.Body className="p-4 p-md-5">
            <div className="d-flex flex-column gap-4">
              {/* Header */}
              <div className="d-flex flex-column gap-2 text-center">
                <div
                  className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center mx-auto"
                  style={{ width: '3.5rem', height: '3.5rem' }}
                >
                  <FiShield size={24} />
                </div>
                <h2 className="fw-bold text-dark mb-0">
                  eBay Connector
                </h2>
                <p className="text-muted mb-0">
                  Admin Portal
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-0">
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Form onSubmit={handleSubmit}>
                <div className="d-flex flex-column gap-3">
                  <Form.Group>
                    <Form.Label className="text-dark">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={credentials.email}
                      onChange={handleInputChange}
                      autoComplete="off"
                      disabled={isLoading}
                      size="lg"
                      required
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="text-dark">Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      autoComplete="current-password"
                      disabled={isLoading}
                      size="lg"
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
                        Signing In...
                      </>
                    ) : (
                      <>
                        <FiLogIn size={16} style={{ marginRight: '8px' }} />
                        Sign In
                      </>
                    )}
                  </Button>
                </div>
              </Form>

              {/* Footer */}
              <div className="d-flex gap-2 justify-content-center pt-3">
                <FiShield className="text-success" />
                <p className="small text-muted mb-0">
                  Secure authentication with HTTP-only cookies
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}