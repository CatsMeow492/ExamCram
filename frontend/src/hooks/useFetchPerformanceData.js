import { useCallback } from 'react';
import { fetchPerformanceData } from '../api/data';

const useFetchPerformanceData = (userId, setPerformanceData) => {
  return useCallback(() => {
    fetchPerformanceData(userId, setPerformanceData);
  }, [userId, setPerformanceData]);
};

export default useFetchPerformanceData;
