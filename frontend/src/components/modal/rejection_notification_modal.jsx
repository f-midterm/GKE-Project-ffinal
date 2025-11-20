/**
 * RejectionNotificationModal Component
 * 
 * Modal that displays a rejection notification to the user.
 * User must acknowledge the rejection before they can create a new booking request.
 * This modal cannot be closed without acknowledging (no X button, no backdrop click).
 * 
 * @module components/modal/rejection_notification_modal
 */

import React, { useState } from 'react';
import { acknowledgeRejection } from '../../api/services/rentalRequests.service';

/**
 * Rejection notification modal component
 * 
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {number} props.requestId - The rental request ID to acknowledge
 * @param {string} props.rejectionReason - The reason for rejection
 * @param {Function} props.onAcknowledged - Callback after successful acknowledgement
 * @param {Function} [props.onError] - Optional error callback
 * 
 * @example
 * <RejectionNotificationModal
 *   isOpen={showRejectionModal}
 *   requestId={requestId}
 *   rejectionReason={rejectionReason}
 *   onAcknowledged={refetch}
 *   onError={(err) => toast.error(err.message)}
 * />
 */
function RejectionNotificationModal({ 
  isOpen, 
  requestId, 
  rejectionReason, 
  onAcknowledged,
  onError 
}) {
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  if (!isOpen) return null;

  /**
   * Handle acknowledgement button click
   */
  const handleAcknowledge = async () => {
    if (!requestId) {
      console.error('No request ID provided for acknowledgement');
      return;
    }

    try {
      setIsAcknowledging(true);
      
      // Call API to acknowledge rejection
      await acknowledgeRejection(requestId);
      
      // Call success callback to refetch booking status
      if (onAcknowledged) {
        await onAcknowledged();
      }
    } catch (error) {
      console.error('Failed to acknowledge rejection:', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      // No onClick - user cannot close by clicking backdrop
    >
      <div 
        className="bg-white rounded-lg w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            {/* Warning Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            
            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Booking Request Rejected
              </h2>
              <p className="text-sm text-gray-500">
                Your previous request was not approved
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4"></div>

        {/* Rejection Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Rejection:
          </label>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-800 whitespace-pre-wrap">
              {rejectionReason || 'No reason provided'}
            </p>
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-2">
            <svg 
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">You can submit a new booking request</p>
              <p className="text-blue-700">
                Please review the rejection reason above and make any necessary changes before submitting a new request.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleAcknowledge}
            disabled={isAcknowledging}
            className={`
              px-6 py-2.5 rounded-lg font-medium
              transition-colors duration-200
              ${isAcknowledging 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {isAcknowledging ? (
              <span className="flex items-center gap-2">
                <svg 
                  className="animate-spin h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              'I Understand'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectionNotificationModal;
