import { useCallback } from 'react';
import { fetchPerformanceData } from '../api/data';

const useFetchPerformanceData = (userId, setPerformanceData) => {
  return useCallback(() => {
    const fetchData = async () => {
      try {
        await fetchPerformanceData(userId, setPerformanceData);
        console.log('Performance data fetched');
      } catch (error) {
        console.error('Error fetching performance data:', error);
      }
    };
    fetchData();
  }, [userId, setPerformanceData]);
};

export default useFetchPerformanceData;
