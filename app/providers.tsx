'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-bs-theme" defaultTheme="light" disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}