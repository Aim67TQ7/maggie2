'use client';

import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, hasRole } = useAuth();

  if (!isAuthenticated) {
    return null; // Home page handles redirect to login
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-lg font-semibold text-gray-900">Access Restricted</h2>
          <p className="mt-2 text-sm text-gray-500">
            You don&apos;t have permission to view this page. Your role ({user?.role}) doesn&apos;t
            include access to this feature.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
