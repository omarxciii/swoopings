/**
 * Profile Setup Page
 * 
 * File Purpose:
 * - First page after signup
 * - User creates their public profile
 * - Sets username, name, bio, avatar
 * 
 * Dependencies:
 * - React hooks
 * - next/navigation
 * - src/components/FormComponents
 * - src/providers/AuthProvider
 * - src/utils/database (updateProfile)
 * 
 * High-Level Logic:
 * 1. User fills in profile details
 * 2. Validate username is unique (done via DB)
 * 3. Save to profiles table
 * 4. Redirect to dashboard
 * 
 * Areas Needing Work:
 * - Add avatar image upload
 * - Add location/address fields
 * - Add phone number field
 * 
 * History:
 * - 2025-12-06: Initial creation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/FormComponents';
import { useAuthContext } from '@/providers/AuthProvider';
import { updateProfile } from '@/utils/database';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    bio: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, dashes, and underscores';
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!validateForm() || !user) {
      return;
    }

    setIsSubmitting(true);

    // Profile was auto-created by trigger, so just update it
    const result = await updateProfile(user.id, {
      username: formData.username,
      full_name: formData.fullName,
      bio: formData.bio || null,
      email: user.email || '',
    });

    if (result.success) {
      router.push('/dashboard');
    } else {
      setErrors(prev => ({
        ...prev,
        submit: result.error || 'Failed to create profile',
      }));
    }

    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Profile</h1>
          <p className="text-gray-600">Let others know about you</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Username Input */}
          <Input
            label="Username"
            type="text"
            value={formData.username}
            onChange={e => handleChange('username', e.target.value)}
            error={errors.username}
            placeholder="yourname"
            required
          />

          {/* Full Name Input */}
          <Input
            label="Full Name"
            type="text"
            value={formData.fullName}
            onChange={e => handleChange('fullName', e.target.value)}
            error={errors.fullName}
            placeholder="Your Full Name"
            required
          />

          {/* Bio Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={e => handleChange('bio', e.target.value)}
              placeholder="Tell others about yourself..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Complete Profile
          </Button>
        </form>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-brand-secondary border border-brand-tertiary rounded-lg">
          <p className="text-sm text-brand-primary">
            💡 You can edit your profile anytime from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
