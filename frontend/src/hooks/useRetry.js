/**
 * Smart Retry Hook with Exponential Backoff
 * GitHub style retry mechanism
 */

import { useState } from 'react';

export const useRetry = (maxRetries = 3, baseDelay = 1000) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = async (fn) => {
    setIsRetrying(true);
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await fn();
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        if (i === maxRetries) {
          setIsRetrying(false);
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = baseDelay * Math.pow(2, i);
        setRetryCount(i + 1);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const reset = () => {
    setRetryCount(0);
    setIsRetrying(false);
  };

  return { retry, retryCount, isRetrying, reset };
};

export default useRetry;
