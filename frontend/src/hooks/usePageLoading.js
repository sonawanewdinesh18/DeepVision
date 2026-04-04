/**
 * usePageLoading Hook
 * Manages page loading state during route transitions
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show loader on route change
    setIsLoading(true);

    // Hide loader after a short delay (simulating page load)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return isLoading;
}

export default usePageLoading;
