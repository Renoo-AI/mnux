'use client';

import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Download, Eye, QrCode, X, AlertCircle, Loader2, Check, Search, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Table, TableState } from '@/types';

// Demo data
const demoTables: Table[] = [
  { id: '1', restaurantId: 'demo', name: 'T-01', label: 'Window Side', seats: 4, state: 'ACTIVE', qrCodeUrl: '/r/demo/t/T-01', currentOrderId: 'order-1', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', restaurantId: 'demo', name: 'T-02', label: 'Window Side', seats: 2, state: 'AVAILABLE', qrCodeUrl: '/r/demo/t/T-02', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', restaurantId: 'demo', name: 'B-01', label: 'Bar Stool', seats: 1, state: 'AVAILABLE', qrCodeUrl: '/r/demo/t/B-01', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', restaurantId: 'demo', name: 'T-03', label: 'Booth Seat', seats: 6, state: 'OFFLINE', qrCodeUrl: '/r/demo/t/T-03', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', restaurantId: 'demo', name: 'T-04', label: 'Patio', seats: 4, state: 'AVAILABLE', qrCodeUrl: '/r/demo/t/T-04', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', restaurantId: 'demo', name: 'T-05', label: 'Main Hall', seats: 2, state: 'ACTIVE', qrCodeUrl: '/r/demo/t/T-05', currentOrderId: 'order-2', createdAt: new Date(), updatedAt: new Date() },
];

interface NewTableFormValues {
  name: string;
  label: string;
  seats: number;
}

const initialFormValues: NewTableFormValues = {
  name: '',
  label: '',
  seats: 2,
};

const formConfig = {
  name: {
    rules: { required: true, minLength: 1, maxLength: 10 },
    label: 'Table Name',
  },
  label: {
    rules: { maxLength: 50 },
    label: 'Table Label',
  },
  seats: {
    rules: { required: true, min: 1, max: 20 },
    label: 'Number of Seats',
  },
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>(demoTables);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTableForm, setShowNewTableForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://menux.app';
  const { toast } = useToast();
  
  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  } = useFormValidation<NewTableFormValues>(initialFormValues, formConfig);

  // Filter tables by search query
  const filteredTables = tables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         table.label?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    setTables(tables.map(table => {
      if (table.id === tableId) {
        const newState = table.state === 'OFFLINE' ? 'AVAILABLE' : 
                         table.state === 'AVAILABLE' ? 'OFFLINE' : table.state;
        
        toast({
          title: `Table ${newState === 'OFFLINE' ? 'Offline' : 'Online'}`,
          description: `${table.name} is now ${newState === 'OFFLINE' ? 'offline and hidden from customers' : 'available for seating'}.`,
        });
        
        return { ...table, state: newState as TableState };
      }
      return table;
    }));
  };

  const onCreateTable = useCallback(async () => {
    setIsCreating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const newTable: Table = {
        id: `t-${Date.now()}`,
        restaurantId: 'demo',
        name: values.name.toUpperCase(),
        label: values.label || 'Main Hall',
        seats: values.seats,
        state: 'AVAILABLE',
        qrCodeUrl: `/r/demo/t/${values.name.toUpperCase()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setTables(prev => [...prev, newTable]);
      setShowNewTableForm(false);
      resetForm();
      
      toast({
        title: 'Table Created',
        description: `${newTable.name} has been added successfully with a unique QR code.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create table. Please try again.',
      });
    } finally {
      setIsCreating(false);
    }
  }, [values, resetForm, toast]);

  const handleDeleteClick = (table: Table) => {
    setTableToDelete(table);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setTables(prev => prev.filter(table => table.id !== tableToDelete.id));
      setShowDeleteDialog(false);
      
      toast({
        title: 'Table Deleted',
        description: `${tableToDelete.name} has been removed from your floor plan.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete table. Please try again.',
      });
    } finally {
      setIsDeleting(false);
      setTableToDelete(null);
    }
  };

  const getFieldError = (fieldName: keyof NewTableFormValues) => {
    return touched[fieldName] && errors[fieldName];
  };

  const getFieldClasses = (fieldName: keyof NewTableFormValues) => {
    const baseClasses = 'w-full p-4 border rounded-xl bg-surface-container-low transition-all duration-200 outline-none';
    const hasError = getFieldError(fieldName);
    
    if (hasError) {
      return `${baseClasses} border-error focus:border-error focus:ring-2 focus:ring-error-container`;
    }
    return `${baseClasses} border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary-fixed/20`;
  };

  return (
    <DashboardLayout>
      <TopAppBar
        title="Table & QR Management"
        subtitle="Manage table access points"
        showSearch={false}
        user={{ name: 'Manager', role: 'manager' }}
      />

      <div className="p-6 md:p-10 max-w-7xl w-full mx-auto animate-fade-in">
        {/* Header with Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-on-surface-variant">Manage table access points and operational status.</p>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <Input
                type="text"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary-fixed/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Search Results Count */}
            {searchQuery && (
              <p className="text-on-surface-variant text-sm">
                Found <strong className="text-primary">{filteredTables.length}</strong> table{filteredTables.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </p>
            )}
          </div>
          <Button 
            className="bg-primary text-on-primary hover:opacity-90 transition-all duration-300 hover:scale-105 shrink-0"
            onClick={() => setShowNewTableForm(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Table
          </Button>
        </div>

        {/* New Table Form Modal */}
        {showNewTableForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-title-md text-primary">Create New Table</h2>
                <button
                  onClick={() => {
                    setShowNewTableForm(false);
                    resetForm();
                  }}
                  className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                  disabled={isCreating}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onCreateTable);
              }} className="space-y-6">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                    TABLE NAME <span className="text-error">*</span>
                  </label>
                  <Input
                    value={values.name}
                    onChange={(e) => handleChange('name', e.target.value.toUpperCase())}
                    onBlur={() => handleBlur('name')}
                    placeholder="e.g., T-04"
                    className={getFieldClasses('name')}
                    maxLength={10}
                    disabled={isCreating}
                  />
                  {getFieldError('name') && (
                    <p className="text-error text-sm mt-2 flex items-center gap-1 animate-slide-in-up">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                  <p className="text-on-surface-variant text-xs mt-1">
                    Short identifier (max 10 characters)
                  </p>
                </div>

                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                    TABLE LABEL
                  </label>
                  <Input
                    value={values.label}
                    onChange={(e) => handleChange('label', e.target.value)}
                    onBlur={() => handleBlur('label')}
                    placeholder="e.g., Window Side, Patio"
                    className={getFieldClasses('label')}
                    maxLength={50}
                    disabled={isCreating}
                  />
                  <p className="text-on-surface-variant text-xs mt-1">
                    Optional description (max 50 characters)
                  </p>
                </div>

                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                    NUMBER OF SEATS <span className="text-error">*</span>
                  </label>
                  <Input
                    type="number"
                    value={values.seats}
                    onChange={(e) => handleChange('seats', parseInt(e.target.value) || 0)}
                    onBlur={() => handleBlur('seats')}
                    min={1}
                    max={20}
                    className={getFieldClasses('seats')}
                    disabled={isCreating}
                  />
                  {getFieldError('seats') && (
                    <p className="text-error text-sm mt-2 flex items-center gap-1 animate-slide-in-up">
                      <AlertCircle className="w-4 h-4" />
                      {errors.seats}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 py-4 rounded-full border border-outline-variant"
                    onClick={() => {
                      setShowNewTableForm(false);
                      resetForm();
                    }}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 py-4 rounded-full bg-primary text-on-primary hover:opacity-90"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Create Table
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {filteredTables.map((table) => {
            const stateStyle = getStateStyle(table.state);
            const qrUrl = `${baseUrl}${table.qrCodeUrl}`;

            return (
              <div
                key={table.id}
                className={`bg-surface rounded-xl p-6 shadow-card border border-surface-container-low flex flex-col h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group ${
                  table.state === 'OFFLINE' ? 'opacity-60 grayscale-[0.5]' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-title-sm text-primary group-hover:text-secondary transition-colors">{table.name}</h3>
                    <p className="text-on-surface-variant text-sm">{table.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-label-caps font-label-caps text-on-surface-variant mr-1">
                      {table.state === 'OFFLINE' ? 'Offline' : 'Online'}
                    </span>
                    <button
                      onClick={() => toggleTableState(table.id)}
                      className={`relative inline-block w-10 h-6 rounded-full transition-colors hover:scale-105 ${
                        table.state !== 'OFFLINE' ? 'bg-secondary' : 'bg-surface-container-high'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                        table.state !== 'OFFLINE' ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex-1 flex justify-center items-center py-4 bg-surface-container-low rounded-lg mb-4 group-hover:bg-surface-container transition-colors">
                  <div className="w-32 h-32 bg-white rounded flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <QRCodeSVG value={qrUrl} size={120} level="H" />
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`${stateStyle.bg} ${stateStyle.text} px-3 py-1 rounded-full font-label-caps text-label-caps flex items-center`}>
                      <span className={`w-2 h-2 ${stateStyle.dot} rounded-full mr-2 ${table.state === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                      {stateStyle.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-secondary hover:scale-105 transition-all">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <button 
                        onClick={() => handleDeleteClick(table)}
                        className="p-2 rounded-full bg-surface-container-low text-error hover:bg-error-container transition-all duration-300 hover:scale-110"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {table.state === 'ACTIVE' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" className="bg-primary text-on-primary hover:opacity-90">VIEW ORDER</Button>
                      <Button size="sm" variant="outline" className="border border-outline text-primary hover:bg-surface-container-low">CLOSE TABLE</Button>
                    </div>
                  ) : table.state === 'AVAILABLE' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="bg-surface-container-high text-primary hover:bg-surface-container">
                        <Eye className="w-4 h-4 mr-1" />
                        PREVIEW
                      </Button>
                      <Button size="sm" className="bg-primary text-on-primary hover:opacity-90">
                        <Download className="w-4 h-4 mr-1" />
                        QR CODE
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full bg-secondary text-on-secondary hover:opacity-90">REOPEN TABLE</Button>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* No Results */}
          {filteredTables.length === 0 && searchQuery && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-on-surface-variant" />
              </div>
              <h3 className="font-display text-title-sm text-primary mb-2">No tables found</h3>
              <p className="text-on-surface-variant">Try adjusting your search criteria</p>
              <Button 
                variant="outline" 
                className="mt-4 rounded-full"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-surface rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-error-container rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <AlertDialogTitle className="font-display text-title-md text-primary">
                Delete Table?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-on-surface-variant">
              Are you sure you want to delete <strong className="text-primary">{tableToDelete?.name}</strong>? 
              This will remove the table and its QR code from your floor plan. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel 
              className="rounded-full border border-outline-variant px-6"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-error text-on-error rounded-full px-6 hover:bg-error/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete Table'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
