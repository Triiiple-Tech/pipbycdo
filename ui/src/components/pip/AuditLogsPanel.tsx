import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Download, RefreshCw, Search, Filter, Calendar, User, Bot, Activity, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
  agent: string;
  event_type: string;
  event_details: string;
  model_used?: string;
  session_id?: string;
  task_id?: string;
  ip_address?: string;
  user_agent?: string;
  cost_estimate?: number;
  duration_ms?: number;
  error?: string;
  level: string;
}

interface AuditLogResponse {
  logs: AuditLogEntry[];
  total_count: number;
  page: number;
  page_size: number;
  filters_applied: Record<string, any>;
}

interface AuditLogStats {
  total_entries: number;
  date_range: {
    start: string;
    end: string;
  };
  by_event_type: Record<string, number>;
  by_agent: Record<string, number>;
  by_level: Record<string, number>;
  cost_summary: {
    total_cost: number;
    average_cost_per_call: number;
    highest_cost: number;
    total_duration_minutes: number;
  };
}

const AuditLogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(50);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    agent: '',
    eventType: '',
    userId: '',
    level: '',
    search: ''
  });

  const [exporting, setExporting] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
        ...(filters.agent && { agent: filters.agent }),
        ...(filters.eventType && { event_type: filters.eventType }),
        ...(filters.userId && { user_id: filters.userId }),
        ...(filters.level && { level: filters.level }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/analytics/audit-logs?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
      }

      const data: AuditLogResponse = await response.json();
      setLogs(data.logs);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  const fetchAuditStats = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate })
      });

      const response = await fetch(`/api/analytics/audit-logs/stats?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch audit stats: ${response.statusText}`);
      }

      const data: AuditLogStats = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch audit stats:', err);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchAuditLogs();
    fetchAuditStats();
  }, [fetchAuditLogs, fetchAuditStats]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleRefresh = () => {
    fetchAuditLogs();
    fetchAuditStats();
  };

  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    try {
      setExporting(true);

      const params = new URLSearchParams({
        format,
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
        ...(filters.agent && { agent: filters.agent }),
        ...(filters.eventType && { event_type: filters.eventType }),
        ...(filters.userId && { user_id: filters.userId }),
        ...(filters.level && { level: filters.level }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/analytics/audit-logs/export?${params}`);
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getEventTypeColor = (eventType: string): string => {
    switch (eventType) {
      case 'file_upload': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'agent_call': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'sheet_export': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'prompt_edit': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'user_action': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'system_event': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'debug': return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
      case 'info': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'warning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'critical': return 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (durationMs: number): string => {
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Complete audit trail of user actions and system events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Select onValueChange={(value) => handleExport(value as 'csv' | 'json' | 'excel')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Total Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_entries.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(stats.by_level).length} different levels
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Total Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.cost_summary.total_cost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: ${stats.cost_summary.average_cost_per_call.toFixed(3)} per call
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-500" />
                Active Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.by_agent).length}</div>
              <p className="text-xs text-muted-foreground">
                {Object.values(stats.by_agent).reduce((a, b) => a + b, 0)} total calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Total Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cost_summary.total_duration_minutes.toFixed(1)}m</div>
              <p className="text-xs text-muted-foreground">
                Processing time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Error loading audit logs</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Agent</label>
              <Select value={filters.agent} onValueChange={(value) => handleFilterChange('agent', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Agents</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="file-reader">File Reader</SelectItem>
                  <SelectItem value="trade-mapper">Trade Mapper</SelectItem>
                  <SelectItem value="scope">Scope</SelectItem>
                  <SelectItem value="takeoff">Takeoff</SelectItem>
                  <SelectItem value="estimator">Estimator</SelectItem>
                  <SelectItem value="qa-validator">QA Validator</SelectItem>
                  <SelectItem value="exporter">Exporter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select value={filters.eventType} onValueChange={(value) => handleFilterChange('eventType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Events</SelectItem>
                  <SelectItem value="file_upload">File Upload</SelectItem>
                  <SelectItem value="agent_call">Agent Call</SelectItem>
                  <SelectItem value="sheet_export">Sheet Export</SelectItem>
                  <SelectItem value="prompt_edit">Prompt Edit</SelectItem>
                  <SelectItem value="user_action">User Action</SelectItem>
                  <SelectItem value="system_event">System Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input
                type="text"
                placeholder="Filter by user..."
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search details..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative overflow-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50 backdrop-blur">
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Timestamp</th>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Agent</th>
                  <th className="text-left p-3 font-medium">Event</th>
                  <th className="text-left p-3 font-medium">Details</th>
                  <th className="text-left p-3 font-medium">Level</th>
                  <th className="text-left p-3 font-medium">Cost</th>
                  <th className="text-left p-3 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No audit logs found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-mono text-xs">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-24">
                            {log.user_email || log.user_id || 'System'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {log.agent}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={cn("text-xs", getEventTypeColor(log.event_type))}>
                          {log.event_type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="max-w-64 truncate" title={log.event_details}>
                          {log.event_details}
                        </div>
                        {log.error && (
                          <div className="text-xs text-red-500 mt-1" title={log.error}>
                            Error: {log.error.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={cn("text-xs", getLevelColor(log.level))}>
                          {log.level}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {log.cost_estimate ? `$${log.cost_estimate.toFixed(3)}` : '-'}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {log.duration_ms ? formatDuration(log.duration_ms) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPanel;
