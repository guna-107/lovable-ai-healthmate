import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncStatus {
  lastSync: Date | null;
  syncing: boolean;
  error: string | null;
}

export const useWearableSync = (userId: string | undefined) => {
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncStatus>>({});
  const { toast } = useToast();

  // Start real-time sync for active connections
  useEffect(() => {
    if (!userId) return;

    const syncData = async (provider: string) => {
      setSyncStatus(prev => ({
        ...prev,
        [provider]: { ...prev[provider], syncing: true, error: null },
      }));

      try {
        const { data: session } = await supabase.auth.getSession();
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-wearable-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.session?.access_token}`,
            },
            body: JSON.stringify({ provider }),
          }
        );

        if (!response.ok) {
          throw new Error('Sync failed');
        }

        const data = await response.json();
        
        setSyncStatus(prev => ({
          ...prev,
          [provider]: {
            lastSync: new Date(),
            syncing: false,
            error: null,
          },
        }));

        toast({
          title: 'Sync Complete',
          description: `Successfully synced ${data.recordsCount} records from ${provider}`,
        });
      } catch (error: any) {
        setSyncStatus(prev => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            syncing: false,
            error: error.message,
          },
        }));

        toast({
          title: 'Sync Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    // Set up real-time listener for wearable connection changes
    const channel = supabase
      .channel('wearable-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wearable_connections',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const connection = payload.new as any;
            if (connection.is_active) {
              // Auto-sync when connection is activated
              await syncData(connection.provider);
            }
          }
        }
      )
      .subscribe();

    // Initial sync for active connections
    const loadActiveConnections = async () => {
      const { data: connections } = await supabase
        .from('wearable_connections')
        .select('provider, last_sync')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (connections) {
        connections.forEach(conn => {
          setSyncStatus(prev => ({
            ...prev,
            [conn.provider]: {
              lastSync: conn.last_sync ? new Date(conn.last_sync) : null,
              syncing: false,
              error: null,
            },
          }));
        });
      }
    };

    loadActiveConnections();

    // Set up periodic sync (every 15 minutes)
    const syncInterval = setInterval(async () => {
      const { data: connections } = await supabase
        .from('wearable_connections')
        .select('provider')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (connections) {
        for (const conn of connections) {
          await syncData(conn.provider);
        }
      }
    }, 15 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(syncInterval);
    };
  }, [userId, toast]);

  const manualSync = async (provider: string) => {
    setSyncStatus(prev => ({
      ...prev,
      [provider]: { ...prev[provider], syncing: true, error: null },
    }));

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-wearable-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ provider }),
        }
      );

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const data = await response.json();
      
      setSyncStatus(prev => ({
        ...prev,
        [provider]: {
          lastSync: new Date(),
          syncing: false,
          error: null,
        },
      }));

      toast({
        title: 'Sync Complete',
        description: `Successfully synced ${data.recordsCount} records`,
      });
    } catch (error: any) {
      setSyncStatus(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          syncing: false,
          error: error.message,
        },
      }));

      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return { syncStatus, manualSync };
};
