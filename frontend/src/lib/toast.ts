import { toast as sonnerToast } from 'sonner';

// Custom toast configuration
export const toast = {
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      duration: 4000,
    });
  },

  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      duration: 6000,
    });
  },

  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      duration: 5000,
    });
  },

  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      duration: 4000,
    });
  },

  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    });
  },

  // Custom toast for API errors
  apiError: (error: unknown, fallbackMessage = 'An error occurred') => {
    let message = fallbackMessage;
    let description = '';

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      message = errorObj.error || errorObj.message || fallbackMessage;
      description = errorObj.details || '';
    }

    return toast.error(message, description);
  },

  // Success toast with action
  successWithAction: (
    message: string,
    action: { label: string; onClick: () => void },
    description?: string
  ) => {
    return sonnerToast.success(message, {
      description,
      duration: 6000,
      action: {
        label: action.label,
        onClick: action.onClick,
      },
    });
  },

  // Promise toast for async operations
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },
};

// Global error handler toast
export const handleError = (error: unknown, fallbackMessage = 'An error occurred') => {
  console.error('Global error handler:', error);
  toast.apiError(error, fallbackMessage);
};

// Success message helper
export const showSuccess = (message: string, description?: string) => {
  toast.success(message, description);
};

// Error message helper
export const showError = (message: string, description?: string) => {
  toast.error(message, description);
};

// Loading message helper
export const showLoading = (message: string, description?: string) => {
  return toast.loading(message, description);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  sonnerToast.dismiss();
};