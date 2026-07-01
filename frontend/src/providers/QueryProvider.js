// src/providers/QueryProvider.js
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configure query client with optimal settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache (renamed from cacheTime in v5)
      retry: 1, // Retry failed queries once
      refetchOnWindowFocus: false, // Don't refetch when tab gains focus
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Refetch when component mounts
    },
    mutations: {
      retry: 1, // Retry failed mutations once
      retryDelay: 1000, // Wait 1 second between retries
    },
  },
});

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};