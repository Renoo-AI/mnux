'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  AlertCircle,
  Coffee,
  MinusCircle
} from 'lucide-react';
import type { Table, TableStatus, Order } from '@/types';

interface TableCardProps {
  table: Table;
  activeOrder?: Order | null;
  orderAge?: number; // seconds since order created
  onAction?: (action: 'accept' | 'reject' | 'paid' | 'close' | 'cancel', table: Table) => void;
  isLoading?: boolean;
}

const statusConfig: Record<TableStatus, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  ringColor: string;
  icon: typeof Clock;
  label: string;
  labelAr: string;
}> = {
  EMPTY: {
    color: 'text-[#5A4A3D]',
    bgColor: 'bg-[#F5F0EC]',
    borderColor: 'border-[#E0D8D0]',
    ringColor: '',
    icon: MinusCircle,
    label: 'Available',
    labelAr: 'متاحة',
  },
  NEW_ORDER: {
    color: 'text-[#92400E]',
    bgColor: 'bg-[#FEF3C7]',
    borderColor: 'border-[#F59E0B]',
    ringColor: 'ring-4 ring-[#F59E0B]/20',
    icon: AlertCircle,
    label: 'New Order',
    labelAr: 'طلب جديد',
  },
  ACTIVE: {
    color: 'text-[#166534]',
    bgColor: 'bg-[#DCFCE7]',
    borderColor: 'border-[#22C55E]',
    ringColor: '',
    icon: Coffee,
    label: 'Active',
    labelAr: 'نشط',
  },
  AWAITING_PAYMENT: {
    color: 'text-[#1E40AF]',
    bgColor: 'bg-[#DBEAFE]',
    borderColor: 'border-[#3B82F6]',
    ringColor: 'ring-4 ring-[#3B82F6]/20',
    icon: DollarSign,
    label: 'Bill Requested',
    labelAr: 'طلب الفاتورة',
  },
  OFFLINE: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    ringColor: '',
    icon: XCircle,
    label: 'Offline',
    labelAr: 'غير متصل',
  },
};

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function TableCard({ table, activeOrder, orderAge, onAction, isLoading }: TableCardProps) {
  const config = statusConfig[table.status];
  const Icon = config.icon;
  
  const isUrgent = orderAge && orderAge > 300; // 5+ minutes
  const isVeryUrgent = orderAge && orderAge > 600; // 10+ minutes
  
  // Extract table number from name (e.g., "T-01" -> "01")
  const tableNumber = table.name.replace(/[^0-9]/g, '') || table.name;
  
  return (
    <Card className={`
      relative overflow-hidden transition-all duration-200 hover:shadow-xl
      ${config.borderColor} ${config.bgColor}
      ${config.ringColor}
      ${isUrgent && table.status === 'NEW_ORDER' ? 'animate-pulse' : ''}
    `}>
      {/* Status indicator bar at top */}
      <div className={`h-2 w-full ${config.borderColor.replace('border-', 'bg-')}`} />
      
      <CardContent className="p-5">
        {/* Header with BIG table number */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Large table number */}
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center
              ${table.status === 'NEW_ORDER' ? 'bg-[#F59E0B]' : 
                table.status === 'AWAITING_PAYMENT' ? 'bg-[#3B82F6]' :
                table.status === 'ACTIVE' ? 'bg-[#22C55E]' : 
                'bg-white border-2 border-[#E0D8D0]'}
              shadow-lg
            `}>
              <span className={`
                text-2xl font-bold
                ${table.status === 'EMPTY' ? 'text-[#5A4A3D]' : 'text-white'}
              `}>
                {tableNumber}
              </span>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-[#3A322D]">{table.name}</h3>
              <p className="text-sm text-[#5A4A3D]">{table.seats} places</p>
            </div>
          </div>
          
          <Badge className={`
            px-3 py-1.5 rounded-full font-semibold text-sm
            ${config.bgColor} ${config.color} border ${config.borderColor}
          `}>
            {config.label}
          </Badge>
        </div>
        
        {/* Order info */}
        {activeOrder && (
          <div className="mb-4 p-4 rounded-xl bg-white/70 border border-white shadow-sm">
            <div className="flex items-center justify-between text-base mb-2">
              <span className="text-[#5A4A3D]">Articles</span>
              <span className="font-bold text-[#3A322D]">
                {activeOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-base mb-2">
              <span className="text-[#5A4A3D]">Total</span>
              <span className="font-bold text-xl text-[#3A322D]">
                {activeOrder.totalAmount.toFixed(2)} DT
              </span>
            </div>
            {orderAge !== undefined && (
              <div className={`
                flex items-center justify-between text-base pt-2 border-t border-[#E0D8D0]
                ${isUrgent ? 'text-[#DC2626] font-semibold' : 'text-[#5A4A3D]'}
              `}>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Attente
                </span>
                <span className="font-semibold">{formatAge(orderAge)}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Big Action Buttons */}
        {table.status === 'NEW_ORDER' && activeOrder && onAction && (
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 py-6 text-lg bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl shadow-lg"
              onClick={() => onAction('accept', table)}
              disabled={isLoading}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Accepter
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="py-6 px-6 text-lg border-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl"
              onClick={() => onAction('reject', table)}
              disabled={isLoading}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Refuser
            </Button>
          </div>
        )}
        
        {table.status === 'ACTIVE' && activeOrder && onAction && (
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 py-6 text-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl shadow-lg"
              onClick={() => onAction('paid', table)}
              disabled={isLoading}
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Encaisser
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="py-6 px-6 text-lg border-2 border-[#F59E0B] text-[#B45309] hover:bg-[#FEF3C7] rounded-xl"
              onClick={() => onAction('cancel', table)}
              disabled={isLoading}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Annuler
            </Button>
          </div>
        )}
        
        {table.status === 'AWAITING_PAYMENT' && activeOrder && onAction && (
          <Button
            size="lg"
            className="w-full py-6 text-lg bg-[#3A322D] hover:bg-[#5A4A3D] text-white rounded-xl shadow-lg"
            onClick={() => onAction('close', table)}
            disabled={isLoading}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Libérer la table
          </Button>
        )}
        
        {table.status === 'EMPTY' && (
          <div className="text-center py-3 text-[#5A4A3D] text-base">
            Prête pour une nouvelle commande
          </div>
        )}
        
        {table.status === 'OFFLINE' && (
          <div className="text-center py-3 text-gray-400 text-base">
            Table hors service
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TableCard;
