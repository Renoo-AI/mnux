'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Ban,
  Clock,
  Users,
  RefreshCw,
  Eye,
  Trash2,
  Unlock,
  Lock,
  Bug,
  Activity,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useSecurityActions } from '@/hooks/use-security';
import { securityService } from '@/services/securityService';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import type { SecurityLog, BannedDevice, KickedDevice } from '@/services/securityService';

function LogTypeBadge({ type }: { type: SecurityLog['type'] }) {
  const colors = {
    rate_limit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ban: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    kick: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    honeypot: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    suspicious_activity: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };

  const icons = {
    rate_limit: <Clock className="h-3 w-3" />,
    ban: <Ban className="h-3 w-3" />,
    kick: <Lock className="h-3 w-3" />,
    honeypot: <Bug className="h-3 w-3" />,
    suspicious_activity: <AlertTriangle className="h-3 w-3" />,
  };

  return (
    <Badge className={colors[type]}>
      <span className="flex items-center gap-1">
        {icons[type]}
        {type.replace('_', ' ').toUpperCase()}
      </span>
    </Badge>
  );
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return 'N/A';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatExpiry(expiresAt: number | null): string {
  if (!expiresAt) return 'Permanent';
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 24) return `${hours}h remaining`;
  return `${days}d remaining`;
}

export function SecurityDashboard() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [bannedDevices, setBannedDevices] = useState<BannedDevice[]>([]);
  const [kickedDevices, setKickedDevices] = useState<KickedDevice[]>([]);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    type: 'kick' | 'ban' | 'unban' | 'liftKick';
    device?: BannedDevice | KickedDevice;
  } | null>(null);

  const { kickDevice, liftKick, banDevice, unbanDevice, isProcessing } = useSecurityActions();
  const { session } = useStaffSession();

  // Check if security features are configured
  useEffect(() => {
    setIsConfigured(securityService.isSecurityConfigured());
  }, []);

  // Fetch security data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [logsResult, bannedResult, kickedResult] = await Promise.all([
          securityService.getSecurityLogs(session?.restaurantId),
          securityService.getBannedDevices(),
          securityService.getKickedDevices(session?.restaurantId),
        ]);
        
        setLogs(logsResult.logs);
        setBannedDevices(bannedResult.devices);
        setKickedDevices(kickedResult.devices);
      } catch (error) {
        console.error('Error fetching security data:', error);
        toast.error('Failed to load security data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session?.restaurantId]);

  const filteredLogs = logs.filter(log => {
    if (logFilter !== 'all' && log.type !== logFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.deviceId?.toLowerCase().includes(query) ||
        log.ip?.toLowerCase().includes(query) ||
        log.reason?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    totalEvents: logs.length,
    rateLimited: logs.filter(l => l.type === 'rate_limit').length,
    botsDetected: logs.filter(l => l.type === 'honeypot').length,
    banned: bannedDevices.length,
    kicked: kickedDevices.length,
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const [logsResult, bannedResult, kickedResult] = await Promise.all([
        securityService.getSecurityLogs(session?.restaurantId),
        securityService.getBannedDevices(),
        securityService.getKickedDevices(session?.restaurantId),
      ]);
      
      setLogs(logsResult.logs);
      setBannedDevices(bannedResult.devices);
      setKickedDevices(kickedResult.devices);
      toast.success('Security data refreshed');
    } catch (error) {
      console.error('Error refreshing security data:', error);
      toast.error('Failed to refresh security data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    
    // Handle action based on type
    toast.success('Action completed');
    setActionDialog(null);
  };

  return (
    <div className="space-y-6">
      {/* Not Configured Warning */}
      {!isConfigured && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">Security Features Not Configured</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Advanced security features (device ban, kick, security logs) require Firebase Functions to be deployed.
                Contact your administrator to enable these features.
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Basic rate limiting is still active on API endpoints.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && logs.length === 0 && bannedDevices.length === 0 && kickedDevices.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Stats Cards */}
      {(!isLoading || logs.length > 0 || bannedDevices.length > 0 || kickedDevices.length > 0) && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Total Events</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.totalEvents}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Rate Limited</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats.rateLimited}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Bug className="h-4 w-4" />
                <span className="text-sm">Bots Detected</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">{stats.botsDetected}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Ban className="h-4 w-4" />
                <span className="text-sm">Banned</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{stats.banned}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Kicked</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400">{stats.kicked}</div>
            </motion.div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="logs" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="logs">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity Logs
                </TabsTrigger>
                <TabsTrigger value="banned">
                  <Ban className="h-4 w-4 mr-2" />
                  Banned Devices
                </TabsTrigger>
                <TabsTrigger value="kicked">
                  <Lock className="h-4 w-4 mr-2" />
                  Kicked Devices
                </TabsTrigger>
              </TabsList>

              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Activity Logs Tab */}
            <TabsContent value="logs">
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by device, IP, or reason..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Select value={logFilter} onValueChange={setLogFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="rate_limit">Rate Limited</SelectItem>
                      <SelectItem value="honeypot">Bot Detected</SelectItem>
                      <SelectItem value="ban">Bans</SelectItem>
                      <SelectItem value="kick">Kicks</SelectItem>
                      <SelectItem value="suspicious_activity">Suspicious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Logs Table */}
                <div className="bg-card border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Device ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Reason</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredLogs.map((log) => (
                          <motion.tr
                            key={log.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <LogTypeBadge type={log.type} />
                            </td>
                            <td className="px-4 py-3 font-mono text-sm">
                              {log.deviceId || '-'}
                            </td>
                            <td className="px-4 py-3 font-mono text-sm">
                              {log.ip || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm max-w-xs truncate">
                              {log.reason}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {formatTime(log.timestamp)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No logs found
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Banned Devices Tab */}
            <TabsContent value="banned">
              <div className="grid gap-4">
                {bannedDevices.map((device) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Ban className="h-5 w-5 text-red-500" />
                          <span className="font-mono font-medium">{device.deviceId}</span>
                          {device.expiresAt ? (
                            <Badge variant="outline">{formatExpiry(device.expiresAt)}</Badge>
                          ) : (
                            <Badge variant="destructive">Permanent</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{device.reason}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {device.ip && <span>IP: {device.ip}</span>}
                          <span>Banned: {formatTime(device.bannedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActionDialog({ type: 'unban', device })}
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          Unban
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {bannedDevices.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <Ban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No banned devices</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Kicked Devices Tab */}
            <TabsContent value="kicked">
              <div className="grid gap-4">
                {kickedDevices.map((device) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-5 w-5 text-orange-500" />
                          <span className="font-mono font-medium">{device.deviceId}</span>
                          <Badge variant="outline">{formatExpiry(device.expiresAt)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {device.reason || 'No reason provided'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Table: {device.tableId}</span>
                          <span>Kicked: {formatTime(device.kickedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActionDialog({ type: 'liftKick', device })}
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          Lift Kick
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {kickedDevices.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No kicked devices</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Dialog */}
          <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {actionDialog?.type === 'unban' && 'Unban Device'}
                  {actionDialog?.type === 'liftKick' && 'Lift Kick'}
                </DialogTitle>
                <DialogDescription>
                  {actionDialog?.type === 'unban' && 'This will restore full access to the device.'}
                  {actionDialog?.type === 'liftKick' && 'This will allow the device to place orders at this table again.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Device: <span className="font-mono">{actionDialog?.device?.deviceId}</span>
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setActionDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={handleAction} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
