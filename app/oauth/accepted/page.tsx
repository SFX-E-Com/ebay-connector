'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuthAcceptedPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to eBay connections page after 3 seconds
    const timeout = setTimeout(() => {
      router.push('/ebay-connections');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6 text-center">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <div className="mb-4">
                <svg
                  className="text-success"
                  width="64"
                  height="64"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                </svg>
              </div>

              <h1 className="h3 mb-3">Authorization Successful!</h1>
              <p className="text-muted mb-4">
                Your eBay account has been successfully connected to eBay Connector.
              </p>

              <div className="d-flex flex-column gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => router.push('/ebay-connections')}
                >
                  Go to eBay Connections
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                </button>
              </div>

              <p className="text-muted small mt-4">
                Redirecting to eBay Connections in 3 seconds...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
