'use client';

import { useState, useMemo } from 'react';
import { TableCard } from './TableCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  LayoutList,
  AlertCircle,
  Coffee,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import type { Table, TableStatus, Order } from '@/types';

interface TableGridProps {
  tables: Table[];
  orders: Order[];
  onAction: (action: 'accept' | 'reject' | 'paid' | 'close' | 'cancel', table: Table) => void;
  isLoading?: boolean;
  loadingTableId?: string | null;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | TableStatus;

function calculateOrderAge(createdAt: Date): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
}

export function TableGrid({ tables, orders, onAction, isLoading, loadingTableId }: TableGridProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  
  // Create a map of orders by tableId
  const ordersByTable = useMemo(() => {
    const map = new Map<string, Order>();
    orders.forEach(order => {
      map.set(order.tableId, order);
    });
    return map;
  }, [orders]);
  
  // Filter and sort tables
  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      // Search filter
      if (search && !table.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filterStatus !== 'all' && table.status !== filterStatus) {
        return false;
      }
      
      return true;
    });
  }, [tables, search, filterStatus]);
  
  // Stats
  const stats = useMemo(() => {
    return {
      total: tables.length,
      newOrder: tables.filter(t => t.status === 'NEW_ORDER').length,
      active: tables.filter(t => t.status === 'ACTIVE').length,
      awaitingPayment: tables.filter(t => t.status === 'AWAITING_PAYMENT').length,
      empty: tables.filter(t => t.status === 'EMPTY').length,
    };
  }, [tables]);
  
  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-[#EFE4D8]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
          <Grid3X3 className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-700">{stats.total}</span>
          <span className="text-sm text-gray-500">Tables</span>
        </div>
        
        {stats.newOrder > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-amber-700">{stats.newOrder}</span>
            <span className="text-sm text-amber-600">New</span>
          </div>
        )}
        
        {stats.active > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <Coffee className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-700">{stats.active}</span>
            <span className="text-sm text-green-600">Active</span>
          </div>
        )}
        
        {stats.awaitingPayment > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-700">{stats.awaitingPayment}</span>
            <span className="text-sm text-blue-600">Payment</span>
          </div>
        )}
        
        {stats.empty > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <CheckCircle className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">{stats.empty}</span>
            <span className="text-sm text-gray-500">Available</span>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-[#EFE4D8]"
          />
        </div>
        
        <div className="flex items-center gap-1 bg-white rounded-lg border border-[#EFE4D8] p-1">
          <Button
            size="sm"
            variant={filterStatus === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilterStatus('all')}
            className={filterStatus === 'all' ? 'bg-[#3A322D] text-white' : ''}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'NEW_ORDER' ? 'default' : 'ghost'}
            onClick={() => setFilterStatus('NEW_ORDER')}
            className={filterStatus === 'NEW_ORDER' ? 'bg-amber-600 text-white' : ''}
          >
            New
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'ACTIVE' ? 'default' : 'ghost'}
            onClick={() => setFilterStatus('ACTIVE')}
            className={filterStatus === 'ACTIVE' ? 'bg-green-600 text-white' : ''}
          >
            Active
          </Button>
        </div>
        
        <div className="flex items-center gap-1 bg-white rounded-lg border border-[#EFE4D8] p-1">
          <Button
            size="icon"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-[#3A322D] text-white' : ''}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-[#3A322D] text-white' : ''}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Table grid/list */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#EFE4D8]">
          <Grid3X3 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-medium text-[#3A322D] mb-1">No tables found</h3>
          <p className="text-sm text-[#5A4A3D]">
            {search ? 'Try a different search term' : 'No tables have been set up yet'}
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
        }>
          {filteredTables.map(table => (
            <TableCard
              key={table.id}
              table={table}
              activeOrder={table.activeOrderId ? ordersByTable.get(table.activeOrderId) || null : null}
              orderAge={table.activeOrderId ? 
                calculateOrderAge(ordersByTable.get(table.activeOrderId)?.createdAt || new Date()) : 
                undefined
              }
              onAction={onAction}
              isLoading={isLoading && loadingTableId === table.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TableGrid;
