/**
 * QR Scanner Component
 * 
 * File Purpose:
 * - Camera-based QR code scanner for owners
 * - Scan renter's QR code at pickup to confirm handover
 * - Validate QR code and update booking status
 * 
 * Props:
 * - bookingId: Expected booking ID
 * - onScanSuccess: Callback when scan is successful
 * - onScanError: Callback when scan fails
 * 
 * Features:
 * - Camera access and QR scanning
 * - Real-time validation
 * - Success/error feedback
 * - Mobile-friendly camera controls
 * 
 * Dependencies:
 * - html5-qrcode for scanning
 * 
 * History:
 * - 2025-12-11: Created for Phase 5.6 QR handover system
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuthContext } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

interface QRScannerProps {
  bookingId: string;
  onScanSuccess: () => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({
  bookingId,
  onScanSuccess,
  onScanError
}: QRScannerProps) {
  const { user } = useAuthContext();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  const startScanning = async () => {
    if (!user) {
      setError('You must be logged in to scan QR codes');
      return;
    }

    try {
      setError(null);
      setIsScanning(true);
      hasScannedRef.current = false;

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Prevent multiple scans
          if (hasScannedRef.current || isProcessing) return;
          hasScannedRef.current = true;
          setIsProcessing(true);

          try {
            // Parse QR code: bookingId|secret
            const [scannedBookingId, qrSecret] = decodedText.split('|');

            if (!scannedBookingId || !qrSecret) {
              throw new Error('Invalid QR code format');
            }

            if (scannedBookingId !== bookingId) {
              throw new Error('This QR code is for a different booking');
            }

            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
              throw new Error('Authentication required');
            }

            // Confirm handover via API
            const apiResponse = await fetch(`/api/bookings/${bookingId}/handover`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                qr_secret: qrSecret,
                confirmed_by: user.id,
              }),
            });

            const response = await apiResponse.json();

            if (!response.success) {
              throw new Error(response.message || 'Failed to confirm handover');
            }

            // Success!
            setSuccess(true);
            await stopScanning();
            
            // Call success callback after a brief delay
            setTimeout(() => {
              onScanSuccess();
            }, 1500);

          } catch (err: unknown) {
            const error = err as Error;
            const errorMessage = error.message || 'Failed to process QR code';
            setError(errorMessage);
            if (onScanError) onScanError(errorMessage);
            hasScannedRef.current = false;
            setIsProcessing(false);
          }
        },
        () => {
          // Scanning error - ignore, keep scanning
        }
      );
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Scanner error:', error);
      setError('Failed to start camera. Please allow camera access.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    scannerRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanning();
      }
    };
  }, []);

  if (success) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-green-900 mb-2">Handover Confirmed!</h3>
          <p className="text-sm text-green-700">
            Item successfully handed over to renter. The booking has been updated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-brand-primary mb-2">Scan Renter's QR Code</h3>
        <p className="text-sm text-gray-600">
          Ask the renter to show their booking QR code, then scan it to confirm handover
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-900">Scan Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!isScanning ? (
        <div className="space-y-4">
          <button
            onClick={startScanning}
            className="w-full px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold
              hover:bg-brand-tertiary transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Start Camera & Scan
          </button>

          <div className="bg-brand-neutralgreen border border-brand-tertiary rounded-lg p-4 space-y-2 text-sm text-brand-primary">
            <p className="font-medium">Scanner Instructions:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Allow camera access when prompted</li>
              <li>Point camera at renter's QR code</li>
              <li>Keep camera steady until scan completes</li>
              <li>Ensure good lighting for best results</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Scanner viewport */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
            <div id="qr-reader" className="w-full"></div>
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p>Processing...</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={stopScanning}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold
              hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop Scanning
          </button>
        </div>
      )}
    </div>
  );
}
