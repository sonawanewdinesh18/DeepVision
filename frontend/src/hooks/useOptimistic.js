/**
 * Optimistic UI Updates Hook
 * Twitter/X style instant feedback
 */

import { useState } from 'react';
import toast from '../utils/toast';

export const useOptimistic = (initialData) => {
  const [data, setData] = useState(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const update = async (optimisticData, serverUpdate) => {
    // Store original data for rollback
    const originalData = data;
    
    // Immediately update UI
    setData(optimisticData);
    setIsOptimistic(true);

    try {
      // Perform server update
      const result = await serverUpdate();
      
      // Update with server response
      setData(result);
      setIsOptimistic(false);
      
      return result;
    } catch (error) {
      // Rollback on error
      setData(originalData);
      setIsOptimistic(false);
      
      toast.error('Update failed. Changes reverted.');
      throw error;
    }
  };

  return [data, update, isOptimistic];
};

export default useOptimistic;
