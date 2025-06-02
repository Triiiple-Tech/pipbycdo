import { useState, useEffect, useCallback, useRef } from 'react';

export interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
  timestamp: Date;
  status: 'online' | 'warning' | 'offline';
}

export interface RealTimeEvent {
  id: string;
  type: 'metric_update' | 'alert' | 'system_status' | 'user_activity';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  data?: any;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

export interface UseRealTimeDataReturn {
  metrics: RealTimeMetric[];
  events: RealTimeEvent[];
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  subscribe: (metricIds: string[]) => void;
  unsubscribe: (metricIds: string[]) => void;
  connect: () => void;
  disconnect: () => void;
  clearEvents: () => void;
  getMetricById: (id: string) => RealTimeMetric | undefined;
}

// Mock WebSocket class for development
class MockWebSocket {
  private callbacks: { [key: string]: Function[] } = {};
  private isConnected = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private url: string) {}

  addEventListener(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  send(data: string) {
    console.log('Mock WebSocket sending:', data);
  }

  connect() {
    this.isConnected = true;
    this.emit('open', {});
    
    // Start sending mock data
    this.intervalId = setInterval(() => {
      this.sendMockData();
    }, 2000);
  }

  close() {
    this.isConnected = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.emit('close', {});
  }

  private emit(event: string, data: any) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  private sendMockData() {
    const mockMetrics = [
      {
        id: 'active_users',
        name: 'Active Users',
        value: 1250 + Math.floor(Math.random() * 200),
        unit: 'users',
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: -10 + Math.random() * 20,
        changePercent: -5 + Math.random() * 10,
        timestamp: new Date(),
        status: 'online'
      },
      {
        id: 'server_load',
        name: 'Server Load',
        value: 45 + Math.random() * 30,
        unit: '%',
        trend: Math.random() > 0.6 ? 'up' : 'stable',
        change: -2 + Math.random() * 4,
        changePercent: -3 + Math.random() * 6,
        timestamp: new Date(),
        status: 'online'
      },
      {
        id: 'response_time',
        name: 'Avg Response Time',
        value: 120 + Math.random() * 80,
        unit: 'ms',
        trend: Math.random() > 0.7 ? 'down' : 'stable',
        change: -10 + Math.random() * 20,
        changePercent: -8 + Math.random() * 16,
        timestamp: new Date(),
        status: 'online'
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        value: Math.random() * 2.5,
        unit: '%',
        trend: Math.random() > 0.5 ? 'down' : 'stable',
        change: -0.2 + Math.random() * 0.4,
        changePercent: -10 + Math.random() * 20,
        timestamp: new Date(),
        status: 'online'
      }
    ];

    const randomMetric = mockMetrics[Math.floor(Math.random() * mockMetrics.length)];
    
    this.emit('message', {
      data: JSON.stringify({
        type: 'metric_update',
        payload: randomMetric
      })
    });

    // Occasionally send events
    if (Math.random() > 0.7) {
      const events = [
        {
          type: 'alert',
          title: 'High Server Load',
          description: 'Server load exceeded 80% threshold',
          severity: 'warning'
        },
        {
          type: 'system_status',
          title: 'Database Backup Complete',
          description: 'Scheduled backup completed successfully',
          severity: 'success'
        },
        {
          type: 'user_activity',
          title: 'New Project Created',
          description: 'Project "Mobile App Redesign" was created',
          severity: 'info'
        }
      ];

      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      this.emit('message', {
        data: JSON.stringify({
          type: 'event',
          payload: {
            id: Date.now().toString(),
            ...randomEvent,
            timestamp: new Date()
          }
        })
      });
    }
  }
}

export const useRealTimeData = (
  wsUrl: string = 'ws://localhost:8080/analytics',
  autoConnect: boolean = true
): UseRealTimeDataReturn => {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    error: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [subscribedMetrics, setSubscribedMetrics] = useState<string[]>([]);

  const wsRef = useRef<MockWebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket message handler
  const handleMessage = useCallback((event: MessageEvent | { data: string }) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'metric_update':
          const metric = message.payload as RealTimeMetric;
          setMetrics(prev => {
            const existing = prev.find(m => m.id === metric.id);
            if (existing) {
              return prev.map(m => m.id === metric.id ? metric : m);
            } else {
              return [...prev, metric];
            }
          });
          break;

        case 'event':
          const newEvent = message.payload as RealTimeEvent;
          setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
          break;

        case 'heartbeat':
          setConnectionStatus(prev => ({
            ...prev,
            lastHeartbeat: new Date()
          }));
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, []);

  // WebSocket connection handlers
  const handleOpen = useCallback(() => {
    setConnectionStatus(prev => ({
      ...prev,
      isConnected: true,
      reconnectAttempts: 0,
      error: null,
      lastHeartbeat: new Date()
    }));
    setIsLoading(false);

    // Subscribe to initial metrics
    if (subscribedMetrics.length > 0) {
      wsRef.current?.send(JSON.stringify({
        type: 'subscribe',
        payload: { metrics: subscribedMetrics }
      }));
    }

    // Start heartbeat
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    heartbeatTimeoutRef.current = setTimeout(() => {
      checkHeartbeat();
    }, 30000); // 30 seconds
  }, [subscribedMetrics]);

  const handleClose = useCallback(() => {
    setConnectionStatus(prev => ({
      ...prev,
      isConnected: false,
      lastHeartbeat: null
    }));

    // Clear heartbeat timeout
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }

    // Attempt reconnection
    if (autoConnect) {
      attemptReconnection();
    }
  }, [autoConnect]);

  const handleError = useCallback((error: Event) => {
    setConnectionStatus(prev => ({
      ...prev,
      error: 'WebSocket connection error'
    }));
    setIsLoading(false);
  }, []);

  // Check heartbeat and reconnect if needed
  const checkHeartbeat = useCallback(() => {
    setConnectionStatus(prev => {
      const now = new Date();
      const lastHeartbeat = prev.lastHeartbeat;
      
      if (!lastHeartbeat || (now.getTime() - lastHeartbeat.getTime()) > 35000) {
        // No heartbeat for 35 seconds, consider connection lost
        if (wsRef.current) {
          wsRef.current.close();
        }
        return { ...prev, isConnected: false, error: 'Connection timeout' };
      }
      
      return prev;
    });
  }, []);

  // Attempt reconnection with exponential backoff
  const attemptReconnection = useCallback(() => {
    setConnectionStatus(prev => {
      const attempts = prev.reconnectAttempts + 1;
      const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);

      return { ...prev, reconnectAttempts: attempts };
    });
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current && connectionStatus.isConnected) {
      return; // Already connected
    }

    setIsLoading(true);
    setConnectionStatus(prev => ({ ...prev, error: null }));

    try {
      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Create new connection (using mock for development)
      wsRef.current = new MockWebSocket(wsUrl);
      
      // Setup event listeners
      wsRef.current.addEventListener('open', handleOpen);
      wsRef.current.addEventListener('close', handleClose);
      wsRef.current.addEventListener('error', handleError);
      wsRef.current.addEventListener('message', handleMessage);

      // Start connection
      wsRef.current.connect();
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      setIsLoading(false);
    }
  }, [wsUrl, connectionStatus.isConnected, handleOpen, handleClose, handleError, handleMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus({
      isConnected: false,
      lastHeartbeat: null,
      reconnectAttempts: 0,
      error: null
    });
  }, []);

  // Subscribe to metrics
  const subscribe = useCallback((metricIds: string[]) => {
    setSubscribedMetrics(prev => {
      const newMetrics = [...new Set([...prev, ...metricIds])];
      
      if (wsRef.current && connectionStatus.isConnected) {
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          payload: { metrics: newMetrics }
        }));
      }
      
      return newMetrics;
    });
  }, [connectionStatus.isConnected]);

  // Unsubscribe from metrics
  const unsubscribe = useCallback((metricIds: string[]) => {
    setSubscribedMetrics(prev => {
      const newMetrics = prev.filter(id => !metricIds.includes(id));
      
      if (wsRef.current && connectionStatus.isConnected) {
        wsRef.current.send(JSON.stringify({
          type: 'unsubscribe',
          payload: { metrics: metricIds }
        }));
      }
      
      return newMetrics;
    });

    // Remove metrics from state
    setMetrics(prev => prev.filter(metric => !metricIds.includes(metric.id)));
  }, [connectionStatus.isConnected]);

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Get metric by ID
  const getMetricById = useCallback((id: string): RealTimeMetric | undefined => {
    return metrics.find(metric => metric.id === id);
  }, [metrics]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  return {
    metrics,
    events,
    connectionStatus,
    isLoading,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
    clearEvents,
    getMetricById
  };
};

export default useRealTimeData;
