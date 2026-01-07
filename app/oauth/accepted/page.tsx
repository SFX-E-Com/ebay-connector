'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      console.log('OAuth callback params:', { hasCode: !!code, hasState: !!state, hasError: !!error });

      if (error) {
        setStatus('error');
        setErrorMessage('eBay authorization was declined or failed.');
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Missing authorization code or state parameter.');
        return;
      }

      try {
        // Call the callback API to exchange the code for tokens
        const callbackUrl = `/api/ebay/oauth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        
        console.log('Calling callback API:', callbackUrl);
        
        const response = await fetch(callbackUrl, {
          method: 'GET',
          credentials: 'include', // Include cookies for state verification
        });

        console.log('Callback API response:', response.status);

        if (response.ok) {
          setStatus('success');
          // Redirect after short delay
          setTimeout(() => {
            router.push('/ebay-connections?success=connected');
          }, 2000);
        } else {
          const text = await response.text();
          console.error('Callback API error:', text);
          setStatus('error');
          setErrorMessage('Failed to complete eBay authorization. Please try again.');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setErrorMessage('An error occurred during authorization. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (status === 'processing') {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 text-center">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <div className="spinner-border text-primary mb-4" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h1 className="h3 mb-3">Completing Authorization...</h1>
                <p className="text-muted mb-0">
                  Please wait while we connect your eBay account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 text-center">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <div className="mb-4">
                  <svg
                    className="text-danger"
                    width="64"
                    height="64"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
                  </svg>
                </div>
                <h1 className="h3 mb-3">Authorization Failed</h1>
                <p className="text-muted mb-4">{errorMessage}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => router.push('/ebay-connections')}
                >
                  Back to eBay Connections
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                Your eBay account has been successfully connected.
              </p>
              <p className="text-muted small">
                Redirecting to eBay Connections...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OAuthAcceptedPage() {
  return (
    <Suspense fallback={
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    }>
      <OAuthCallbackHandler />
    </Suspense>
  );
}
