'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3X3,
  Plus,
  Minus,
  RotateCcw,
  Move,
  Eye,
  EyeOff,
  Settings,
  Users,
  Clock,
  DollarSign,
  ChefHat,
  X,
  Check,
  AlertTriangle,
  Coffee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export type TableShape = 'circle' | 'square' | 'rectangle';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface FloorTable {
  id: string;
  name: string;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  seats: number;
  status: TableStatus;
  orderId?: string;
  guests?: number;
  server?: string;
  reservationTime?: string;
  reservationName?: string;
}

interface FloorPlanProps {
  tables?: FloorTable[];
  onTableClick?: (table: FloorTable) => void;
  onTableMove?: (id: string, x: number, y: number) => void;
  editable?: boolean;
}

const statusColors: Record<TableStatus, string> = {
  available: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  occupied: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
  reserved: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  cleaning: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
};

const statusLabels: Record<TableStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  cleaning: 'Cleaning',
};

function TableComponent({
  table,
  onClick,
  onDragEnd,
  editable,
}: {
  table: FloorTable;
  onClick?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  editable?: boolean;
}) {
  const isCircle = table.shape === 'circle';

  return (
    <motion.div
      drag={editable}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (onDragEnd) {
          onDragEnd(table.x + info.offset.x, table.y + info.offset.y);
        }
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: editable ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`absolute cursor-pointer select-none ${statusColors[table.status]} border-2 rounded-lg shadow-sm transition-shadow hover:shadow-md`}
      style={{
        left: table.x,
        top: table.y,
        width: table.width,
        height: isCircle ? table.width : table.height,
        borderRadius: isCircle ? '50%' : '8px',
        transform: `rotate(${table.rotation}deg)`,
      }}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
        <span className="font-bold text-sm">{table.name}</span>
        <div className="flex items-center gap-0.5 mt-0.5">
          <Users className="h-3 w-3" />
          <span className="text-xs">{table.guests || 0}/{table.seats}</span>
        </div>
        {table.status === 'reserved' && table.reservationTime && (
          <span className="text-xs mt-0.5 flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {table.reservationTime}
          </span>
        )}
      </div>

      {/* Status indicator dot */}
      <div
        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
          table.status === 'available' ? 'bg-green-500' :
          table.status === 'occupied' ? 'bg-amber-500' :
          table.status === 'reserved' ? 'bg-blue-500' : 'bg-purple-500'
        }`}
      />
    </motion.div>
  );
}

export function FloorPlan({ tables: propTables, onTableClick, onTableMove, editable = false }: FloorPlanProps) {
  const defaultTables: FloorTable[] = [
    { id: '1', name: 'T-01', shape: 'circle', x: 50, y: 50, width: 80, height: 80, rotation: 0, seats: 4, status: 'occupied', guests: 3, server: 'Marie' },
    { id: '2', name: 'T-02', shape: 'square', x: 180, y: 50, width: 80, height: 80, rotation: 0, seats: 2, status: 'available' },
    { id: '3', name: 'T-03', shape: 'rectangle', x: 50, y: 180, width: 120, height: 80, rotation: 0, seats: 6, status: 'reserved', guests: 0, reservationTime: '7:30 PM', reservationName: 'Johnson Party' },
    { id: '4', name: 'T-04', shape: 'circle', x: 220, y: 180, width: 80, height: 80, rotation: 0, seats: 4, status: 'available' },
    { id: '5', name: 'T-05', shape: 'rectangle', x: 350, y: 50, width: 100, height: 70, rotation: 0, seats: 4, status: 'occupied', guests: 4, server: 'Pierre' },
    { id: '6', name: 'B-01', shape: 'rectangle', x: 350, y: 180, width: 60, height: 40, rotation: 0, seats: 2, status: 'available' },
    { id: '7', name: 'B-02', shape: 'rectangle', x: 430, y: 180, width: 60, height: 40, rotation: 0, seats: 2, status: 'cleaning' },
    { id: '8', name: 'B-03', shape: 'rectangle', x: 350, y: 240, width: 60, height: 40, rotation: 0, seats: 2, status: 'occupied', guests: 2, server: 'Sophie' },
    { id: '9', name: 'B-04', shape: 'rectangle', x: 430, y: 240, width: 60, height: 40, rotation: 0, seats: 2, status: 'available' },
  ];

  const [tables, setTables] = useState<FloorTable[]>(propTables || defaultTables);
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(true);

  const handleTableMove = useCallback((id: string, x: number, y: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, x: Math.max(0, x), y: Math.max(0, y) } : t))
    );
    if (onTableMove) {
      onTableMove(id, x, y);
    }
  }, [onTableMove]);

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
    guests: tables.reduce((acc, t) => acc + (t.guests || 0), 0),
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Total Tables</div>
          <div className="text-xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="text-xs text-green-600 dark:text-green-400">Available</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.available}</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="text-xs text-amber-600 dark:text-amber-400">Occupied</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.occupied}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-xs text-blue-600 dark:text-blue-400">Reserved</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.reserved}</div>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Total Guests</div>
          <div className="text-xl font-bold">{stats.guests}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(1)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLegend(!showLegend)}
        >
          {showLegend ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showLegend ? 'Hide' : 'Show'} Legend
        </Button>
      </div>

      {/* Legend */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-4 flex-wrap text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700" />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700" />
              <span>Cleaning</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floor Plan Canvas */}
      <div className="relative border-2 border-dashed border-muted-foreground/20 rounded-xl overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
        {/* Kitchen indicator */}
        <div className="absolute top-2 right-2 bg-muted/80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
          <ChefHat className="h-4 w-4" />
          <span>Kitchen</span>
        </div>

        {/* Bar indicator */}
        <div className="absolute bottom-2 right-2 bg-muted/80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
          <Coffee className="h-4 w-4" />
          <span>Bar</span>
        </div>

        <div
          className="relative w-full h-[500px] overflow-auto"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          <div className="relative w-[600px] h-[500px]">
            {tables.map((table) => (
              <TableComponent
                key={table.id}
                table={table}
                onClick={() => {
                  setSelectedTable(table);
                  if (onTableClick) onTableClick(table);
                }}
                onDragEnd={(x, y) => handleTableMove(table.id, x, y)}
                editable={editable}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Table Detail Modal */}
      <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Table {selectedTable?.name}
              <Badge className={statusColors[selectedTable?.status || 'available']}>
                {statusLabels[selectedTable?.status || 'available']}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedTable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Seats</div>
                  <div className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {selectedTable.seats}
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Current Guests</div>
                  <div className="text-lg font-semibold">{selectedTable.guests || 0}</div>
                </div>
              </div>

              {selectedTable.server && (
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Server</div>
                  <div className="text-lg font-semibold">{selectedTable.server}</div>
                </div>
              )}

              {selectedTable.status === 'reserved' && selectedTable.reservationName && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="text-xs text-blue-600 dark:text-blue-400">Reservation</div>
                  <div className="font-semibold">{selectedTable.reservationName}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {selectedTable.reservationTime}
                  </div>
                </div>
              )}

              {selectedTable.status === 'occupied' && (
                <div className="space-y-2">
                  <Button className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    View Order
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline">Add Items</Button>
                    <Button variant="outline">Close Table</Button>
                  </div>
                </div>
              )}

              {selectedTable.status === 'available' && (
                <div className="space-y-2">
                  <Button className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Seat Guests
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Add Reservation
                  </Button>
                </div>
              )}

              {selectedTable.status === 'cleaning' && (
                <Button className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Cleaned
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
