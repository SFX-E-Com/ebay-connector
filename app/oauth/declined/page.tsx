'use client';

import { useRouter } from 'next/navigation';

export default function OAuthDeclinedPage() {
  const router = useRouter();

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6 text-center">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <div className="mb-4">
                <svg
                  className="text-warning"
                  width="64"
                  height="64"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                </svg>
              </div>

              <h1 className="h3 mb-3">Authorization Cancelled</h1>
              <p className="text-muted mb-4">
                You have declined to authorize eBay Connector to access your eBay account.
              </p>

              <div className="alert alert-info text-start mb-4">
                <h6 className="alert-heading">What this means:</h6>
                <ul className="mb-0 small">
                  <li>Your eBay account was not connected</li>
                  <li>No data will be shared with this application</li>
                  <li>You can try again at any time</li>
                </ul>
              </div>

              <div className="d-flex flex-column gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => router.push('/ebay-connections')}
                >
                  Try Again
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                </button>
              </div>

              <p className="text-muted small mt-4">
                Need help? Contact support if you're experiencing issues.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
