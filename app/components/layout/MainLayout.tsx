'use client';

import React from 'react';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="d-flex w-100 vh-100 bg-light p-4 gap-4">
      <aside
        className="d-flex flex-column justify-content-between align-items-start bg-white p-3 h-100"
        style={{
          width: '100%',
          maxWidth: '350px',
          borderRadius: '1rem',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <Sidebar />
      </aside>
      <main className="d-flex flex-column w-100 h-100 bg-white overflow-auto" style={{ borderRadius: '1rem' }}>
        {children}
        <Footer />
      </main>
    </div>
  );
}