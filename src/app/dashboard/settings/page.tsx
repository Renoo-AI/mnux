'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Camera, Edit, QrCode, MoreVertical, AlertCircle, Check, Loader2, Sun, Moon, Monitor, Palette, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { useFormValidation, validationPatterns } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';

interface SettingsFormValues {
  restaurantName: string;
  cuisineType: string;
  address: string;
  phone: string;
  email: string;
}

const initialValues: SettingsFormValues = {
  restaurantName: 'The Gilded Bean',
  cuisineType: 'Modern European & Artisan Coffee',
  address: '124 Savile Row, Mayfair, London, W1S 3PR, United Kingdom',
  phone: '+44 20 7123 4567',
  email: 'info@thegildedbean.com',
};

const formConfig = {
  restaurantName: {
    rules: { required: true, minLength: 2, maxLength: 100 },
    label: 'Restaurant Name',
  },
  cuisineType: {
    rules: { maxLength: 100 },
    label: 'Cuisine Type',
  },
  address: {
    rules: { required: true, minLength: 10, maxLength: 200 },
    label: 'Address',
  },
  phone: {
    rules: { pattern: validationPatterns.phone },
    label: 'Phone Number',
  },
  email: {
    rules: { pattern: validationPatterns.email },
    label: 'Email Address',
  },
};

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [staff, setStaff] = useState<Array<{ id: string; name: string; email: string; role: string; status: string }>>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { session } = useStaffSession();
  
  // Use resolvedTheme which handles hydration automatically
  const currentTheme = resolvedTheme || 'light';

  // Fetch staff data
  useEffect(() => {
    const restaurantId = session?.restaurantId;
    if (!restaurantId) {
      return;
    }

    const staffQuery = query(
      collection(db, 'staff'),
      where('restaurantId', '==', restaurantId)
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      staffQuery,
      (snapshot) => {
        const staffData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unknown',
            email: data.email || '',
            role: (data.role || 'waiter').toUpperCase(),
            status: data.active ? 'ACTIVE' : 'INACTIVE',
          };
        });
        setStaff(staffData);
        setLoadingStaff(false);
      },
      (error) => {
        console.error('Error fetching staff:', error);
        setLoadingStaff(false);
      }
    );

    return () => unsubscribe();
  }, [session?.restaurantId]);
  
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isDirty,
    resetForm,
  } = useFormValidation<SettingsFormValues>(initialValues, formConfig);

  const onSubmit = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSaving(false);
    setSaveSuccess(true);
    
    toast({
      title: 'Settings Saved',
      description: 'Your restaurant profile has been updated successfully.',
    });
    
    // Reset success state after animation
    setTimeout(() => setSaveSuccess(false), 2000);
  }, [toast]);

  const getFieldError = (fieldName: keyof SettingsFormValues) => {
    return touched[fieldName] && errors[fieldName];
  };

  const getFieldClasses = (fieldName: keyof SettingsFormValues) => {
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
        title="Settings"
        showSearch={false}
        user={{ name: 'Elena Aris', role: 'manager' }}
      />

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
        {/* Restaurant Profile */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary">Restaurant Profile</h3>
            <p className="text-on-surface-variant mt-2">Update your public information and branding assets.</p>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-card space-y-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row items-center gap-6 border-b border-outline-variant pb-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full object-cover border-4 border-surface-container-high bg-surface-container-low flex items-center justify-center group-hover:border-secondary transition-colors duration-300">
                  <span className="material-symbols-outlined text-outline text-4xl">restaurant</span>
                </div>
                <button className="absolute bottom-0 right-0 bg-primary text-on-primary p-1 rounded-full shadow-lg border-2 border-surface hover:scale-110 transition-transform duration-200">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
                    RESTAURANT NAME <span className="text-error">*</span>
                  </label>
                  <Input
                    value={values.restaurantName}
                    onChange={(e) => handleChange('restaurantName', e.target.value)}
                    onBlur={() => handleBlur('restaurantName')}
                    className={getFieldClasses('restaurantName')}
                    placeholder="Enter restaurant name"
                  />
                  {getFieldError('restaurantName') && (
                    <p className="text-error text-sm mt-1 flex items-center gap-1 animate-slide-in-up">
                      <AlertCircle className="w-4 h-4" />
                      {errors.restaurantName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
                    CUISINE TYPE
                  </label>
                  <Input
                    value={values.cuisineType}
                    onChange={(e) => handleChange('cuisineType', e.target.value)}
                    onBlur={() => handleBlur('cuisineType')}
                    className={getFieldClasses('cuisineType')}
                    placeholder="e.g., Italian, Asian Fusion"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
                ADDRESS <span className="text-error">*</span>
              </label>
              <textarea
                value={values.address}
                onChange={(e) => handleChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                rows={3}
                className={`${getFieldClasses('address')} resize-none`}
                placeholder="Full restaurant address"
              />
              {getFieldError('address') && (
                <p className="text-error text-sm mt-1 flex items-center gap-1 animate-slide-in-up">
                  <AlertCircle className="w-4 h-4" />
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
                  PHONE NUMBER
                </label>
                <Input
                  value={values.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  className={getFieldClasses('phone')}
                  placeholder="+44 20 7123 4567"
                />
                {getFieldError('phone') && (
                  <p className="text-error text-sm mt-1 flex items-center gap-1 animate-slide-in-up">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
                  EMAIL ADDRESS
                </label>
                <Input
                  type="email"
                  value={values.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={getFieldClasses('email')}
                  placeholder="restaurant@example.com"
                />
                {getFieldError('email') && (
                  <p className="text-error text-sm mt-1 flex items-center gap-1 animate-slide-in-up">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Operational Hours */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary">Operational Hours</h3>
            <p className="text-on-surface-variant mt-2">Manage when your kitchen and bar are open for business.</p>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-card">
            <div className="space-y-4">
              {[
                { label: 'Weekdays', hours: '08:00 AM — 11:00 PM', highlighted: false },
                { label: 'Weekends', hours: '10:00 AM — 01:00 AM', highlighted: true },
                { label: 'Public Holidays', hours: 'Closed', highlighted: false },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-4 bg-surface-container-low rounded-xl transition-all duration-300 hover:bg-surface-container ${
                    item.highlighted ? 'border border-secondary-fixed' : 'border border-transparent hover:border-outline-variant'
                  }`}
                >
                  <span className="font-display text-title-sm font-bold">{item.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-body">{item.hours}</span>
                    <button className="text-secondary font-label-caps text-label-caps hover:underline hover:text-primary transition-colors">EDIT</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Appearance Settings */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in-up" style={{ animationDelay: '150ms' }}>
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary">Appearance</h3>
            <p className="text-on-surface-variant mt-2">Customize the look and feel of your dashboard.</p>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300">
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-4">
                  THEME PREFERENCE
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
                      currentTheme === 'light'
                        ? 'border-secondary bg-secondary-fixed/20 shadow-md'
                        : 'border-outline-variant hover:border-secondary/50 hover:bg-surface-container-low'
                    }`}
                  >
                    <Sun className={`w-8 h-8 ${currentTheme === 'light' ? 'text-secondary' : 'text-on-surface-variant'}`} />
                    <span className="font-display text-title-sm">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
                      currentTheme === 'dark'
                        ? 'border-secondary bg-secondary-fixed/20 shadow-md'
                        : 'border-outline-variant hover:border-secondary/50 hover:bg-surface-container-low'
                    }`}
                  >
                    <Moon className={`w-8 h-8 ${currentTheme === 'dark' ? 'text-secondary' : 'text-on-surface-variant'}`} />
                    <span className="font-display text-title-sm">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
                      theme === 'system'
                        ? 'border-secondary bg-secondary-fixed/20 shadow-md'
                        : 'border-outline-variant hover:border-secondary/50 hover:bg-surface-container-low'
                    }`}
                  >
                    <Monitor className={`w-8 h-8 ${theme === 'system' ? 'text-secondary' : 'text-on-surface-variant'}`} />
                    <span className="font-display text-title-sm">System</span>
                  </button>
                </div>
              </div>
              
              {/* Color Accent */}
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-4">
                  ACCENT COLOR
                </label>
                <div className="flex gap-3">
                  {[
                    { color: '#C9A07E', name: 'Café' },
                    { color: '#6B8E4E', name: 'Garden' },
                    { color: '#7B68A6', name: 'Violet' },
                    { color: '#C46B6B', name: 'Rose' },
                    { color: '#5B8BA0', name: 'Ocean' },
                  ].map((accent) => (
                    <button
                      key={accent.color}
                      className="group relative"
                      title={accent.name}
                    >
                      <div 
                        className="w-10 h-10 rounded-full transition-transform duration-200 group-hover:scale-110 ring-2 ring-transparent group-hover:ring-outline-variant"
                        style={{ backgroundColor: accent.color }}
                      />
                      <span className="sr-only">{accent.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-on-surface-variant text-sm mt-3">
                  Premium feature: Customize your brand accent color
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Table Management */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary">Table Management</h3>
            <p className="text-on-surface-variant mt-2">Organize your floor plan and manage digital menu QR codes.</p>
            <Button className="mt-4 bg-primary text-on-primary hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4 mr-2" />
              New Table
            </Button>
          </div>
          
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'T-01', label: 'Window Side', seats: 4 },
              { name: 'T-02', label: 'Main Hall', seats: 2 },
              { name: 'B-01', label: 'Bar Stool', seats: 1 },
            ].map((table, i) => (
              <div 
                key={i} 
                className="bg-white p-4 rounded-xl shadow-card flex items-center justify-between hover:bg-surface-container-low hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    {table.name}
                  </div>
                  <div>
                    <h4 className="font-display text-title-sm font-bold">{table.label}</h4>
                    <p className="font-label-caps text-[10px] text-on-surface-variant">{table.seats} SEATS</p>
                  </div>
                </div>
                <button className="p-2 hover:text-secondary hover:scale-110 transition-all">
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            <button className="bg-white p-4 rounded-xl shadow-card flex items-center justify-center border-2 border-dashed border-outline-variant hover:border-secondary hover:bg-surface-container-low transition-all duration-300 group">
              <div className="flex items-center gap-4 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center group-hover:bg-secondary-fixed transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="font-body font-bold">Add Custom Table</span>
              </div>
            </button>
          </div>
        </section>

        {/* Staff Management */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in-up" style={{ animationDelay: '300ms' }}>
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary">Staff Management</h3>
            <p className="text-on-surface-variant mt-2">Manage roles, permissions, and staff login access.</p>
          </div>
          
          <div className="lg:col-span-2 bg-white rounded-xl shadow-card overflow-hidden">
            {loadingStaff ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-on-surface-variant" />
                </div>
                <h3 className="font-display text-title-sm text-primary mb-1">No staff members yet</h3>
                <p className="text-on-surface-variant">Add staff from the Staff Management page</p>
              </div>
            ) : (
              <>
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low border-b border-outline-variant">
                    <tr>
                      <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">STAFF MEMBER</th>
                      <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">ROLE</th>
                      <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">STATUS</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {staff.map((staffMember) => (
                      <tr key={staffMember.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-on-secondary-fixed">
                              {staffMember.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-body font-bold">{staffMember.name}</p>
                              <p className="text-[12px] text-on-surface-variant">{staffMember.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`font-label-caps text-[10px] px-3 py-1 rounded-full ${
                            staffMember.role === 'MANAGER' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container-highest text-on-surface-variant'
                          }`}>
                            {staffMember.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${staffMember.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            <span className="font-label-caps text-[10px]">{staffMember.status}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-all">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 text-center bg-surface-container-low">
                  <button className="text-secondary font-label-caps text-label-caps hover:underline hover:text-primary transition-colors">VIEW ALL STAFF</button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <footer className="p-10 border-t border-outline-variant flex justify-end gap-4 sticky bottom-0 bg-surface/80 backdrop-blur-md">
        <Button 
          variant="outline" 
          className="px-10 py-4 border border-primary text-primary rounded-full hover:bg-surface-container-low transition-colors"
          onClick={resetForm}
          disabled={!isDirty || isSaving}
        >
          Discard Changes
        </Button>
        <Button 
          className={`px-10 py-4 rounded-full shadow-lg transition-all duration-300 ${
            saveSuccess 
              ? 'bg-green-600 text-white' 
              : 'bg-primary text-on-primary hover:opacity-90'
          }`}
          onClick={() => handleSubmit(onSubmit)}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Saved!
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </footer>
    </DashboardLayout>
  );
}
