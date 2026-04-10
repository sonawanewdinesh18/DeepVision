import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const useLastActive = () => {
  const { user, supabase } = useAuth();

  const updateLastActive = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Call backend API to update last active time
      const response = await fetch('/api/v1/user/update-last-active', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to update last active time');
      }
    } catch (error) {
      console.warn('Error updating last active time:', error);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;

    // Update last active on mount (when user loads the app)
    updateLastActive();

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let lastUpdate = Date.now();
    const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > UPDATE_INTERVAL) {
        lastUpdate = now;
        updateLastActive();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Update on visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateLastActive();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, updateLastActive]);

  return { updateLastActive };
};

export default useLastActive;