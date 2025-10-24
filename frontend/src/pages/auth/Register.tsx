import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useNavigation } from '../../router/routes';
import { useAuth } from '../../contexts/AuthContext';
import { registerSchema, RegisterFormData, validateForm } from '../../lib/validation';
import { Button } from '../../components/ui/button';
import { toast } from '../../lib/toast';

export function Register() {
  const navigateTo = useNavigation();
  const { register: authRegister } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await authRegister({
          email: values.email,
          password: values.password,
          name: values.name,
        });
        toast.success('Account created!', 'Welcome to Time Calculator');
        navigateTo.navigateToDashboard();
      } catch (error) {
        toast.error('Registration failed', 'Please check your information and try again');
        console.error('Registration error:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const { errors, touched, handleSubmit, getFieldProps, isValid } = form.state;

  const validateFormAndSubmit = (e: React.FormEvent) => {
    const validation = validateForm(registerSchema, form.values);
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
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-2">
            Start tracking your time more effectively
          </p>
        </div>

        <form onSubmit={validateFormAndSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              {...getFieldProps('name')}
              className={`w-full px-3 py-2 border rounded-md ${
                touched.name && errors.name ? 'border-destructive' : 'border-input'
              }`}
              placeholder="John Doe"
              autoComplete="name"
            />
            {touched.name && errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

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
              autoComplete="new-password"
            />
            {touched.password && errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...getFieldProps('confirmPassword')}
              className={`w-full px-3 py-2 border rounded-md ${
                touched.confirmPassword && errors.confirmPassword
                  ? 'border-destructive'
                  : 'border-input'
              }`}
              placeholder="•••••••••••"
              autoComplete="new-password"
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isValid}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigateTo.navigateToLogin()}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}