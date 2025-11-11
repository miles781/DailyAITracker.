'use client';

import { ReactNode } from 'react';
import { useAppStore } from '../store/appState';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme } = useAppStore();

  return (
    <div className={theme}>
      <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors">
        {children}
      </div>
    </div>
  );
}