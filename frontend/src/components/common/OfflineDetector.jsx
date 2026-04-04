import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import toast from '@/utils/toast';
import './OfflineDetector.css';

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
      toast.success('Back online! Your connection has been restored.', {
        icon: <Wifi size={18} />,
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      toast.error('You are offline. Some features may not work.', {
        icon: <WifiOff size={18} />,
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className="offline-banner">
      <div className="offline-content">
        <WifiOff size={20} />
        <span>You're offline. Check your internet connection.</span>
      </div>
    </div>
  );
}

/**
 * Hook to check online status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default OfflineDetector;
