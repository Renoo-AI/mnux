'use client';

import { useState, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Download, Eye, X, AlertCircle, Loader2, Check, Search, AlertTriangle, Trash2, Share2, Printer, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { auth } from '@/lib/firebase';
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
import type { Table, TableStatus } from '@/types';

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
  const { session } = useStaffSession();
  const restaurantId = session?.restaurantId;
  const restaurantSlug = session?.restaurantSlug;
  
  const [tables, setTables] = useState<Table[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTableForm, setShowNewTableForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  // Load tables from Firebase
  const loadTables = useCallback(async () => {
    if (!restaurantId) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const response = await fetch(`/api/tables?restaurantId=${restaurantId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load tables');
      }
      
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Error loading tables:', error);
      setLoadError('Failed to load tables. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  // Load tables on mount
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Filter tables by search query
  const filteredTables = tables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         table.label?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusStyle = (status: TableStatus) => {
    switch (status) {
      case 'ACTIVE':
      case 'NEW_ORDER':
        return { bg: 'bg-secondary-container', text: 'text-on-secondary-container', dot: 'bg-secondary', label: status };
      case 'EMPTY':
        return { bg: 'bg-surface-container-high', text: 'text-primary', dot: 'bg-outline-variant', label: 'AVAILABLE' };
      case 'AWAITING_PAYMENT':
        return { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container', dot: 'bg-tertiary', label: 'AWAITING PAYMENT' };
      case 'OFFLINE':
        return { bg: 'bg-error-container', text: 'text-on-error-container', dot: 'bg-error', label: 'OFFLINE' };
      default:
        return { bg: 'bg-surface-container-high', text: 'text-primary', dot: 'bg-outline-variant', label: status };
    }
  };

  const toggleTableStatus = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    // Prevent toggling if table has active order
    if (table.status === 'ACTIVE' || table.status === 'NEW_ORDER' || table.status === 'AWAITING_PAYMENT') {
      toast({
        variant: 'destructive',
        title: 'Cannot Toggle Status',
        description: `${table.name} has an active order. Close the order first.`,
      });
      return;
    }
    
    const newStatus = table.status === 'OFFLINE' ? 'EMPTY' : 'OFFLINE';
    
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();
      
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Authentication Required',
          description: 'Please log in to update tables.',
        });
        return;
      }
      
      const response = await fetch('/api/tables', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: tableId,
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update table');
      }
      
      // Update local state
      setTables(tables.map(t => {
        if (t.id === tableId) {
          return { ...t, status: newStatus as TableStatus };
        }
        return t;
      }));
      
      toast({
        title: `Table ${newStatus === 'OFFLINE' ? 'Offline' : 'Online'}`,
        description: `${table.name} is now ${newStatus === 'OFFLINE' ? 'offline and hidden from customers' : 'available for seating'}.`,
      });
    } catch (error) {
      console.error('Error toggling table status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update table status.',
      });
    }
  };

  // Download QR code as PNG
  const downloadQRCode = useCallback((tableName: string, qrUrl: string) => {
    // Find the SVG element
    const svgElement = document.querySelector(`[data-qr-table="${tableName}"] svg`);
    if (!svgElement) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not generate QR code image.',
      });
      return;
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      // Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      
      // Draw QR code centered
      const padding = 40;
      const qrSize = size - (padding * 2);
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      
      // Add table name label
      ctx.fillStyle = '#3A322D';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tableName, size / 2, size - 15);
      
      // Download
      const link = document.createElement('a');
      link.download = `menux-qr-${tableName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: 'QR Code Downloaded',
        description: `QR code for ${tableName} has been saved to your downloads.`,
      });
    };
    img.src = url;
  }, [toast]);

  // Share QR code URL
  const shareQRCode = useCallback(async (tableName: string, qrUrl: string) => {
    const fullUrl = `${baseUrl}${qrUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Menux - ${tableName}`,
          text: `Scan to view the menu for ${tableName}`,
          url: fullUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: 'Link Copied',
        description: `The link for ${tableName} has been copied to your clipboard.`,
      });
    }
  }, [baseUrl, toast]);

  const onCreateTable = useCallback(async () => {
    if (!restaurantId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Restaurant ID not found. Please log in again.',
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();
      
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Authentication Required',
          description: 'Please log in to create tables.',
        });
        return;
      }
      
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId,
          name: values.name.toUpperCase(),
          label: values.label || '',
          seats: values.seats,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create table');
      }
      
      const data = await response.json();
      
      // Add new table to local state
      const newTable: Table = {
        id: data.id,
        restaurantId,
        name: values.name.toUpperCase(),
        label: values.label || '',
        seats: values.seats,
        status: 'EMPTY',
        qrCodeUrl: data.table?.qrCodeUrl || `/r/${restaurantSlug}/t/${values.name.toUpperCase()}`,
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
      console.error('Error creating table:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create table. Please try again.',
      });
    } finally {
      setIsCreating(false);
    }
  }, [values, resetForm, toast, restaurantId, restaurantSlug]);

  const handleDeleteClick = (table: Table) => {
    setTableToDelete(table);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();
      
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Authentication Required',
          description: 'Please log in to delete tables.',
        });
        return;
      }
      
      const response = await fetch(`/api/tables?id=${tableToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete table');
      }
      
      setTables(prev => prev.filter(table => table.id !== tableToDelete.id));
      setShowDeleteDialog(false);
      
      toast({
        title: 'Table Deleted',
        description: `${tableToDelete.name} has been removed from your floor plan.`,
      });
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete table. Please try again.',
      });
    } finally {
      setIsDeleting(false);
      setTableToDelete(null);
    }
  };

  // Toggle table selection
  const toggleTableSelection = (tableId: string) => {
    setSelectedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableId)) {
        newSet.delete(tableId);
      } else {
        newSet.add(tableId);
      }
      return newSet;
    });
  };

  // Select all tables
  const selectAllTables = () => {
    const allIds = new Set(filteredTables.map(t => t.id));
    setSelectedTables(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTables(new Set());
  };

  // Bulk download QR codes
  const bulkDownloadQRCodes = useCallback(async () => {
    if (selectedTables.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No Tables Selected',
        description: 'Please select at least one table to download.',
      });
      return;
    }

    setIsBulkDownloading(true);
    
    try {
      const selectedTablesList = tables.filter(t => selectedTables.has(t.id));
      
      // Download each QR code individually
      for (const table of selectedTablesList) {
        await new Promise<void>((resolve) => {
          const svgElement = document.querySelector(`[data-qr-table="${table.name}"] svg`);
          if (!svgElement) {
            resolve();
            return;
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve();
            return;
          }

          const size = 400;
          canvas.width = size;
          canvas.height = size;

          const svgData = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          
          const img = new Image();
          img.onload = () => {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            
            const padding = 40;
            const qrSize = size - (padding * 2);
            ctx.drawImage(img, padding, padding, qrSize, qrSize);
            
            ctx.fillStyle = '#3A322D';
            ctx.font = 'bold 24px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(table.name, size / 2, size - 15);
            
            const link = document.createElement('a');
            link.download = `menux-qr-${table.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        });
        
        // Small delay between downloads
        await new Promise(r => setTimeout(r, 300));
      }
      
      toast({
        title: 'QR Codes Downloaded',
        description: `Downloaded ${selectedTablesList.length} QR code(s).`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download QR codes.',
      });
    } finally {
      setIsBulkDownloading(false);
    }
  }, [selectedTables, tables, toast]);

  // Print QR codes
  const printQRCodes = useCallback(() => {
    if (selectedTables.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No Tables Selected',
        description: 'Please select at least one table to print.',
      });
      return;
    }

    const selectedTablesList = tables.filter(t => selectedTables.has(t.id));
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not open print window. Please allow popups.',
      });
      return;
    }

    // Generate HTML content
    const qrCodesHTML = selectedTablesList.map(table => {
      const svgElement = document.querySelector(`[data-qr-table="${table.name}"] svg`);
      const svgHTML = svgElement ? new XMLSerializer().serializeToString(svgElement) : '';
      
      return `
        <div style="width: 50%; display: inline-block; padding: 20px; box-sizing: border-box; page-break-inside: avoid;">
          <div style="border: 2px solid #EFE4D8; border-radius: 16px; padding: 20px; text-align: center; background: white;">
            <div style="margin-bottom: 12px;">
              ${svgHTML}
            </div>
            <h3 style="font-family: system-ui, sans-serif; font-size: 18px; font-weight: bold; color: #3A322D; margin: 0;">${table.name}</h3>
            <p style="font-family: system-ui, sans-serif; font-size: 12px; color: #5A4A3D; margin: 4px 0 0 0;">${table.label || ''}</p>
            <p style="font-family: system-ui, sans-serif; font-size: 10px; color: #7A6A5D; margin: 8px 0 0 0;">Scan to view menu</p>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Menux QR Codes - Print</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 20mm; }
            }
            body {
              font-family: system-ui, sans-serif;
              background: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #EFE4D8;
            }
            .header h1 {
              font-size: 24px;
              color: #3A322D;
              margin: 0;
            }
            .header p {
              font-size: 12px;
              color: #5A4A3D;
              margin: 8px 0 0 0;
            }
            .qr-grid {
              display: flex;
              flex-wrap: wrap;
              margin: -10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Menux - Table QR Codes</h1>
            <p>${selectedTablesList.length} QR code(s) • Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="qr-grid">
            ${qrCodesHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [selectedTables, tables, toast]);

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

  // Show loading state while fetching
  if (isLoading) {
    return (
      <DashboardLayout>
        <TopAppBar
          title="Table & QR Management"
          subtitle="Manage table access points"
          showSearch={false}
          user={{ name: session?.staffName || 'Manager', role: session?.role || 'manager' }}
        />
        <div className="p-6 md:p-10 max-w-7xl w-full mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-secondary animate-spin mb-4" />
            <p className="text-on-surface-variant">Loading tables...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <DashboardLayout>
        <TopAppBar
          title="Table & QR Management"
          subtitle="Manage table access points"
          showSearch={false}
          user={{ name: session?.staffName || 'Manager', role: session?.role || 'manager' }}
        />
        <div className="p-6 md:p-10 max-w-7xl w-full mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <h3 className="font-display text-title-sm text-primary mb-2">Failed to Load Tables</h3>
            <p className="text-on-surface-variant mb-4">{loadError}</p>
            <Button onClick={loadTables} className="bg-primary text-on-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show message if no restaurant
  if (!restaurantId) {
    return (
      <DashboardLayout>
        <TopAppBar
          title="Table & QR Management"
          subtitle="Manage table access points"
          showSearch={false}
          user={{ name: session?.staffName || 'Manager', role: session?.role || 'manager' }}
        />
        <div className="p-6 md:p-10 max-w-7xl w-full mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-on-surface-variant" />
            </div>
            <h3 className="font-display text-title-sm text-primary mb-2">No Restaurant Selected</h3>
            <p className="text-on-surface-variant">Please log in to manage tables.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TopAppBar
        title="Table & QR Management"
        subtitle="Manage table access points"
        showSearch={false}
        user={{ name: session?.staffName || 'Manager', role: session?.role || 'manager' }}
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
                Found <strong className="text-primary">{filteredTables.length}</strong> table{filteredTables.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Bulk Actions */}
            {selectedTables.size > 0 && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-sm text-[#5A4A3D] bg-[#C9A07E]/20 px-3 py-1 rounded-full">
                  {selectedTables.size} selected
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-full border-[#EFE4D8]"
                  onClick={bulkDownloadQRCodes}
                  disabled={isBulkDownloading}
                >
                  {isBulkDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-full border-[#EFE4D8]"
                  onClick={printQRCodes}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="rounded-full text-[#5A4A3D]"
                  onClick={clearSelection}
                >
                  Clear
                </Button>
              </div>
            )}
            
            <Button 
              className="bg-primary text-on-primary hover:opacity-90 transition-all duration-300 hover:scale-105 shrink-0"
              onClick={() => setShowNewTableForm(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Table
            </Button>
          </div>
        </div>
        
        {/* Selection Controls */}
        <div className="flex items-center justify-between mb-4 px-2">
          <button
            onClick={selectedTables.size === filteredTables.length ? clearSelection : selectAllTables}
            className="flex items-center gap-2 text-sm text-[#5A4A3D] hover:text-[#3A322D] transition-colors"
          >
            {selectedTables.size === filteredTables.length && filteredTables.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-[#C9A07E]" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {selectedTables.size === filteredTables.length && filteredTables.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          
          <div className="text-sm text-[#5A4A3D]">
            {tables.length} total tables
          </div>
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
                    Short identifier (max 10 characters, letters, numbers, hyphens only)
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
        {filteredTables.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {filteredTables.map((table) => {
              const statusStyle = getStatusStyle(table.status);
              const qrUrl = `${baseUrl}${table.qrCodeUrl}`;
              const isOffline = table.status === 'OFFLINE';
              const hasActiveOrder = table.status === 'ACTIVE' || table.status === 'NEW_ORDER' || table.status === 'AWAITING_PAYMENT';

              return (
                <div
                  key={table.id}
                  className={`bg-surface rounded-xl p-6 shadow-card border flex flex-col h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer ${
                    selectedTables.has(table.id) 
                      ? 'border-[#C9A07E] ring-2 ring-[#C9A07E]/30' 
                      : 'border-surface-container-low'
                  } ${isOffline ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  onClick={() => toggleTableSelection(table.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {/* Selection Checkbox */}
                      <div 
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedTables.has(table.id)
                            ? 'bg-[#C9A07E] border-[#C9A07E]'
                            : 'border-[#EFE4D8] group-hover:border-[#C9A07E]/50'
                        }`}
                      >
                        {selectedTables.has(table.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display text-title-sm text-primary group-hover:text-secondary transition-colors">{table.name}</h3>
                        <p className="text-on-surface-variant text-sm">{table.label || `${table.seats} seats`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-label-caps font-label-caps text-on-surface-variant mr-1">
                        {isOffline ? 'Offline' : 'Online'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTableStatus(table.id);
                        }}
                        className={`relative inline-block w-10 h-6 rounded-full transition-colors hover:scale-105 ${
                          !isOffline ? 'bg-secondary' : 'bg-surface-container-high'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                          !isOffline ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex-1 flex justify-center items-center py-4 bg-surface-container-low rounded-lg mb-4 group-hover:bg-surface-container transition-colors" data-qr-table={table.name}>
                    <div className="w-32 h-32 bg-white rounded flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <QRCodeSVG value={qrUrl} size={120} level="H" />
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={`${statusStyle.bg} ${statusStyle.text} px-3 py-1 rounded-full font-label-caps text-label-caps flex items-center`}>
                        <span className={`w-2 h-2 ${statusStyle.dot} rounded-full mr-2 ${hasActiveOrder ? 'animate-pulse' : ''}`} />
                        {statusStyle.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadQRCode(table.name, table.qrCodeUrl);
                          }}
                          className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-secondary-fixed hover:text-on-secondary-fixed-variant transition-all duration-300 hover:scale-110"
                          title="Download QR Code"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            shareQRCode(table.name, table.qrCodeUrl);
                          }}
                          className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-secondary-fixed hover:text-on-secondary-fixed-variant transition-all duration-300 hover:scale-110"
                          title="Share Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(table);
                          }}
                          className="p-2 rounded-full bg-surface-container-low text-error hover:bg-error-container transition-all duration-300 hover:scale-110"
                          title="Delete Table"
                          disabled={hasActiveOrder}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {hasActiveOrder ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" className="bg-primary text-on-primary hover:opacity-90">VIEW ORDER</Button>
                        <Button size="sm" variant="outline" className="border border-outline text-primary hover:bg-surface-container-low">CLOSE TABLE</Button>
                      </div>
                    ) : table.status === 'EMPTY' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-surface-container-high text-primary hover:bg-surface-container"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(qrUrl, '_blank');
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          PREVIEW
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-primary text-on-primary hover:opacity-90"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadQRCode(table.name, table.qrCodeUrl);
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          QR CODE
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full bg-secondary text-on-secondary hover:opacity-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTableStatus(table.id);
                        }}
                      >
                        REOPEN TABLE
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-on-surface-variant" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="font-display text-title-sm text-primary mb-2">No tables found</h3>
                <p className="text-on-surface-variant">Try adjusting your search criteria</p>
                <Button 
                  variant="outline" 
                  className="mt-4 rounded-full"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <h3 className="font-display text-title-sm text-primary mb-2">No Tables Yet</h3>
                <p className="text-on-surface-variant mb-4">Create your first table to generate QR codes for customers</p>
                <Button 
                  className="bg-primary text-on-primary"
                  onClick={() => setShowNewTableForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Table
                </Button>
              </>
            )}
          </div>
        )}
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
