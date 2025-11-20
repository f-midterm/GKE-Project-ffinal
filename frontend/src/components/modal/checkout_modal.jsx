import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { MdWarning } from 'react-icons/md';

function CheckoutModal({ isOpen, onClose, onConfirm, lease }) {
  const [checkoutDate, setCheckoutDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !lease) return null;

  const today = new Date().toISOString().split('T')[0];
  const leaseEndDate = lease.leaseEndDate ? new Date(lease.leaseEndDate).toISOString().split('T')[0] : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!checkoutDate) {
      setError('Please select a checkout date');
      return;
    }

    // Validate checkout date is not in the past
    if (checkoutDate < today) {
      setError('Checkout date cannot be in the past');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(checkoutDate);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to process checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCheckoutDate('');
      setError('');
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Early Check Out
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Warning Message */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <MdWarning className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Important Notice</p>
              <p>You are about to terminate your lease early. The unit will become available on the selected checkout date.</p>
            </div>
          </div>

          {/* Lease Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Unit:</span>
              <span className="font-medium">Room {lease.roomNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Lease End:</span>
              <span className="font-medium">
                {leaseEndDate ? new Date(lease.leaseEndDate).toLocaleDateString('th-TH') : 'N/A'}
              </span>
            </div>
          </div>

          {/* Date Selection */}
          <div className="mb-6">
            <label htmlFor="checkoutDate" className="block text-sm font-medium text-gray-700 mb-2">
              Select Checkout Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="checkoutDate"
              name="checkoutDate"
              value={checkoutDate}
              onChange={(e) => {
                setCheckoutDate(e.target.value);
                setError('');
              }}
              min={new Date().toISOString().split('T')[0]}
              max={leaseEndDate || undefined}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Choose the date you plan to move out. The unit will be marked as available on this date.
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !checkoutDate}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Check Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckoutModal;
