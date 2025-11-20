import React, { useState, useEffect } from 'react';
import { getUnitDetails } from '../../api/services/units.service';
import { downloadLeaseAgreementPdf } from '../../api/services/leases.service';
import { PiBuilding, PiFileText } from "react-icons/pi";

function SelectedUnitDetail({ unitId, onCheckout }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId) {
      setLoading(false);
      setError("No unit ID provided.");
      return;
    }

    const fetchUnitDetails = async () => {
      setLoading(true);
      try {
        const data = await getUnitDetails(unitId);
        setDetails(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch unit details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnitDetails();
  }, [unitId]);

  const getImageForUnitType = (type) => {
    if (!type) return '/standard_room.jpg'; // Default image
    switch (type.toLowerCase()) {
      case 'standard':
        return '/standard_room.jpg';
      case 'deluxe':
        return '/delux_room.jpg';
      default:
        return '/premium_room.jpg';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  if (loading) {
    return <div>Loading unit details...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!details) {
    return <div>No unit details available.</div>;
  }

  const { unit, lease } = details;

  const handleViewLeaseAgreement = async () => {
    try {
      const pdfBlob = await downloadLeaseAgreementPdf(lease.id);
      
      // Create blob URL and open in new window
      const url = window.URL.createObjectURL(pdfBlob);
      const newWindow = window.open(url, '_blank');
      
      // If popup blocked, fallback to download
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup blocked, trigger download instead
        const link = document.createElement('a');
        link.href = url;
        const unitNumber = unit?.roomNumber || 'unknown';
        const tenantName = `${details?.lease?.tenant?.firstName || ''}${details?.lease?.tenant?.lastName || ''}`.replace(/[^a-zA-Z0-9]/g, '') || 'tenant';
        link.download = `lease_agreement_Si${unitNumber}_${tenantName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Clean up the URL object after opening
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Failed to view lease agreement:', error);
      alert('Failed to view lease agreement. Please try again.');
    }
  };

  const handleDownloadLeaseAgreement = async () => {
    try {
      const pdfBlob = await downloadLeaseAgreementPdf(lease.id);
      
      // Extract filename from Content-Disposition header if available
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate proper filename
      const unitNumber = unit?.roomNumber || 'unknown';
      const tenantName = `${details?.lease?.tenant?.firstName || ''}${details?.lease?.tenant?.lastName || ''}`.replace(/[^a-zA-Z0-9]/g, '') || 'tenant';
      link.download = `lease_agreement_Si${unitNumber}_${tenantName}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object after download
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Failed to download lease agreement:', error);
      alert('Failed to download lease agreement. Please try again.');
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl w-full h-full overflow-hidden">
      <img 
        src={getImageForUnitType(unit?.unitType)}
        alt={`${unit?.unitType} room`}
        className="w-full h-48 object-cover"
      />
      <div className="p-8 lg:mt-2 mt-2">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Apartment</h2>
        
        {/* Unit Details */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <PiBuilding size={24} className="text-gray-500 mr-3" />
            <h3 className="text-xl font-semibold text-gray-700">Unit Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-md">
            <DetailItem label="Room Number" value={`Si ${unit?.roomNumber}`} />
            <DetailItem label="Unit Type" value={unit?.unitType} />
            <DetailItem label="Floor" value={unit?.floor} />
            <DetailItem label="Size" value={unit?.sizeSqm ? `${unit.sizeSqm} sqm` : 'N/A'} />
          </div>
        </div>

        {/* Lease Details */}
        {lease ? (
          <div>
            {/* <div className="flex items-center mb-4">
              <PiFileText size={24} className="text-gray-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-700">Lease Agreement</h3>
            </div> */}
            <div className="grid grid-cols-2 gap-4 text-md mb-4">
              <DetailItem label="Lease Status" value={lease?.status} />
              <DetailItem label="Monthly Rent" value={unit?.rentAmount ? `${unit.rentAmount} ฿` : 'N/A'} />
              <DetailItem label="Start Date" value={formatDate(lease?.startDate)} />
              <DetailItem label="End Date" value={formatDate(lease?.endDate)} />
            </div>
            
            {/* Lease Agreement Section */}
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center mb-4">
                <PiFileText size={24} className="text-gray-500 mr-3" />
                <h3 className="text-xl font-semibold text-gray-700">Lease Agreement</h3>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleViewLeaseAgreement}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300"
                >
                  <PiFileText size={20} />
                  View
                </button>
                <button
                  onClick={handleDownloadLeaseAgreement}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No active lease found for this unit.</p>
          </div>
        )}
      </div>

      {/* Check out Button */}
      <div className='flex justify-end p-4'>
        <button 
          className='bg-red-500 px-8 py-3 rounded-lg font-medium hover:bg-red-600 text-white shadow-md hover:translate-y-[-1px] hover:shadow-lg'
          onClick={() => onCheckout && onCheckout({
            leaseId: lease?.id,
            roomNumber: unit?.roomNumber,
            leaseEndDate: lease?.endDate
          })}
        >
          Check Out
        </button>
      </div>
    </div>
  );
}

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
  </div>
);

export default SelectedUnitDetail;