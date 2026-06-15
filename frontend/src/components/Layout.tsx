import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

/** Page shell: role-aware navbar + centered content area. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
