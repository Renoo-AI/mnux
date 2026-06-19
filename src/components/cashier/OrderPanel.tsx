'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  ShoppingBag,
  ChefHat,
  Printer,
  MessageSquare,
  Utensils,
  CheckCheck,
  CreditCard
} from 'lucide-react';
import type { Order, OrderStatus } from '@/types';

interface OrderPanelProps {
  order: Order | null;
  onAccept?: () => void;
  onReject?: () => void;
  onMarkPaid?: () => void;
  onClose?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const statusConfig: Record<OrderStatus, {
  color: string;
  bgColor: string;
  icon: typeof Clock;
  label: string;
}> = {
  CREATED: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    icon: Clock,
    label: 'New Order',
  },
  ACCEPTED: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: ChefHat,
    label: 'In Progress',
  },
  PREPARING: {
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    icon: Utensils,
    label: 'En préparation',
  },
  SERVED: {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: CheckCheck,
    label: 'Servi',
  },
  BILL_REQUESTED: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: CreditCard,
    label: 'Addition demandée',
  },
  REJECTED: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: XCircle,
    label: 'Rejected',
  },
  PAID: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: DollarSign,
    label: 'Paid',
  },
  CLOSED: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: CheckCircle,
    label: 'Closed',
  },
  CANCELLED: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: XCircle,
    label: 'Cancelled',
  },
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} TND`;
}

export function OrderPanel({ 
  order, 
  onAccept, 
  onReject, 
  onMarkPaid, 
  onClose, 
  onCancel,
  isLoading 
}: OrderPanelProps) {
  if (!order) {
    return (
      <Card className="h-full border-0 shadow-none bg-transparent">
        <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-200 mb-4" />
          <h3 className="font-medium text-[#3A322D] mb-1">No Order Selected</h3>
          <p className="text-sm text-[#5A4A3D]">
            Select a table to view order details
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const config = statusConfig[order.status];
  const StatusIcon = config.icon;
  
  return (
    <Card className="h-full border-[#EFE4D8] bg-white">
      <CardHeader className="pb-3 border-b border-[#EFE4D8]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif text-[#3A322D]">
            Order #{order.id.slice(-6).toUpperCase()}
          </CardTitle>
          <Badge className={`${config.bgColor} ${config.color} border-0`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-[#5A4A3D]">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(order.createdAt)}
          </span>
          <span>Table: {order.tableName}</span>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1">
        <CardContent className="p-4 space-y-4">
          {/* Items list */}
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={`${item.itemId}-${index}`} className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#3A322D]">{item.quantity}x</span>
                    <span className="text-[#3A322D]">{item.name}</span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-[#5A4A3D] mt-0.5 ml-6 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {item.notes}
                    </p>
                  )}
                </div>
                <span className="text-sm font-medium text-[#3A322D]">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          
          <Separator className="bg-[#EFE4D8]" />
          
          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#5A4A3D]">Subtotal</span>
              <span className="text-[#3A322D]">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span className="text-[#3A322D]">Total</span>
              <span className="text-[#3A322D]">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
          
          {order.notes && (
            <>
              <Separator className="bg-[#EFE4D8]" />
              <div className="p-3 rounded-lg bg-[#EFE4D8]/30">
                <p className="text-xs text-[#5A4A3D] mb-1">Order Notes:</p>
                <p className="text-sm text-[#3A322D]">{order.notes}</p>
              </div>
            </>
          )}
          
          {order.rejectReason && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-600 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-700">{order.rejectReason}</p>
            </div>
          )}
          
          {order.cancelReason && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-600 mb-1">Cancellation Reason:</p>
              <p className="text-sm text-red-700">{order.cancelReason}</p>
            </div>
          )}
        </CardContent>
      </ScrollArea>
      
      {/* Actions */}
      <div className="p-4 border-t border-[#EFE4D8] bg-[#FCFBF9]">
        {order.status === 'CREATED' && (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={onAccept}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept Order
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onReject}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
        
        {order.status === 'ACCEPTED' && (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onMarkPaid}
              disabled={isLoading}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Mark as Paid
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={onCancel}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        )}
        
        {order.status === 'PAID' && (
          <Button
            className="w-full bg-[#3A322D] hover:bg-[#5A4A3D] text-white"
            onClick={onClose}
            disabled={isLoading}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Close Order
          </Button>
        )}
        
        {order.status === 'CLOSED' && (
          <div className="text-center text-sm text-green-600 flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Order completed
          </div>
        )}
        
        {(order.status === 'REJECTED' || order.status === 'CANCELLED') && (
          <div className="text-center text-sm text-red-600 flex items-center justify-center gap-2">
            <XCircle className="h-4 w-4" />
            Order {order.status.toLowerCase()}
          </div>
        )}
        
        {/* Print button */}
        <Button
          variant="outline"
          className="w-full mt-2 border-[#EFE4D8]"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4 mr-1" />
          Print Receipt
        </Button>
      </div>
    </Card>
  );
}

export default OrderPanel;
