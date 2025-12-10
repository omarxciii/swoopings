/**
 * Signup Page
 * 
 * File Purpose:
 * - User registration form
 * - Email and password validation
 * - Redirect to profile creation after successful signup
 * 
 * Dependencies:
 * - React hooks (useState)
 * - next/navigation (useRouter)
 * - src/components/FormComponents (Input, Button)
 * - src/providers/AuthProvider (useAuthContext)
 * - src/utils/helpers (validation functions)
 * 
 * High-Level Logic:
 * 1. User enters email and password
 * 2. Validate email format and password strength
 * 3. Call signUp from auth context
 * 4. If successful, redirect to profile creation page
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
import { isValidEmail, isValidPassword } from '@/utils/helpers';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, loading: authLoading } = useAuthContext();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
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
    } else if (!isValidPassword(formData.password)) {
      newErrors.password =
        'Password must be at least 8 characters with 1 uppercase letter and 1 number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

    const user = await signUp(formData.email, formData.password);

    if (user) {
      // Clear form on success
      setFormData({ email: '', password: '', confirmPassword: '' });
      // Redirect to profile creation
      router.push('/auth/profile-setup');
    } else {
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to create account. Please try again.',
      }));
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/swoopings-logo-lightmode3x.png" 
            alt="Swoopings" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <p className="text-brand-primary">Create your account</p>
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

          {/* Confirm Password Input */}
          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={e => handleChange('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            placeholder="••••••••"
            required
          />

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting || authLoading}
            disabled={authLoading}
          >
            Create Account
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Password Requirements */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2 font-medium">Password requirements:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ At least 8 characters</li>
            <li>✓ At least 1 uppercase letter</li>
            <li>✓ At least 1 number</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
