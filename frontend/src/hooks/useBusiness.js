import { useContext } from 'react';
import { BusinessContext } from '../contexts/BusinessContext';

export const useBusiness = () => {
  const context = useContext(BusinessContext);

  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }

  // Helper function to check if user can create business
  const canCreateBusiness = () => {
    return !context.hasExistingBusiness && context.user?.user_type === 'business_owner';
  };

  // Helper to get user's business
  const getUserBusiness = () => {
    return context.businesses.length > 0 ? context.businesses[0] : null;
  };

  return {
    ...context,
    canCreateBusiness,
    getUserBusiness,
  };
};
