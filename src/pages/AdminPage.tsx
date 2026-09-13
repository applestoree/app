import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

export function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-full bg-white p-4">
      <div className="mx-auto w-full max-w-[500px]">
        <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
        <p className="mt-2 text-sm text-gray-500">Admin access is active.</p>
      </div>
    </main>
  );
}
