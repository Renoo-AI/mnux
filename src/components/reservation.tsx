'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Phone, User, MessageSquare, Check, AlertCircle, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Reservation {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  date: string;
  time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  createdAt: Date;
}

interface ReservationModalProps {
  tableId: string;
  tableName: string;
  existingReservation?: Reservation;
  onSave: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30'
];

export function ReservationModal({
  tableId,
  tableName,
  existingReservation,
  onSave,
  onClose,
}: ReservationModalProps) {
  const [customerName, setCustomerName] = useState(existingReservation?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(existingReservation?.customerPhone || '');
  const [partySize, setPartySize] = useState(existingReservation?.partySize || 2);
  const [date, setDate] = useState(existingReservation?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(existingReservation?.time || '19:00');
  const [notes, setNotes] = useState(existingReservation?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!customerPhone.trim()) newErrors.customerPhone = 'Phone number is required';
    if (!date) newErrors.date = 'Date is required';
    if (!time) newErrors.time = 'Time is required';
    if (partySize < 1) newErrors.partySize = 'Party size must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onSave({
      tableId,
      tableName,
      customerName,
      customerPhone,
      partySize,
      date,
      time,
      notes: notes || undefined,
      status: 'pending',
    });
    setIsSaving(false);
    onClose();
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  // Get max date (3 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-display text-title-md text-primary">
              {existingReservation ? 'Edit Reservation' : 'New Reservation'}
            </h2>
            <p className="text-on-surface-variant text-sm">{tableName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Customer Name */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              CUSTOMER NAME <span className="text-error">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className={`w-full pl-12 pr-4 py-3 rounded-xl ${errors.customerName ? 'border-error ring-2 ring-error-container' : ''}`}
              />
            </div>
            {errors.customerName && (
              <p className="text-error text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.customerName}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              PHONE NUMBER <span className="text-error">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <Input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className={`w-full pl-12 pr-4 py-3 rounded-xl ${errors.customerPhone ? 'border-error ring-2 ring-error-container' : ''}`}
              />
            </div>
            {errors.customerPhone && (
              <p className="text-error text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.customerPhone}
              </p>
            )}
          </div>

          {/* Party Size */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              PARTY SIZE
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors"
              >
                -
              </button>
              <span className="font-display text-2xl text-primary w-12 text-center">{partySize}</span>
              <button
                type="button"
                onClick={() => setPartySize(Math.min(20, partySize + 1))}
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors"
              >
                +
              </button>
              <Users className="w-5 h-5 text-on-surface-variant ml-2" />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              DATE <span className="text-error">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <Input
                type="date"
                value={date}
                min={today}
                max={maxDate.toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl ${errors.date ? 'border-error ring-2 ring-error-container' : ''}`}
              />
            </div>
            {errors.date && (
              <p className="text-error text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.date}
              </p>
            )}
          </div>

          {/* Time Slots */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              TIME <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                    time === slot
                      ? 'bg-secondary text-white shadow-md'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            {errors.time && (
              <p className="text-error text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.time}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              SPECIAL REQUESTS
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-on-surface-variant" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, special occasions, seating preferences..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary-fixed/20 transition-all resize-none h-24"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 py-3 rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-3 rounded-full bg-secondary text-white"
          >
            {isSaving ? 'Saving...' : existingReservation ? 'Update Reservation' : 'Create Reservation'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ReservationCardProps {
  reservation: Reservation;
  onConfirm?: () => void;
  onSeat?: () => void;
  onCancel?: () => void;
  onCall?: () => void;
  compact?: boolean;
}

export function ReservationCard({
  reservation,
  onConfirm,
  onSeat,
  onCancel,
  onCall,
  compact = false,
}: ReservationCardProps) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-secondary-fixed text-on-secondary-fixed-variant border-secondary-fixed',
    seated: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
    cancelled: 'bg-error-container text-on-error-container border-error',
  };

  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    seated: 'Seated',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-primary truncate">{reservation.customerName}</p>
          <p className="text-xs text-on-surface-variant">
            {reservation.partySize} guests • {reservation.time}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[reservation.status]}`}>
          {statusLabels[reservation.status]}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-outline-variant/10 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-display text-title-sm text-primary">{reservation.customerName}</h3>
          <p className="text-on-surface-variant text-sm">{reservation.tableName}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[reservation.status]}`}>
          {statusLabels[reservation.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{reservation.date}</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{reservation.time}</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Users className="w-4 h-4" />
          <span className="text-sm">{reservation.partySize} guests</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Phone className="w-4 h-4" />
          <span className="text-sm">{reservation.customerPhone}</span>
        </div>
      </div>

      {reservation.notes && (
        <div className="mb-4 p-3 bg-surface-container-low rounded-xl">
          <p className="text-sm text-on-surface-variant italic">&quot;{reservation.notes}&quot;</p>
        </div>
      )}

      <div className="flex gap-2">
        {reservation.status === 'pending' && (
          <>
            <Button
              size="sm"
              onClick={onConfirm}
              className="flex-1 bg-secondary text-white rounded-full"
            >
              <Check className="w-4 h-4 mr-1" /> Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-error text-error rounded-full"
            >
              Cancel
            </Button>
          </>
        )}
        {reservation.status === 'confirmed' && (
          <>
            <Button
              size="sm"
              onClick={onSeat}
              className="flex-1 bg-primary text-white rounded-full"
            >
              <Users className="w-4 h-4 mr-1" /> Seat Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCall}
              className="rounded-full"
            >
              <PhoneCall className="w-4 h-4" />
            </Button>
          </>
        )}
        {reservation.status === 'seated' && (
          <Button
            size="sm"
            onClick={onCancel}
            className="flex-1 bg-success text-white rounded-full"
          >
            Order Ready
          </Button>
        )}
      </div>
    </div>
  );
}

export type { Reservation };
