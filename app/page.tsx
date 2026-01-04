'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from 'react-bootstrap';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-5">
      <div className="d-flex flex-column gap-4 text-center">
        <h1 className="display-1 text-primary fw-bold">
          eBay Connector
        </h1>
        <p className="fs-4 text-secondary">
          Connect and manage your eBay listings
        </p>
        <div className="d-flex flex-column gap-3 align-items-center">
          <Spinner animation="border" variant="primary" />
          <p className="small text-muted">
            Redirecting...
          </p>
        </div>
      </div>
    </div>
  );
}