/**
 * Listing Card Component
 * 
 * File Purpose:
 * - Reusable card displaying a rental listing summary
 * - Shows image, title, price, location, and owner rating
 * - Clickable link to listing detail page
 * - Used on browse page and user dashboard
 * 
 * Features:
 * - Image carousel/preview
 * - Owner rating and review count
 * - Price per day prominently displayed
 * - Location and address
 * - Responsive grid layout
 * - Hover effects
 * - Link to detail page
 * 
 * Dependencies:
 * - React, Next.js Link
 * - Tailwind CSS
 * - src/types/index.ts
 * 
 * Data Flow:
 * - Accepts Listing type from database
 * - Displays main image from image_urls array
 * - Links to /listings/[id] on click
 * - Shows owner info (needs to be fetched separately)
 * 
 * Notes:
 * - image_urls is array; displays first image only
 * - Falls back to placeholder if no images
 * - Owner data fetched separately in parent component
 * - Can be used as link wrapper or button
 */

'use client';

import Link from 'next/link';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  ownerName?: string;
  ownerRating?: number;
  showOwner?: boolean;
}

export default function ListingCard({
  listing,
  ownerName = 'Unknown',
  ownerRating,
  showOwner = false,
}: ListingCardProps) {
  const mainImage = listing.image_urls[0];
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group h-full bg-white rounded-lg shadow-md hover:shadow-lg overflow-hidden transition-shadow duration-200 cursor-pointer">
        {/* Image Container */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <span className="text-gray-500 text-sm">No image</span>
            </div>
          )}

          {/* Price Badge */}
          <div className="absolute top-3 right-3 bg-brand-secondary text-brand-primary px-3 py-1 rounded-full text-sm font-semibold">
            {formatPrice(listing.price_per_day)}/day
          </div>

          {/* Image Count Badge (if multiple images) */}
          {listing.image_urls.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-gray-900/75 text-white px-2 py-1 rounded text-xs font-medium">
              {listing.image_urls.length} photos
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold text-brand-primary line-clamp-2 group-hover:text-brand-tertiary transition-colors">
              {listing.title}
            </h3>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="line-clamp-2">
              <p className="text-xs text-gray-500">{listing.location}</p>
              <p className="font-medium">{listing.city}</p>
            </div>
          </div>

          {/* Owner Info (if shown) */}
          {showOwner && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <div className="flex-1">
                <p className="text-xs text-gray-600">Owner</p>
                <p className="text-sm font-medium text-gray-900">{ownerName}</p>
              </div>
              {ownerRating && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-900">{ownerRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          {/* Description Preview */}
          <p className="text-xs text-gray-600 line-clamp-2">
            {listing.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
