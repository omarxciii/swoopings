/**
 * Login Page
 * 
 * File Purpose:
 * - User sign-in form
 * - Email and password authentication
 * - Links to signup and forgot password
 * 
 * Dependencies:
 * - React hooks
 * - next/navigation
 * - src/components/FormComponents
 * - src/providers/AuthProvider
 * - src/utils/helpers
 * 
 * High-Level Logic:
 * 1. User enters email and password
 * 2. Validate inputs
 * 3. Call signIn from auth context
 * 4. If successful, redirect to dashboard
 * 5. If failed, show error message
 * 
 * History:
 * - 2025-12-06: Initial creation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button } from '@/components/FormComponents';
import { useAuthContext } from '@/providers/AuthProvider';
import { isValidEmail } from '@/utils/helpers';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuthContext();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const user = await signIn(formData.email, formData.password);

    if (user) {
      // Clear form on success
      setFormData({ email: '', password: '' });
      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      setErrors(prev => ({
        ...prev,
        submit: 'Invalid email or password. Please try again.',
      }));
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-primary mb-2">Swoopings</h1>
          <p className="text-brand-primary">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Email Input */}
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={e => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
            required
          />

          {/* Password Input */}
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={e => handleChange('password', e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            required
          />

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-brand-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting || authLoading}
            disabled={authLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-brand-primary font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
