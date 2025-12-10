/**
 * Create Listing Page
 * 
 * File Purpose:
 * - Form for hosts to create new rental listings
 * - Handles title, description, price, location, and image upload
 * - Submits to Supabase and stores in listings table
 * - Redirects to listing detail page after success
 * 
 * Features:
 * - Form validation for all fields
 * - Image upload to Supabase Storage (listings bucket)
 * - Loading state during submission
 * - Error handling with user-friendly messages
 * - Success confirmation with redirect
 * - Protected route (requires authentication)
 * 
 * Dependencies:
 * - React hooks (useState, useRouter, useCallback)
 * - Input, Button, TextArea components from FormComponents.tsx
 * - createListing from database.ts
 * - useAuthContext from AuthProvider
 * 
 * Data Flow:
 * 1. User enters form data
 * 2. Validation on change (debounced)
 * 3. Image upload to Supabase Storage on file selection
 * 4. Form submission calls createListing with image URLs
 * 5. Redirect to /listings/[id] on success
 * 
 * Notes:
 * - Images stored in 'listings' bucket in Supabase Storage
 * - Supports multiple images per listing
 * - File validation: JPG, PNG, WebP only, max 5MB per file
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, TextArea } from '@/components/FormComponents';
import AvailabilityForm from '@/components/AvailabilityForm';
import { createListing, setListingAvailability } from '@/utils/database';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface FormData {
  title: string;
  description: string;
  price_per_day: string;
  location: string;
  city: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  price_per_day?: string;
  location?: string;
  city?: string;
  images?: string;
  submit?: string;
}

interface UploadedImage {
  name: string;
  url: string;
  isUploading: boolean;
}

export default function CreateListingPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  
  // Check if user has confirmed their email
  const emailConfirmed = user?.email_confirmed_at != null;
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price_per_day: '',
    location: '',
    city: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [availableDays, setAvailableDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Default: every day

  /**
   * Validate individual field
   */
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Title is required';
        if (value.trim().length < 5) return 'Title must be at least 5 characters';
        if (value.trim().length > 100) return 'Title must be less than 100 characters';
        return undefined;

      case 'description':
        if (!value.trim()) return 'Description is required';
        if (value.trim().length < 20) return 'Description must be at least 20 characters';
        if (value.trim().length > 2000) return 'Description must be less than 2000 characters';
        return undefined;

      case 'price_per_day':
        if (!value) return 'Price per day is required';
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) return 'Price must be a positive number';
        if (price > 999999.99) return 'Price is too high';
        return undefined;

      case 'location':
        if (!value.trim()) return 'Location/address is required';
        if (value.trim().length < 3) return 'Location must be at least 3 characters';
        return undefined;

      case 'city':
        if (!value.trim()) return 'City is required';
        if (value.trim().length < 2) return 'City must be at least 2 characters';
        return undefined;

      default:
        return undefined;
    }
  };

  /**
   * Handle form input change
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  /**
   * Upload image to Supabase Storage
   */
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (!files || !user?.id) return;

      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxFileSize = 5 * 1024 * 1024; // 5MB

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!validMimeTypes.includes(file.type)) {
          setErrors((prev) => ({
            ...prev,
            images: 'Only JPG, PNG, and WebP images are allowed',
          }));
          continue;
        }

        // Validate file size
        if (file.size > maxFileSize) {
          setErrors((prev) => ({
            ...prev,
            images: 'Each image must be less than 5MB',
          }));
          continue;
        }

        // Add to uploading state
        const tempImage: UploadedImage = {
          name: file.name,
          url: '',
          isUploading: true,
        };
        setUploadedImages((prev) => [...prev, tempImage]);

        try {
          // Create unique filename with timestamp
          const timestamp = Date.now();
          const filename = `${user.id}/${timestamp}-${file.name}`;

          // Upload to Supabase Storage
          const { error } = await supabase.storage
            .from('listings')
            .upload(filename, file);

          if (error) throw error;

          // Get public URL
          const { data: publicUrl } = supabase.storage
            .from('listings')
            .getPublicUrl(filename);

          // Update state with uploaded image
          setUploadedImages((prev) =>
            prev.map((img) =>
              img.name === file.name
                ? { ...img, url: publicUrl.publicUrl, isUploading: false }
                : img
            )
          );

          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.images;
            return newErrors;
          });
        } catch (error) {
          console.error('Image upload error:', error);
          setErrors((prev) => ({
            ...prev,
            images: 'Failed to upload image. Please try again.',
          }));

          // Remove failed image from state
          setUploadedImages((prev) => prev.filter((img) => img.name !== file.name));
        }
      }

      // Reset input
      if (e.currentTarget) {
        e.currentTarget.value = '';
      }
    },
    [user?.id]
  );

  /**
   * Remove uploaded image
   */
  const removeImage = (imageName: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.name !== imageName));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Check for any uploading images FIRST
      if (uploadedImages.some((img) => img.isUploading)) {
        setErrors({ images: 'Please wait for all images to finish uploading' });
        setIsLoading(false);
        return;
      }

      // Validate all fields
      const newErrors: FormErrors = {};
      (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      });

      // Validate at least one image
      if (uploadedImages.length === 0) {
        newErrors.images = 'At least one image is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      if (!user?.id) {
        setErrors({ submit: 'User not authenticated' });
        setIsLoading(false);
        return;
      }

      // Prepare listing data
      const listingData = {
        owner_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price_per_day: parseFloat(formData.price_per_day),
        location: formData.location.trim(),
        city: formData.city.trim(),
        image_urls: uploadedImages.map((img) => img.url),
        status: 'active' as const,
      };

      // Create listing
      const response = await createListing(listingData);

      if (!response.success || !response.data) {
        setErrors({ submit: response.error || 'Failed to create listing' });
        setIsLoading(false);
        return;
      }

      // Set availability for the newly created listing
      console.log(`[CreateListingPage] Setting availability for listing ${response.data.id}`, availableDays);
      if (availableDays.length > 0) {
        try {
          const availRes = await setListingAvailability(response.data.id, availableDays);
          console.log(`[CreateListingPage] setListingAvailability response:`, availRes);
        } catch (err) {
          console.error('Error setting availability:', err);
          // Don't fail the whole operation if availability setting fails
        }
      }

      setSuccessMessage('Listing created successfully! Redirecting...');

      // Redirect to listing detail page after short delay
      const listingId = response.data!.id;
      setTimeout(() => {
        router.push(`/listings/${listingId}`);
      }, 1000);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create listing',
      });
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Listing</h1>
            <p className="text-gray-600">
              Share details about the item you want to rent out
            </p>
          </div>

          {/* Email Confirmation Required */}
          {!emailConfirmed && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-amber-900">Confirm your email to create listings</p>
                  <p className="text-sm text-amber-800 mt-1">
                    Check your inbox for a confirmation email from Supabase. Once you confirm, you&apos;ll be able to create and publish listings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
            {/* Title */}
            <Input
              label="Listing Title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              error={errors.title}
              placeholder="e.g., Mountain Bike, Camping Tent, Ladder"
              disabled={isLoading}
            />

            {/* Description */}
            <TextArea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              error={errors.description}
              placeholder="Describe the item, its condition, features, and what's included..."
              rows={6}
              disabled={isLoading}
            />

            {/* Price Per Day */}
            <Input
              label="Price Per Day ($)"
              name="price_per_day"
              type="number"
              step="0.01"
              value={formData.price_per_day}
              onChange={handleInputChange}
              error={errors.price_per_day}
              placeholder="e.g., 25.00"
              disabled={isLoading}
            />

            {/* Location */}
            <Input
              label="Location / Address"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              error={errors.location}
              placeholder="e.g., 123 Main St, Downtown"
              disabled={isLoading}
            />

            {/* City */}
            <Input
              label="City"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleInputChange}
              error={errors.city}
              placeholder="e.g., Denver, Austin"
              disabled={isLoading}
            />

            {/* Availability */}
            <AvailabilityForm
              availableDays={availableDays}
              onChange={setAvailableDays}
              disabled={isLoading}
            />

            {/* Images Section */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Photos
                <span className="text-red-600 ml-1">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-3">
                JPG, PNG, or WebP. Max 5MB each. Upload at least one image.
              </p>

              {/* File Input */}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageUpload}
                disabled={isLoading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-brand-secondary file:text-brand-primary
                  hover:file:bg-brand-tertiary hover:file:text-white
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Error message */}
              {errors.images && (
                <p className="mt-2 text-sm text-red-600">{errors.images}</p>
              )}

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-gray-900">
                    Uploaded: {uploadedImages.length} image
                    {uploadedImages.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {uploadedImages.map((image) => (
                      <div
                        key={image.name}
                        className="relative group rounded-lg overflow-hidden bg-gray-100"
                      >
                        {/* Loading spinner */}
                        {image.isUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}

                        {/* Image preview */}
                        {image.url && (
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-32 object-cover"
                          />
                        )}

                        {/* Remove button */}
                        {!image.isUploading && (
                          <button
                            type="button"
                            onClick={() => removeImage(image.name)}
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/50 
                              flex items-center justify-center opacity-0 group-hover:opacity-100
                              transition-opacity"
                          >
                            <span className="text-white text-sm font-medium">Remove</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading || !emailConfirmed} isLoading={isLoading}>
                {isLoading ? 'Creating...' : 'Create Listing'}
              </Button>
              <Link href="/listings">
                <button
                  type="button"
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium
                    hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
