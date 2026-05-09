'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import type { Order, Table } from '@/types';

interface OrderActionButtonsProps {
  order: Order;
  table: Table;
  onAccept: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onMarkPaid: () => Promise<void>;
  onClose: () => Promise<void>;
  onCancel: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function OrderActionButtons({
  order,
  table,
  onAccept,
  onReject,
  onMarkPaid,
  onClose,
  onCancel,
  isLoading,
}: OrderActionButtonsProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) return;
    setProcessing(true);
    try {
      await onReject(reason);
      setShowRejectDialog(false);
      setReason('');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!reason.trim()) return;
    setProcessing(true);
    try {
      await onCancel(reason);
      setShowCancelDialog(false);
      setReason('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {order.status === 'CREATED' && (
          <>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
              onClick={onAccept}
              disabled={isLoading || processing}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Accept
            </Button>
            <Button
              variant="destructive"
              className="flex-1 min-w-[120px]"
              onClick={() => setShowRejectDialog(true)}
              disabled={isLoading || processing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </>
        )}

        {order.status === 'ACCEPTED' && (
          <>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
              onClick={onMarkPaid}
              disabled={isLoading || processing}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4 mr-1" />
              )}
              Mark Paid
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 min-w-[120px]"
              onClick={() => setShowCancelDialog(true)}
              disabled={isLoading || processing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </>
        )}

        {order.status === 'PAID' && (
          <Button
            className="w-full bg-[#3A322D] hover:bg-[#5A4A3D] text-white"
            onClick={onClose}
            disabled={isLoading || processing}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Close Order
          </Button>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Reject Order
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this order. This will be visible to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason *</Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g., Item out of stock, Kitchen closed..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!reason.trim() || processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="e.g., Customer request, Mistake..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!reason.trim() || processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OrderActionButtons;
