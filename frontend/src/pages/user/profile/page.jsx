import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useBookingStatus } from '../../../hooks/useBookingStatus';
import { terminateLease } from '../../../api/services/leases.service';
import { PiBuilding } from "react-icons/pi";
import SelectedUnitDetail from '../../../components/form/selected_unit_detail';
import CheckoutModal from '../../../components/modal/checkout_modal';

import ProfilePageSkeleton from '../../../components/skeleton/profile_page_skeleton';

function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { status, loading: bookingStatusLoading, error, refetch } = useBookingStatus();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [leaseInfo, setLeaseInfo] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      if (!isAdmin && user.id.toString() !== id) {
        navigate(`/user/${user.id}`);
      }
    }
  }, [id, user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (status?.isApproved && status.leaseId) {
      setLeaseInfo({
        leaseId: status.leaseId,
        roomNumber: status.roomNumber,
        leaseEndDate: status.leaseEndDate
      });
    }
  }, [status]);

  const handleCheckoutClick = (leaseData) => {
    // If leaseData is provided from button click, use it; otherwise use state
    const leaseToUse = leaseData || leaseInfo;
    if (leaseToUse) {
      setLeaseInfo(leaseToUse);
      setShowCheckoutModal(true);
    }
  };

  const handleConfirmCheckout = async (checkoutDate) => {
    try {
      await terminateLease(leaseInfo.leaseId, checkoutDate);
      alert(`Checkout confirmed! Your lease will end on ${new Date(checkoutDate).toLocaleDateString('th-TH')}. The unit will become available on this date.`);
      setShowCheckoutModal(false);
      // Refresh booking status
      if (refetch) {
        refetch();
      } else {
        window.location.reload();
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to process checkout');
    }
  };

  if (authLoading || bookingStatusLoading) {
    return <ProfilePageSkeleton />;
  }

  const renderLeaseDetail = () => {
    if (error) {
      return <div className='text-red-500'>Error: {error}</div>;
    }

    if (status?.isApproved) {
      return <SelectedUnitDetail unitId={status.unitId} onCheckout={handleCheckoutClick} />;
    }

    if (status?.isPending) {
      return (
        <div className='flex lg:flex-1 border border-gray-400 rounded-2xl justify-center items-center h-full'>
          <div className='text-center lg:py-0 py-32 px-24'>
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
                <PiBuilding size={32} className='text-yellow-500' />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700">
              Your application is waiting for approval.
            </h2>
          </div>
        </div>
      );
    }

    return (
      <div className='flex lg:flex-1 border border-gray-400 rounded-2xl justify-center items-center h-full'>
        <div className='text-center lg:py-0 py-32 px-24'>
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center"><PiBuilding size={32} className='text-gray-500' /></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            You haven't any application
          </h2>
          <div onClick={() => navigate('/booking')} className='py-4 rounded-full bg-blue-400 text-white font-medium hover:bg-blue-500 cursor-pointer shadow-md hover:translate-y-[-1px] transition-all duration-300'>
            Book now
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='flex flex-col space-y-8'>
      <div className='flex flex-col lg:flex-row lg:gap-20'>
        {/* Profile */}
        <div className='lg:w-1/3 w-full bg-white p-6 shadow-md rounded-3xl'>
          {/* Profile Picture */}
          <div className="w-80 h-80 bg-gray-200 rounded-3xl mx-auto mb-4"></div>

          {/* Profile Detail */}
          <div className='lg:mb-12 mb-6'>
            <span className='text-md text-gray-400'>Profile</span><div className="border-t border-gray-300 pt-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{user?.username}</h2>
            <div className="space-y-2">
              <ProfileDetail label="Fullname" value={user?.firstName + " " + user?.lastName || 'N/A'} />
              <ProfileDetail label="Email" value={user?.email || 'N/A'} isEmail={true} />
              <ProfileDetail label="Phone" value={user?.phone || 'N/A'} />
              <ProfileDetail label="Emergency Contact" value={user?.emergencyContact || 'N/A'} />
              <ProfileDetail label="Emergency Phone" value={user?.emergencyPhone || 'N/A'} />
            </div>
          </div>

          <button className='w-full bg-gray-800 text-white py-4 rounded-xl shadow-md hover:translate-y-[-1px] hover:shadow-lg hover:bg-gray-700'>
            Edit Profile
          </button>
          
        </div>

        {/* Lease Detail */}
        <div className='lg:flex-1 flex justify-center items-center'>
          {renderLeaseDetail()}
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onConfirm={handleConfirmCheckout}
        lease={leaseInfo}
      />
        
    </div>
  )
}

function ProfileDetail({ label, value, isEmail = false }) {
  return (
    <div className="flex justify-between text-md mb-2">
      <span className="font-medium text-gray-600">{label}:</span>
      { isEmail ? (
        <a href={`mailto:${value}`} className="text-blue-600 hover:underline">{value}</a>
      ) : (
        <span className="text-gray-900">{value}</span>
      )}
    </div>
  );
}

export default ProfilePage;
