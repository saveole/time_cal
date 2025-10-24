import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { useNavigation } from '../../router/routes';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema, LoginFormData, validateForm } from '../../lib/validation';
import { apiClient } from '../../lib/api';
import { toast } from '../../lib/toast';

export function Login() {
  const navigateTo = useNavigation();
  const { login: authLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await authLogin(values);
        toast.success('Welcome back!', 'Successfully signed in to your account');
        navigateTo.navigateToDashboard();
      } catch (error) {
        toast.error('Login failed', 'Please check your credentials and try again');
        console.error('Login error:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const { errors, touched, handleSubmit, getFieldProps, isValid } = form.state;

  const validateFormAndSubmit = (e: React.FormEvent) => {
    const validation = validateForm(loginSchema, form.values);
    if (!validation.success) {
      toast.error('Please fix the errors in the form');
      return;
    }
    handleSubmit(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your Time Calculator account
          </p>
        </div>

        <form onSubmit={validateFormAndSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...getFieldProps('email')}
              className={`w-full px-3 py-2 border rounded-md ${
                touched.email && errors.email ? 'border-destructive' : 'border-input'
              }`}
              placeholder="your@email.com"
              autoComplete="email"
            />
            {touched.email && errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...getFieldProps('password')}
              className={`w-full px-3 py-2 border rounded-md ${
                touched.password && errors.password ? 'border-destructive' : 'border-input'
              }`}
              placeholder="•••••••••••"
              autoComplete="current-password"
            />
            {touched.password && errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isValid}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigateTo.navigateToRegister()}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}