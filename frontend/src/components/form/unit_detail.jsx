import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnitById } from '../../api/services/units.service';
import { createAuthenticatedRentalRequest } from '../../api/services/rentalRequests.service';
import { getCurrentUser } from '../../api/services/auth.service';
import SubmissionSuccessModal from '../modal/submission_success_modal';
import UnitDetailSkeleton from '../skeleton/unit_detail_skeleton';

function UnitDetail({ selectedUnitId, onClose, isLoading }) {
  const [unit, setUnit] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaseDuration, setLeaseDuration] = useState(1);
  const [userProfile, setUserProfile] = useState(null);
  const [isSubmissionSuccessModalOpen, setIsSubmissionSuccessModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user profile when component mounts
    const fetchUserProfile = async () => {
      try {
        const userData = await getCurrentUser();
        setUserProfile(userData);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setError('Failed to load your profile. Please ensure you are logged in.');
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (selectedUnitId) {
      const fetchUnitDetails = async () => {
        setLoading(true);
        try {
          const unitData = await getUnitById(selectedUnitId);
          setUnit(unitData);
          setError(null);
        } catch (err) {
          setError('Failed to fetch unit details.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchUnitDetails();
    }
  }, [selectedUnitId]);

  if (isLoading) {
    return <UnitDetailSkeleton />;
  }

  if (!selectedUnitId) {
    return (
      <div className="flex items-center justify-center h-full p-8 border-2 border-dashed rounded-lg">
        <p className="text-lg text-gray-500">Select a unit to see the details</p>
      </div>
    );
  }

  if (loading) {
    return <UnitDetailSkeleton />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!unit) {
    return null;
  }

  const getImageForUnitType = (type) => {
    switch (type.toLowerCase()) {
      case 'standard':
        return '/standard_room.jpg';
      case 'deluxe':
        return '/delux_room.jpg';
      default:
        return '/premium_room.jpg';
    }
  };

  const leaseDurationOptions = [
    { value: 1, label: '1 months', discount: 0 },
    { value: 3, label: '3 months', discount: 0 },
    { value: 6, label: '6 Months', discount: 0 },
    { value: 12, label: '1 Year', discount: 5 },
    { value: 24, label: '2 Years', discount: 10 }
  ];

  const handleLeaseDurationChange = (e) => {
    setLeaseDuration(parseInt(e.target.value));
  };

  const calculateTotalAmount = () => {
    if (!unit) return 0;
    const selectedOption = leaseDurationOptions.find(opt => opt.value === leaseDuration);
    const discount = selectedOption ? selectedOption.discount : 0;
    const subtotal = unit.rentAmount * leaseDuration;
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userProfile) {
      setError('User profile not loaded. Please refresh the page.');
      return;
    }

    // Check if user has created their tenant profile
    if (!userProfile.firstName || !userProfile.lastName) {
      setError('Please create your profile first before booking a unit.');
      setTimeout(() => navigate('/create-profile'), 2000);
      return;
    }

    if (!unit) {
      setError('Unit information not loaded.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const rentalRequestData = {
        unitId: unit.id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        phone: userProfile.phone,
        occupation: userProfile.occupation || '',
        emergencyContact: userProfile.emergencyContact || '',
        emergencyPhone: userProfile.emergencyPhone || '',
        leaseDurationMonths: leaseDuration,
        notes: `Rental request for Unit ${unit.roomNumber} (${unit.unitType})`
      };

      console.log('Submitting authenticated rental request:', rentalRequestData);
      
      // Use new authenticated endpoint
      const response = await createAuthenticatedRentalRequest(rentalRequestData);
      console.log('Rental request created:', response);
      
      // Close modal if on mobile
      if (onClose) {
        onClose();
      }
      
      // Open success modal
      setIsSubmissionSuccessModalOpen(true);
      
    } catch (err) {
      console.error('Error submitting rental request:', err);
      
      // Handle specific error cases
      if (err.message?.includes('already have a pending request')) {
        setError('You already have a pending booking request. Please wait for approval or rejection.');
        // Redirect to waiting page after 2 seconds
        setTimeout(() => navigate('/booking/waiting'), 2000);
      } else if (err.message?.includes('already a villager')) {
        setError('You are already a villager and cannot create new booking requests.');
      } else if (err.message?.includes('must acknowledge')) {
        setError('Please acknowledge your previous rejection before creating a new request.');
        // The BookingPage will show the rejection modal
        setTimeout(() => navigate('/booking'), 2000);
      } else {
        setError(err.message || 'Failed to submit rental request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg shadow-lg">
      {/* Header with Image */}
      <div>
        <img 
          src={getImageForUnitType(unit.unitType)}
          alt={`${unit.unitType} room`}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      </div>

      {/* Content */}
      <div className='px-8 py-6'>
        <h2 className="text-2xl font-bold mb-4">Si {unit.roomNumber}</h2>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <p><span className="font-semibold">Type:</span> {unit.unitType}</p>
          <p><span className="font-semibold">Rent:</span> {unit.rentAmount}฿/month</p>
          <p><span className="font-semibold">Floor:</span> {unit.floor}</p>
          <p><span className="font-semibold">Size:</span> {unit.sizeSqm} sqm</p>
          <p><span className="font-semibold">Status:</span> {unit.status}</p>
          {unit.description && (
            <p><span className="font-semibold">Description:</span> {unit.description}</p>
          )}
          
          <form onSubmit={handleSubmit}>
            <label htmlFor="leaseDuration" className='flex items-center gap-2 mt-4'>
              <p className='font-semibold'>Lease Duration:</p>
              <select 
                id="leaseDuration"
                name='leaseDuration'
                value={leaseDuration}
                onChange={handleLeaseDurationChange}
                className='px-3 py-1 sm:py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                required
              >
                {leaseDurationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} {option.discount > 0 && `(${option.discount}% off)`}
                  </option>
                ))}
              </select>
            </label>
            
            {/* Total Amount */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Monthly Rent:</span>
                <span>{unit.rentAmount}฿</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Duration:</span>
                <span>{leaseDuration} month{leaseDuration > 1 ? 's' : ''}</span>
              </div>
              {leaseDurationOptions.find(opt => opt.value === leaseDuration)?.discount > 0 && (
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <span className="font-semibold">Discount:</span>
                  <span>{leaseDurationOptions.find(opt => opt.value === leaseDuration).discount}%</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                <span className="font-bold text-lg">Total Amount:</span>
                <span className="font-bold text-lg text-blue-600">
                  {calculateTotalAmount().toFixed(2)}฿
                </span>
              </div>
            </div>
            
            {/* Profile Incomplete Warning */}
            {userProfile && !userProfile.firstName && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 mb-1">⚠️ Profile Incomplete</p>
                <p className="text-sm text-yellow-700">
                  You need to complete your profile before booking. 
                  <button 
                    onClick={() => navigate('/create-profile')}
                    className="ml-2 text-blue-600 underline hover:text-blue-800"
                  >
                    Create Profile Now
                  </button>
                </p>
              </div>
            )}
            
            {/* Action Buttons - Moved inside form */}
            <div className="mt-6 flex justify-end space-x-4">
              <button 
                type="button"
                onClick={onClose} 
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type='submit' 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={submitting || !userProfile}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <SubmissionSuccessModal
        isOpen={isSubmissionSuccessModalOpen}
        onClose={() => setIsSubmissionSuccessModalOpen(false)}
      />
    </div>
  );
}

export default UnitDetail;