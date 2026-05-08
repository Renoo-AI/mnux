'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Download, Eye, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import type { Table, TableState } from '@/types';

// Demo data
const demoTables: Table[] = [
  { id: '1', restaurantId: 'demo', name: 'T-01', label: 'Window Side', seats: 4, state: 'ACTIVE', qrCodeUrl: '/r/demo/t/T-01', currentOrderId: 'order-1', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', restaurantId: 'demo', name: 'T-02', label: 'Window Side', seats: 2, state: 'AVAILABLE', qrCodeUrl: '/r/demo/t/T-02', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', restaurantId: 'demo', name: 'B-01', label: 'Bar Stool', seats: 1, state: 'AVAILABLE', qrCodeUrl: '/r/demo/t/B-01', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', restaurantId: 'demo', name: 'T-03', label: 'Booth Seat', seats: 6, state: 'OFFLINE', qrCodeUrl: '/r/demo/t/T-03', createdAt: new Date(), updatedAt: new Date() },
];

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>(demoTables);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://menux.app';

  const getStateStyle = (state: TableState) => {
    switch (state) {
      case 'ACTIVE':
        return { bg: 'bg-secondary-container', text: 'text-on-secondary-container', dot: 'bg-secondary', label: 'ACTIVE' };
      case 'AVAILABLE':
        return { bg: 'bg-surface-container-high', text: 'text-primary', dot: 'bg-outline-variant', label: 'AVAILABLE' };
      case 'OFFLINE':
        return { bg: 'bg-error-container', text: 'text-on-error-container', dot: 'bg-error', label: 'OFFLINE' };
      default:
        return { bg: 'bg-surface-container-high', text: 'text-primary', dot: 'bg-outline-variant', label: state };
    }
  };

  const toggleTableState = (tableId: string) => {
    setTables(tables.map(table => {
      if (table.id === tableId) {
        const newState = table.state === 'OFFLINE' ? 'AVAILABLE' : 
                         table.state === 'AVAILABLE' ? 'OFFLINE' : table.state;
        return { ...table, state: newState as TableState };
      }
      return table;
    }));
  };

  return (
    <DashboardLayout>
      <TopAppBar
        title="Table & QR Management"
        subtitle="Manage table access points"
        showSearch={false}
        user={{ name: 'Manager', role: 'manager' }}
      />

      <div className="p-6 md:p-10 max-w-7xl w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <p className="text-on-surface-variant">Manage table access points and operational status.</p>
          <Button className="bg-primary text-on-primary">
            <Plus className="w-5 h-5 mr-2" />
            Create New Table
          </Button>
        </div>

        {/* Table Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => {
            const stateStyle = getStateStyle(table.state);
            const qrUrl = `${baseUrl}${table.qrCodeUrl}`;

            return (
              <div
                key={table.id}
                className={`bg-surface rounded-xl p-6 shadow-card border border-surface-container-low flex flex-col h-full hover:shadow-lg transition-all duration-300 ${
                  table.state === 'OFFLINE' ? 'opacity-60 grayscale-[0.5]' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-title-sm text-primary">{table.name}</h3>
                    <p className="text-on-surface-variant text-sm">{table.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-label-caps font-label-caps text-on-surface-variant mr-1">
                      {table.state === 'OFFLINE' ? 'Offline' : 'Online'}
                    </span>
                    <button
                      onClick={() => toggleTableState(table.id)}
                      className={`relative inline-block w-10 h-6 rounded-full transition-colors ${
                        table.state !== 'OFFLINE' ? 'bg-secondary' : 'bg-surface-container-high'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        table.state !== 'OFFLINE' ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex-1 flex justify-center items-center py-4 bg-surface-container-low rounded-lg mb-4">
                  <div className="w-32 h-32 bg-white rounded flex items-center justify-center shadow-sm">
                    <QRCodeSVG value={qrUrl} size={120} level="H" />
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`${stateStyle.bg} ${stateStyle.text} px-3 py-1 rounded-full font-label-caps text-label-caps flex items-center`}>
                      <span className={`w-2 h-2 ${stateStyle.dot} rounded-full mr-2`} />
                      {stateStyle.label}
                    </span>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-secondary">
                      <Download className="w-4 h-4 mr-1" />
                      Download QR
                    </Button>
                  </div>

                  {table.state === 'ACTIVE' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" className="bg-primary text-on-primary">VIEW ORDER</Button>
                      <Button size="sm" variant="outline" className="border border-outline text-primary">CLOSE TABLE</Button>
                    </div>
                  ) : table.state === 'AVAILABLE' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="bg-surface-container-high text-primary">
                        <Eye className="w-4 h-4 mr-1" />
                        SCAN PREVIEW
                      </Button>
                      <Button size="sm" className="bg-primary text-on-primary">
                        <Download className="w-4 h-4 mr-1" />
                        DOWNLOAD QR
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full bg-secondary text-on-secondary">REOPEN TABLE</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
