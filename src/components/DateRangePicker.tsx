/**
 * Date Range Picker Component
 * 
 * File Purpose:
 * - Allow users to select check-in and check-out dates for a booking
 * - Show calendar with available dates
 * - Display price calculation based on selected dates
 * - Visualize unavailable dates separately (owner availability vs booked)
 * - Validate against booking conflicts
 * 
 * Props:
 * - onDateRangeChange: Callback when dates are selected
 * - pricePerDay: Price per day for calculation
 * - unavailableDates: Array of YYYY-MM-DD dates unavailable for check-in (owner availability)
 * - bookedDates: Array of objects {check_in_date, check_out_date} of confirmed/pending bookings
 * - onBookingConflict: Callback when selected range overlaps existing bookings
 * 
 * Visual Indicators:
 * - Gray: Past dates or non-pickup days (owner availability)
 * - Diagonal lines: Booked dates (existing confirmed/pending bookings)
 * - Blue-600: Check-in and check-out dates
 * - Blue-200: Selected range (all days between check-in and check-out)
 * - Red border: If range contains booked dates (conflict)
 * 
 * Logic:
 * - Check-in must be on a day where owner allows pickups
 * - Entire rental period (check-in to check-out) is highlighted same color
 * - If any date in range is booked, show conflict and prevent booking
 * - Suggest user book until last available date before first booked date
 * 
 * History:
 * - 2025-12-07: Initial creation
 * - 2025-12-10: Enhanced with booked date visualization and conflict detection
 */

'use client';

import { useState } from 'react';

interface BookingRange {
  check_in_date: string;
  check_out_date: string;
  status: 'confirmed' | 'pending';
}

interface BlackoutPeriod {
  start_date: string;
  end_date: string;
}

interface DateRangePickerProps {
  onDateRangeChange: (checkIn: string, checkOut: string, totalPrice: number) => void;
  pricePerDay: number;
  unavailableDates?: string[];
  bookedDates?: BookingRange[];
  blackoutDates?: BlackoutPeriod[];
  onBookingConflict?: (conflictMessage: string, suggestedCheckOut?: string) => void;
}

export default function DateRangePicker({
  onDateRangeChange,
  pricePerDay,
  unavailableDates = [],
  bookedDates = [],
  blackoutDates = [],
  onBookingConflict,
}: DateRangePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [currentMonth, setCurrentMonth] = useState(new Date(today));
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [suggestedCheckOut, setSuggestedCheckOut] = useState<string | null>(null);

  const formatDateISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseISO = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const isDateUnavailableForPickup = (date: Date): boolean => {
    const dateString = formatDateISO(date);
    return unavailableDates.includes(dateString);
  };

  const isDateBooked = (date: Date): boolean => {
    const dateStr = formatDateISO(date);
    return bookedDates.some(booking => {
      const startDate = booking.check_in_date;
      const endDate = booking.check_out_date;
      return dateStr >= startDate && dateStr < endDate;
    });
  };

  const isDateBlackedOut = (date: Date): boolean => {
    const dateStr = formatDateISO(date);
    return blackoutDates.some(blackout => {
      const startDate = blackout.start_date;
      const endDate = blackout.end_date;
      return dateStr >= startDate && dateStr <= endDate; // Include both start and end
    });
  };

  const hasBookingConflict = (start: Date, end: Date): { hasConflict: boolean } => {
    let current = new Date(start);
    while (current < end) {
      const dateStr = formatDateISO(current);
      const conflicting = bookedDates.find(booking => 
        dateStr >= booking.check_in_date && dateStr < booking.check_out_date
      );
      if (conflicting) {
        return { hasConflict: true };
      }
      current.setDate(current.getDate() + 1);
    }
    return { hasConflict: false };
  };

  const hasBlackoutConflict = (start: Date, end: Date): { hasConflict: boolean } => {
    let current = new Date(start);
    while (current < end) {
      const dateStr = formatDateISO(current);
      const conflicting = blackoutDates.find(blackout => 
        dateStr >= blackout.start_date && dateStr <= blackout.end_date
      );
      if (conflicting) {
        return { hasConflict: true };
      }
      current.setDate(current.getDate() + 1);
    }
    return { hasConflict: false };
  };

  const getLastAvailableCheckOut = (checkIn: Date): string | null => {
    // Combine booked dates and blackout dates to find first conflict
    const bookedAfterCheckIn = bookedDates
      .filter(booking => {
        const bookingStart = parseISO(booking.check_in_date);
        return bookingStart > checkIn;
      })
      .map(booking => ({ date: parseISO(booking.check_in_date), type: 'booking' }));
    
    const blackoutsAfterCheckIn = blackoutDates
      .filter(blackout => {
        const blackoutStart = parseISO(blackout.start_date);
        return blackoutStart > checkIn;
      })
      .map(blackout => ({ date: parseISO(blackout.start_date), type: 'blackout' }));
    
    const allConflicts = [...bookedAfterCheckIn, ...blackoutsAfterCheckIn]
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (allConflicts.length === 0) {
      return null;
    }

    const firstConflict = allConflicts[0];
    const lastAvailable = new Date(firstConflict.date);
    lastAvailable.setDate(lastAvailable.getDate() - 1);
    return formatDateISO(lastAvailable);
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) return;
    if (isDateUnavailableForPickup(selectedDate)) return;

    if (!checkInDate) {
      setCheckInDate(selectedDate);
      setCheckOutDate(null);
      setConflictMessage(null);
      setSuggestedCheckOut(null);
    } else if (!checkOutDate) {
      if (selectedDate <= checkInDate) {
        setCheckInDate(selectedDate);
        setCheckOutDate(null);
        setConflictMessage(null);
        setSuggestedCheckOut(null);
      } else {
        const bookingConflict = hasBookingConflict(checkInDate, selectedDate);
        const blackoutConflict = hasBlackoutConflict(checkInDate, selectedDate);
        
        if (bookingConflict.hasConflict || blackoutConflict.hasConflict) {
          const conflictType = blackoutConflict.hasConflict ? 'owner blackout periods' : 'existing bookings';
          const lastAvailable = getLastAvailableCheckOut(checkInDate);
          const message = lastAvailable 
            ? `Cannot book during this period. There are ${conflictType} between ${formatDateISO(checkInDate)} and ${formatDateISO(selectedDate)}. You can book until ${lastAvailable}.`
            : `Cannot book this date range due to ${conflictType}.`;
          
          setConflictMessage(message);
          setSuggestedCheckOut(lastAvailable);
          
          if (onBookingConflict) {
            onBookingConflict(message, lastAvailable || undefined);
          }
          return;
        }
        
        setCheckOutDate(selectedDate);
        setConflictMessage(null);
        setSuggestedCheckOut(null);
        
        const days = Math.ceil((selectedDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = days * pricePerDay;
        onDateRangeChange(formatDateISO(checkInDate), formatDateISO(selectedDate), totalPrice);
      }
    } else {
      setCheckInDate(selectedDate);
      setCheckOutDate(null);
      setConflictMessage(null);
      setSuggestedCheckOut(null);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const totalDays = checkInDate && checkOutDate
    ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const totalPrice = totalDays * pricePerDay;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Dates</h3>

      {/* Legend */}
      <div className="mb-4 p-3 bg-brand-neutralgreen border border-brand-tertiary rounded text-sm">
        <p className="font-medium text-brand-primary mb-2">Calendar Legend:</p>
        <div className="space-y-1 text-brand-primary">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-100 rounded"></div>
            <span>Past dates or non-available pickup days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white border-2 border-brand-accent rounded relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 10 10">
                <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="0.6" className="text-brand-accent" />
                <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="0.6" className="text-brand-accent" />
              </svg>
            </div>
            <span>Already booked by someone else</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white border-2 border-gray-400 rounded relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 10 10">
                <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="0.6" className="text-gray-400" />
                <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="0.6" className="text-gray-400" />
              </svg>
            </div>
            <span>Owner blackout (maintenance/personal use)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-brand-primary rounded"></div>
            <span>Your check-in/check-out dates</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-brand-secondary rounded"></div>
            <span>Your entire rental period</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded text-gray-600"
          >
            ← Prev
          </button>
          <h4 className="text-center font-medium text-gray-900 min-w-max">{monthName}</h4>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded text-gray-600"
          >
            Next →
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-10"></div>;
            }

            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            date.setHours(0, 0, 0, 0);
            
            const isPast = date < today;
            const isPickupUnavailable = isDateUnavailableForPickup(date);
            const isBooked = isDateBooked(date);
            const isBlackedOut = isDateBlackedOut(date);
            const isCheckIn = checkInDate && formatDateISO(date) === formatDateISO(checkInDate);
            const isCheckOut = checkOutDate && formatDateISO(date) === formatDateISO(checkOutDate);
            // Include dates in range regardless of pickup unavailability - we want to show the full range!
            const isInRange = checkInDate && checkOutDate && date > checkInDate && date < checkOutDate;
            const isPartOfSelection = isCheckIn || isCheckOut || isInRange;

            // Can only click if: it's a valid pickup day AND (we haven't selected check-in yet OR it's after check-in for checkout)
            const isClickable = !isPast && !isPickupUnavailable && (!checkInDate || !checkOutDate || date > checkInDate);
            const isDisabled = !isClickable || (isBooked && !isPartOfSelection) || (isBlackedOut && !isPartOfSelection);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={isDisabled}
                className={`
                  h-10 rounded text-sm font-medium transition-colors relative overflow-hidden
                  ${isPartOfSelection ? 'text-brand-primary' : ''}
                  ${isCheckIn || isCheckOut ? 'bg-brand-primary text-white border-2 border-brand-neutralgreen' : ''}
                  ${isInRange ? 'bg-brand-secondary text-brand-primary' : ''}
                  ${isPast || (isPickupUnavailable && !isPartOfSelection) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                  ${!isPast && !isPartOfSelection && !isPickupUnavailable && !isBooked && !isBlackedOut ? 'bg-white text-gray-900 hover:bg-brand-neutralgreen border border-gray-200' : ''}
                  ${isBooked && !isPartOfSelection ? 'bg-white text-gray-900 cursor-not-allowed border border-brand-accent' : ''}
                  ${isBooked && isPartOfSelection ? 'bg-brand-secondary text-brand-primary border-2 border-brand-accent' : ''}
                  ${isBlackedOut && !isPartOfSelection ? 'bg-white text-gray-900 cursor-not-allowed border border-gray-400' : ''}
                  ${isBlackedOut && isPartOfSelection ? 'bg-brand-secondary text-brand-primary border-2 border-gray-400' : ''}
                  ${isDisabled && !isPast && !isPickupUnavailable && !isBooked && !isBlackedOut ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                {day}
                {/* Diagonal lines pattern for booked dates */}
                {isBooked && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40">
                    <defs>
                      <pattern id={`diagonal-hatch-booked-${day}`} patternUnits="userSpaceOnUse" width="4" height="4">
                        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke={isPartOfSelection ? '#FF97AD' : '#FFD9E1'} strokeWidth="0.6" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#diagonal-hatch-booked-${day})`} />
                  </svg>
                )}
                {/* Diagonal lines pattern for blackout dates (darker gray) */}
                {isBlackedOut && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40">
                    <defs>
                      <pattern id={`diagonal-hatch-blackout-${day}`} patternUnits="userSpaceOnUse" width="4" height="4">
                        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke={isPartOfSelection ? '#6B7280' : '#9CA3AF'} strokeWidth="0.6" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#diagonal-hatch-blackout-${day})`} />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conflict message */}
      {conflictMessage && (
        <div className="mb-4 p-3 bg-brand-lightpink border border-brand-accent rounded-lg">
          <p className="text-sm text-brand-accent">{conflictMessage}</p>
          {suggestedCheckOut && (
            <p className="text-sm text-brand-accent mt-2">
              <button
                onClick={() => {
                  const suggested = parseISO(suggestedCheckOut);
                  handleDateClick(suggested.getDate());
                }}
                className="underline hover:font-semibold"
              >
                Book until {suggestedCheckOut}
              </button>
            </p>
          )}
        </div>
      )}

      {/* Selected dates and price */}
      {checkInDate && checkOutDate && (
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Check-in (Pick-up):</span>
              <span className="font-medium text-brand-primary">{formatDateISO(checkInDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Check-out (Return):</span>
              <span className="font-medium text-brand-primary">{formatDateISO(checkOutDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Number of days:</span>
              <span className="font-medium text-brand-primary">{totalDays}</span>
            </div>
          </div>
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <span className="font-semibold text-brand-primary">Total Price:</span>
            <span className="text-2xl font-bold text-brand-tertiary">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {(!checkInDate || !checkOutDate) && (
        <p className="text-center text-sm text-gray-500">
          {!checkInDate ? 'Click a pickup date to start' : 'Click a return date to complete your selection'}
        </p>
      )}
    </div>
  );
}
