/**
 * useBookingStatus Hook
 * 
 * Custom hook for managing booking status and eligibility checks.
 * Fetches the latest rental request status for the authenticated user
 * and provides flags for UI decision-making (pending, approved, rejected, etc.)
 * 
 * @module hooks/useBookingStatus
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMyLatestRequest } from '../api/services/rentalRequests.service';

/**
 * Booking status hook for managing user's rental request state
 * 
 * @param {object} options - Hook options
 * @param {boolean} [options.autoFetch=true] - Automatically fetch on mount
 * @param {number} [options.pollingInterval] - Optional polling interval in ms (for waiting page)
 * 
 * @returns {object} Booking status state and functions
 * @returns {object|null} return.status - Latest request status object
 * @returns {boolean} return.status.isPending - User has pending request
 * @returns {boolean} return.status.isApproved - User has approved booking
 * @returns {boolean} return.status.isRejected - User has rejected request
 * @returns {boolean} return.status.requiresAcknowledgement - Must acknowledge rejection
 * @returns {boolean} return.status.hasActiveLease - User is already a villager
 * @returns {boolean} return.status.canCreateNewRequest - Can submit new booking
 * @returns {string} return.status.statusMessage - User-friendly status message
 * @returns {string|null} return.status.rejectionReason - Reason for rejection (if any)
 * @returns {number|null} return.status.requestId - Latest request ID
 * @returns {number|null} return.status.unitId - Unit ID of latest request
 * @returns {boolean} return.loading - Whether status is being fetched
 * @returns {string|null} return.error - Error message if any
 * @returns {boolean} return.canBook - Quick check: can user create new booking
 * @returns {string|null} return.shouldRedirect - Redirect path if needed ('/booking/waiting', null)
 * @returns {boolean} return.showRejectionModal - Should show rejection acknowledgement modal
 * @returns {string|null} return.rejectionReason - Rejection reason for modal
 * @returns {number|null} return.requestId - Request ID for acknowledgement
 * @returns {Function} return.refetch - Manually refetch booking status
 * @returns {Function} return.startPolling - Start polling for status updates
 * @returns {Function} return.stopPolling - Stop polling
 * 
 * @example
 * // Basic usage in booking page
 * const { loading, canBook, shouldRedirect, showRejectionModal, refetch } = useBookingStatus();
 * 
 * if (loading) return <Spinner />;
 * if (shouldRedirect) return <Navigate to={shouldRedirect} />;
 * if (showRejectionModal) return <RejectionModal onAcknowledge={refetch} />;
 * 
 * @example
 * // With polling for waiting page
 * const { status, startPolling, stopPolling } = useBookingStatus({ 
 *   pollingInterval: 30000 // Poll every 30 seconds
 * });
 * 
 * useEffect(() => {
 *   startPolling();
 *   return () => stopPolling();
 * }, []);
 */
export const useBookingStatus = ({ autoFetch = true, pollingInterval } = {}) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use ref instead of state to avoid infinite loop when updating timer
  const pollingTimerRef = useRef(null);

  /**
   * Fetch the latest booking status from API
   */
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getMyLatestRequest();
      setStatus(data);
      
      return data;
    } catch (err) {
      // Don't set error for 401 (user not logged in) - it's expected
      if (err.message && !err.message.includes('401')) {
        setError(err.message || 'Failed to fetch booking status');
      }
      setStatus(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Start polling for status updates (for waiting page)
   */
  const startPolling = useCallback(() => {
    if (!pollingInterval) return;

    // Clear existing timer if any
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    // Set up new polling interval
    const timer = setInterval(() => {
      fetchStatus();
    }, pollingInterval);

    pollingTimerRef.current = timer;

    return () => clearInterval(timer);
  }, [pollingInterval, fetchStatus]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []); // No dependencies needed since we're using ref

  /**
   * Refetch status manually (after acknowledgement, etc.)
   */
  const refetch = useCallback(async () => {
    return await fetchStatus();
  }, [fetchStatus]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchStatus();
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only run on mount and when autoFetch changes

  // Derived convenience flags
  const canBook = status?.canCreateNewRequest ?? false;
  const shouldRedirect = status?.isPending ? '/booking/waiting' : null;
  const showRejectionModal = status?.requiresAcknowledgement ?? false;
  const rejectionReason = status?.rejectionReason ?? null;
  const requestId = status?.id ?? null;

  return {
    // Raw status object
    status,
    
    // Loading and error states
    loading,
    error,
    
    // Convenience flags for quick checks
    canBook,
    shouldRedirect,
    showRejectionModal,
    rejectionReason,
    requestId,
    
    // Actions
    refetch,
    startPolling,
    stopPolling,
  };
};

export default useBookingStatus;
