'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CreditCard,
  CheckCircle2,
  Clock,
  LogOut,
  RefreshCw,
  Coffee,
  User,
  Check
} from 'lucide-react';
import type { TableRequest } from '@/types';

// Demo requests for development
const DEMO_REQUESTS: TableRequest[] = [
  {
    id: '1',
    restaurantId: 'demo',
    tableId: 't1',
    tableName: 'T-01',
    type: 'CALL_WAITER',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 120000),
  },
  {
    id: '2',
    restaurantId: 'demo',
    tableId: 't2',
    tableName: 'T-05',
    type: 'REQUEST_BILL',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 300000),
  },
  {
    id: '3',
    restaurantId: 'demo',
    tableId: 't3',
    tableName: 'T-12',
    type: 'CALL_WAITER',
    status: 'ACKNOWLEDGED',
    createdAt: new Date(Date.now() - 180000),
    acknowledgedAt: new Date(Date.now() - 60000),
    acknowledgedBy: 'staff-1',
  },
];

interface RequestCardProps {
  request: TableRequest;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  isLoading: boolean;
}

function RequestCard({ request, onAcknowledge, onResolve, isLoading }: RequestCardProps) {
  const isCall = request.type === 'CALL_WAITER';
  const isBill = request.type === 'REQUEST_BILL';
  const isPending = request.status === 'PENDING';
  const isAcknowledged = request.status === 'ACKNOWLEDGED';
  
  const timeAgo = (() => {
    const seconds = Math.floor((Date.now() - new Date(request.createdAt).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  })();
  
  const isUrgent = timeAgo.includes('m') && parseInt(timeAgo) >= 5;
  
  return (
    <div 
      className={`
        rounded-2xl p-4 transition-all duration-200
        ${isPending 
          ? isBill 
            ? 'bg-[#DBEAFE] border-2 border-[#3B82F6]' 
            : 'bg-[#FEF3C7] border-2 border-[#F59E0B]'
          : 'bg-white border border-[#EFE4D8]'
        }
        ${isUrgent && isPending ? 'ring-2 ring-red-400' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl
              ${isPending 
                ? isBill ? 'bg-[#3B82F6] text-white' : 'bg-[#F59E0B] text-white'
                : 'bg-[#EFE4D8] text-[#3A322D]'
              }
            `}
          >
            {request.tableName.replace('T-', '')}
          </div>
          <div>
            <p className="font-bold text-lg text-[#3A322D]">
              {request.tableName}
            </p>
            <div className="flex items-center gap-2">
              {isCall ? (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  <Bell className="w-3 h-3 mr-1" />
                  Appel
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  <CreditCard className="w-3 h-3 mr-1" />
                  Addition
                </Badge>
              )}
              <span className="text-xs text-[#C9A07E]">{timeAgo}</span>
            </div>
          </div>
        </div>
        
        {isAcknowledged && (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <Check className="w-3 h-3 mr-1" />
            En cours
          </Badge>
        )}
      </div>
      
      <div className="flex gap-2">
        {isPending && (
          <Button
            onClick={() => onAcknowledge(request.id)}
            disabled={isLoading}
            variant="outline"
            className="flex-1 py-4 rounded-xl border-[#EFE4D8] text-[#3A322D]"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            J&apos;y vais
          </Button>
        )}
        
        {isAcknowledged && (
          <Button
            onClick={() => onResolve(request.id)}
            disabled={isLoading}
            className="flex-1 py-4 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Terminé
          </Button>
        )}
      </div>
    </div>
  );
}

export default function WaiterModePage() {
  const router = useRouter();
  const { session, isStaffAuthenticated, isLoading: sessionLoading, logoutStaff } = useStaffSession();
  
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  useEffect(() => {
    if (!sessionLoading && !isStaffAuthenticated) {
      router.push('/staff/login');
    }
  }, [sessionLoading, isStaffAuthenticated, router]);
  
  useEffect(() => {
    if (!session) return;
    
    let isMounted = true;
    
    // Simulate API call with demo data
    const loadRequests = async () => {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isMounted) {
        setRequests(DEMO_REQUESTS);
        setIsLoading(false);
      }
    };
    
    loadRequests();
    
    return () => {
      isMounted = false;
    };
  }, [session]);
  
  const handleAcknowledge = useCallback(async (requestId: string) => {
    setActionLoading(requestId);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setRequests(prev => 
      prev.map(r => 
        r.id === requestId 
          ? { ...r, status: 'ACKNOWLEDGED' as const, acknowledgedAt: new Date(), acknowledgedBy: session?.staffId }
          : r
      )
    );
    
    setActionLoading(null);
  }, [session]);
  
  const handleResolve = useCallback(async (requestId: string) => {
    setActionLoading(requestId);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRequests(prev => prev.filter(r => r.id !== requestId));
    setActionLoading(null);
  }, []);
  
  const handleLogout = () => {
    logoutStaff();
    router.push('/staff/login');
  };
  
  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const acknowledgedRequests = requests.filter(r => r.status === 'ACKNOWLEDGED');
  
  const sortByTime = (a: TableRequest, b: TableRequest) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  
  const billRequests = pendingRequests.filter(r => r.type === 'REQUEST_BILL').sort(sortByTime);
  const callRequests = pendingRequests.filter(r => r.type === 'CALL_WAITER').sort(sortByTime);

  if (sessionLoading || !isStaffAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9]">
        <div className="w-10 h-10 rounded-xl bg-[#3A322D] flex items-center justify-center">
          <Coffee className="w-5 h-5 text-[#C9A07E] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFBF9] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FCFBF9]/95 backdrop-blur-lg border-b border-[#EFE4D8]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3A322D] flex items-center justify-center">
                <Coffee className="w-5 h-5 text-[#C9A07E]" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-[#3A322D]">Mode Serveur</h1>
                <p className="text-xs text-[#C9A07E]">{session?.restaurantName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.reload()}
                className="text-[#5A4A3D]"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-[#5A4A3D]"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Coffee className="w-8 h-8 text-[#C9A07E] animate-pulse" />
          </div>
        ) : pendingRequests.length === 0 && acknowledgedRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-[#EFE4D8] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#3A322D] mb-2">
              Tout est sous contrôle
            </h2>
            <p className="text-[#5A4A3D] max-w-xs">
              Aucune demande en attente. Les nouvelles demandes apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {billRequests.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-[#3B82F6]" />
                  <h2 className="font-semibold text-[#3A322D]">
                    Demandes d&apos;addition
                  </h2>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {billRequests.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {billRequests.map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onAcknowledge={handleAcknowledge}
                      onResolve={handleResolve}
                      isLoading={actionLoading === request.id}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {callRequests.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-5 h-5 text-[#F59E0B]" />
                  <h2 className="font-semibold text-[#3A322D]">
                    Appels serveur
                  </h2>
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    {callRequests.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {callRequests.map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onAcknowledge={handleAcknowledge}
                      onResolve={handleResolve}
                      isLoading={actionLoading === request.id}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {acknowledgedRequests.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-[#22C55E]" />
                  <h2 className="font-semibold text-[#3A322D]">
                    En cours
                  </h2>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    {acknowledgedRequests.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {acknowledgedRequests.map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onAcknowledge={handleAcknowledge}
                      onResolve={handleResolve}
                      isLoading={actionLoading === request.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#FCFBF9]/95 backdrop-blur-lg border-t border-[#EFE4D8]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#3A322D] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#3A322D]">{session?.staffName}</p>
              <p className="text-xs text-[#C9A07E] capitalize">{session?.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-[#5A4A3D]">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>En ligne</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
