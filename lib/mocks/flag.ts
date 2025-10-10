/**
 * Mock system flag utility
 * Determines when to use mock data vs real data
 */

export const isMockEnabled = (): boolean => {
  // Check both client and server environment variables
  return process.env.NEXT_PUBLIC_DASHBOARD_MOCK === '1' || 
         process.env.DASHBOARD_MOCK === '1';
};

export const shouldUseMock = (realData: any): boolean => {
  // Use mock if flag is enabled OR if real data is empty/null
  if (isMockEnabled()) {
    return true;
  }
  
  // Check if real data is empty
  if (!realData) {
    return true;
  }
  
  // Check if it's an array and empty
  if (Array.isArray(realData) && realData.length === 0) {
    return true;
  }
  
  // Check if it's an object and all values are empty/zero
  if (typeof realData === 'object' && realData !== null) {
    const values = Object.values(realData);
    return values.every(v => v === 0 || v === null || v === undefined || v === '');
  }
  
  return false;
};
