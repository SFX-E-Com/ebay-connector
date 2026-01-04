'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import InfoCard from '../components/InfoCard';
import React from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Redirect to login if no user found
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    try {
      // Call logout API
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and redirect
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="d-flex flex-column gap-3 align-items-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="fs-5 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <React.Fragment>
      {/* Main content */}
      <div className="py-4 py-md-5 px-3 px-sm-4 px-lg-5">
        <div className="d-flex flex-column gap-4">
          <div>
            <h1 className="display-6 fw-bold text-dark mb-2">
              Welcome to eBay Connector Dashboard
            </h1>
            <p className="text-muted">
              Manage your authentication and account settings.
            </p>
          </div>

          <Row className="g-4">
            <Col xs={12} md={6}>
              <InfoCard
                title="Account Settings"
                description="Manage your profile and security"
                icon="⚙️"
                variant="orange"
              >
                <Button
                  onClick={handleChangePassword}
                  variant="outline-primary"
                  className="w-100"
                >
                  Change Password
                </Button>
              </InfoCard>
            </Col>

            <Col xs={12} md={6}>
              <InfoCard
                title="User Information"
                description="Your account details"
                icon="👤"
                variant="blue"
              >
                <div className="d-flex flex-column gap-2">
                  <p className="small text-secondary mb-0">
                    Email: {user.email}
                  </p>
                  <p className="small text-secondary mb-0">
                    Role: {user.role}
                  </p>
                  {user.name && (
                    <p className="small text-secondary mb-0">
                      Name: {user.name}
                    </p>
                  )}
                </div>
              </InfoCard>
            </Col>
          </Row>
        </div>
      </div>
    </React.Fragment>
  );
}