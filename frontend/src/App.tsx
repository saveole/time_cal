import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ui/error-boundary';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/query-client';
import { router } from './router/routes';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand={false}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
