/**
 * QR Display Component
 * 
 * File Purpose:
 * - Generate and display QR code for booking verification
 * - Show QR code to renter for handover at pickup
 * - Include booking details and instructions
 * 
 * Props:
 * - bookingId: Booking ID
 * - qrSecret: Secret token for verification
 * - listingTitle: Name of the item being rented
 * - checkInDate: Pickup date
 * 
 * Features:
 * - QR code generation with booking data
 * - Downloadable QR code image
 * - Clear instructions for renter
 * - Mobile-friendly display
 * 
 * Dependencies:
 * - qrcode.react for QR generation
 * 
 * History:
 * - 2025-12-11: Created for Phase 5.6 QR handover system
 */

'use client';

import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRDisplayProps {
  bookingId: string;
  qrSecret: string;
  listingTitle: string;
  checkInDate: string;
  isHandedOver?: boolean;
}

export default function QRDisplay({
  bookingId,
  qrSecret,
  listingTitle,
  checkInDate,
  isHandedOver = false
}: QRDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // QR code contains: bookingId and secret separated by pipe
  const qrValue = `${bookingId}|${qrSecret}`;

  const handleDownload = () => {
    if (!qrRef.current) return;

    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `swoopings-booking-${bookingId.slice(0, 8)}.png`;
    link.href = url;
    link.click();
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-brand-primary mb-2">
          {isHandedOver ? 'Item Handover Confirmed' : 'Your Pickup QR Code'}
        </h3>
        <p className="text-sm text-gray-600">
          {isHandedOver 
            ? 'The owner has confirmed item handover. Enjoy your rental!'
            : 'Show this QR code to the owner when picking up your item'
          }
        </p>
      </div>

      {isHandedOver ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-green-900 mb-2">Handover Complete!</p>
          <p className="text-sm text-green-700">
            Item received successfully. Have a great time with your rental.
          </p>
        </div>
      ) : (
        <>
          {/* QR Code */}
          <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-brand-secondary">
            <div ref={qrRef}>
              <QRCodeCanvas
                value={qrValue}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#0B2D29"
                bgColor="#FFFFFF"
              />
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-brand-neutralgreen border border-brand-tertiary rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-brand-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="font-medium text-brand-primary">Item:</span>
              <span className="text-brand-primary">{listingTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-brand-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-brand-primary">Pickup:</span>
              <span className="text-brand-primary">{formatDate(checkInDate)}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="font-medium text-brand-primary">Pickup Instructions:</h4>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <span>Meet the owner at the agreed pickup location and time</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <span>Show this QR code on your phone (or printed copy)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <span>Owner will scan the code to confirm handover</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  4
                </span>
                <span>Enjoy your rental and return it on time!</span>
              </li>
            </ol>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full px-4 py-2 bg-brand-secondary text-brand-primary border border-brand-tertiary rounded-lg font-medium
              hover:bg-brand-tertiary hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download QR Code
          </button>

          {/* Security Note */}
          <div className="bg-brand-lightpink border border-brand-accent rounded-lg p-3 text-xs text-gray-600">
            <strong className="text-brand-accent">Security:</strong> This QR code is unique to your booking. 
            Don't share it with anyone except the owner at pickup.
          </div>
        </>
      )}
    </div>
  );
}
