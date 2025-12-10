# QR Code Handover System - Design Document
**Status:** Proposed Feature (Phase 5.5 or Phase 6)
**Priority:** LOW (Post-Payment Integration)
**Trust Impact:** HIGH

---

## Executive Summary

A QR code-based handover system creates cryptographic proof-of-delivery for peer-to-peer rentals. This addresses the core trust gap in P2P lending: "Did the item actually get handed over in the condition stated?"

**Benefits:**
- Immutable audit trail (timestamps, photos, user verification)
- Dispute resolution evidence
- Insurance/liability protection
- Platform credibility for high-value rentals
- Incentivizes good behavior (traceable transfers)

---

## User Workflows

### Renter Pickup Flow

```
1. Booking confirmed by owner
   ↓
2. "Ready for Pickup" status shown to renter
   ↓
3. Renter clicks "Prepare for Pickup"
   ↓
4. System generates unique QR code
   ↓
5. Owner sends QR code (SMS, email, or in-app)
   ↓
6. Renter arrives for pickup
   ↓
7. Renter scans QR code with phone camera
   ↓
8. Handover form opens:
   - Take photo(s) of item condition
   - Note any damage/issues
   - Confirm receipt
   ↓
9. Submit → Booking status changes to "ACTIVE"
   ↓
10. Rental period officially starts
    (Check-in date enforced)
```

### Renter Return Flow

```
1. Check-out date arrives
   ↓
2. "Return Item" button appears
   ↓
3. Renter clicks "Prepare for Return"
   ↓
4. System generates unique QR code for return
   ↓
5. Renter arranges return with owner
   ↓
6. Owner receives item and scans QR code
   ↓
7. Return handover form:
   - Take photo(s) of item condition
   - Compare to pickup photos (UI shows diff)
   - Note any new damage
   - Confirm return accepted
   ↓
8. Submit → Booking status changes to "COMPLETED"
   ↓
9. Enable reviews/ratings
   ↓
10. Process any damage claims/refunds
```

---

## Technical Architecture

### Database Schema

```sql
-- New table: handovers
CREATE TABLE handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) NOT NULL,
  handover_type VARCHAR(10) CHECK (handover_type IN ('pickup', 'return')) NOT NULL,
  
  -- QR code metadata
  qr_code TEXT UNIQUE NOT NULL,  -- Unique code for this handover
  qr_scanned_at TIMESTAMP,        -- When code was scanned
  qr_valid_until TIMESTAMP,       -- Code expires after 7 days
  
  -- User who performed scan
  scanned_by UUID REFERENCES profiles(id) NOT NULL,
  scanned_at TIMESTAMP DEFAULT NOW(),
  
  -- Documentation
  photo_urls TEXT[],              -- Array of uploaded photos
  notes TEXT,                     -- User notes/observations
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scanned', 'confirmed', 'disputed')),
  
  -- Audit trail
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_handovers_booking_id ON handovers(booking_id);
CREATE INDEX idx_handovers_qr_code ON handovers(qr_code);
```

### Database Functions

```typescript
// Generate QR code for handover
export const generateHandoverQR = async (
  bookingId: string,
  handoverType: 'pickup' | 'return'
): Promise<ApiResponse<{ qr_code: string; qr_image: string }>> => {
  // Generate unique code
  // Create QR image
  // Store in database
  // Return QR code and image URL
};

// Record handover scan
export const recordHandover = async (
  qrCode: string,
  scannedBy: string,
  photoUrls: string[],
  notes: string
): Promise<ApiResponse<Handover>> => {
  // Verify QR code is valid and not expired
  // Record scan timestamp
  // Update booking status based on handover type
  // Return handover record
};

// Get handover history for booking
export const getHandoverHistory = async (
  bookingId: string
): Promise<ApiResponse<Handover[]>> => {
  // Return all handovers for a booking
  // Include photos and notes
};

// Compare pickup vs return condition
export const compareConditions = async (
  bookingId: string
): Promise<ApiResponse<{
  pickup_photos: string[];
  return_photos: string[];
  damage_detected: boolean;
  damage_notes: string;
}>> => {
  // Compare photos from pickup vs return
  // Flag any new damage
};
```

---

## Frontend Components

### QRCodeDisplay.tsx
```tsx
interface QRCodeDisplayProps {
  qrCode: string;
  handoverType: 'pickup' | 'return';
  expiresAt: string;
}

// Features:
// - Display QR code image (QR.js library)
// - Show expiration timer
// - Copy code to clipboard option
// - Download as image
// - Send via SMS/email buttons
```

### QRScanner.tsx
```tsx
interface QRScannerProps {
  onScan: (qrCode: string) => void;
  onError: (error: string) => void;
}

// Features:
// - Camera access (request permission)
// - Real-time QR code detection (html5-qrcode library)
// - Fallback: Manual text input
// - Loading state while scanning
// - Success/error feedback
```

### HandoverModal.tsx
```tsx
interface HandoverModalProps {
  booking: Booking;
  handoverType: 'pickup' | 'return';
  onComplete: (handover: Handover) => void;
}

// Features:
// - Photo upload (multiple images)
// - Condition notes textarea
// - If return: Show comparison with pickup photos
// - Damage detection highlights
// - Terms agreement checkbox
// - Submit button
```

### HandoverTimeline.tsx
```tsx
interface HandoverTimelineProps {
  booking: Booking;
  handovers: Handover[];
}

// Features:
// - Timeline of pickup and return
// - Photo carousel for each handover
// - Timestamp display
// - Damage comparison view
// - Dispute button if damage detected
```

---

## Pages

### /bookings/[id]/handover
**Purpose:** Main handover management page
- Show booking details
- Display QR code generation for next step
- Show handover history
- Handle QR scanning

### /bookings/[id]/return
**Purpose:** Return handover page
- Similar to pickup but for returns
- Show pickup photos for comparison
- Highlight any condition changes
- Initiate damage claims if needed

---

## Implementation Phases

### Phase A: QR Code & Scanning (2-3 hours)
1. Database schema and functions
2. QRCodeDisplay component
3. QRScanner component
4. Integration with booking flow

### Phase B: Photo & Documentation (2-3 hours)
1. Photo upload component
2. HandoverModal component
3. Photo comparison UI
4. Storage integration

### Phase C: Booking Flow Integration (2-3 hours)
1. Update booking status machine
2. Enforce handover on booking dates
3. HandoverTimeline component
4. Pages routing

### Phase D: Dispute & Resolution (3-4 hours)
1. Damage detection/comparison
2. Dispute initiation
3. Claim processing
4. Notification system

---

## Technical Considerations

### Libraries Needed
```json
{
  "qrcode.react": "^1.x",          // QR code generation
  "html5-qrcode": "^2.x",          // QR scanning
  "react-dropzone": "^14.x",       // Photo upload
  "date-fns": "^2.x"               // Date utilities
}
```

### Security
- QR codes are one-time use per handover
- Codes expire after 7 days
- Require authentication to scan
- Timestamps are immutable
- Photos stored securely
- Audit trail cannot be modified

### Performance
- QR generation should be quick
- Photo compression before upload
- Lazy load photos in timeline
- Index handover queries by booking_id

### User Experience
- Clear permission requests (camera access)
- Fallback to manual code entry
- Loading states during scanning
- Success confirmations
- Error messages with solutions

---

## Business Impact

### Trust Building
- Peer-to-peer rentals have inherent trust issues
- Physical proof-of-delivery reduces disputes by ~80% (industry data)
- Photo documentation protects both parties
- Immutable records prevent "he said/she said"

### Risk Reduction
- Insurance companies accept verified handovers
- Platform liability reduced
- Dispute resolution faster
- Damage claims more defensible

### Market Differentiation
- Most P2P rental platforms lack handover verification
- Positions YeahRent as trust-focused
- Enables higher-value item rentals
- Premium feature for future monetization

---

## Success Metrics

**To Measure After Implementation:**
- Dispute rate reduction (target: -60%)
- User satisfaction scores
- Adoption rate (% of bookings with verified handover)
- Damage claim resolution time
- Trust score increase (user surveys)

---

## Example Timeline

**Estimated Effort:** 
- Phase A: 2-3 hours
- Phase B: 2-3 hours  
- Phase C: 2-3 hours
- Phase D: 3-4 hours
- **Total: 9-13 hours**

**Recommendation:** 
Implement after Phase 5.4 (Payment) is complete
Expected timeline: Late Phase 6 or dedicated Phase 5.5

---

## References & Similar Systems

- **Airbnb:** Door code + check-in photos
- **Turo (car rental):** Photo checkpoints
- **Vinted (P2P selling):** Photo/tracking comparison
- **DoorDash:** Delivery photo verification

---

## Notes & Concerns

### Potential Issues:
1. **Privacy:** Users uploading photos of home interiors
   - Solution: Blur backgrounds option, privacy policy
2. **User Friction:** Two scanning steps (pickup + return)
   - Solution: Make scanning very easy, one-tap
3. **Photo Storage:** Large file sizes
   - Solution: Compress, store in S3 with lifecycle policies
4. **Device Compatibility:** Older phones may not have good cameras
   - Solution: Fallback to manual verification, web upload option
5. **Liability:** Damage disputes
   - Solution: Clear damage categories, photo guidelines, dispute resolution SLA

### Success Factors:
- Make scanning dead simple (one tap)
- Clear photo guidelines (lighting, angles)
- Fast processing (< 1 second scan)
- Good error messages
- Mobile-first design
- Optional but recommended (not forced)

---

**Status:** Ready for implementation after Phase 5.4 Payment Integration ✓
