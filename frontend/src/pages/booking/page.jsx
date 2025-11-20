import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UnitList from '../../components/list/unit_list';
import UnitDetail from '../../components/form/unit_detail';
import useMediaQuery from '../../hooks/useMediaQuery';
import { useBookingStatus } from '../../hooks/useBookingStatus';
import UnitSelectedModal from '../../components/modal/unit_selected_modal';
import RejectionNotificationModal from '../../components/modal/rejection_notification_modal';
import { FiChevronLeft } from "react-icons/fi";

import BookingPageSkeleton from '../../components/skeleton/booking_page_skeleton';

function BookingPage() {
  const navigate = useNavigate();
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnitDetailLoading, setIsUnitDetailLoading] = useState(false);
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');

  // Booking status hook
  const { 
    loading, 
    status,
    shouldRedirect, 
    showRejectionModal, 
    rejectionReason, 
    requestId,
    refetch 
  } = useBookingStatus();

  const handleSelectUnit = (unitId) => {
    setIsUnitDetailLoading(true);
    setSelectedUnitId(unitId);
    if (!isLargeScreen) {
      setIsModalOpen(true);
    }
    setTimeout(() => {
      setIsUnitDetailLoading(false);
    }, 500);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  /**
   * Handle rejection acknowledgement success
   * Refetch booking status after acknowledgement
   */
  const handleAcknowledged = async () => {
    await refetch();
  };

  /**
   * Redirect to waiting page if user has pending request
   */
  useEffect(() => {
    if (shouldRedirect) {
      navigate(shouldRedirect);
    }
  }, [shouldRedirect, navigate]);

  /**
   * Show loading state while fetching booking status
   */
  if (loading) {
    return <BookingPageSkeleton />;
  }

  /**
   * Show rejection modal if user has unacknowledged rejection
   */
  if (showRejectionModal) {
    return (
      <RejectionNotificationModal
        isOpen={showRejectionModal}
        requestId={requestId}
        rejectionReason={rejectionReason}
        onAcknowledged={handleAcknowledged}
        onError={(error) => {
          console.error('Failed to acknowledge rejection:', error);
          alert('Failed to acknowledge rejection. Please try again.');
        }}
      />
    );
  }



  /**
   * Show active lease notification (VILLAGER role)
   */
  if (status?.hasActiveLease) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-4">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-blue-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You Already Have a Lease
            </h2>
            <p className="text-gray-600">
              You are currently a villager with an active lease.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              You cannot create a new booking request while you have an active lease.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className='p-8 lg:p-12'>
        {/* Back to Home Button*/}
        <div className='flex justify-start'>
          <button
            onClick={() => navigate("/")}
            className="flex lg:gap-2 gap-1 items-center btn border-2 lg:py-2 lg:px-4 p-1 rounded-lg hover:translate-y-[-1px] hover:shadow-md cursor-pointer text-xs lg:text-base"
          >
            <FiChevronLeft /> Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className='title mb-4 lg:mb-6 p-2'>
            Booking Apartment
          </h1>
          <p className='text-xl lg:text-2xl mb-4 lg:mb-6'>Choose Available Room and Submit your information</p>
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>

          {/* Left Column: Unit List */}
          <div className='lg:col-span-1'>
            <div>
              <UnitList 
                selectedUnitId={selectedUnitId} 
                onSelectUnit={handleSelectUnit} 
              />
            </div>
          </div>

          {/* Right Column: Unit Detail (on large screens) */}
          {isLargeScreen && (
            <div className="lg:col-span-2">
              <UnitDetail selectedUnitId={selectedUnitId} isLoading={isUnitDetailLoading} />
            </div>
          )}
        </div>

        {/* Modal for Unit Detail (on small screens) */}
        {!isLargeScreen && (
          <UnitSelectedModal isOpen={isModalOpen} onClose={handleCloseModal}>
            <UnitDetail selectedUnitId={selectedUnitId} onClose={handleCloseModal} isLoading={isUnitDetailLoading} />
          </UnitSelectedModal>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
