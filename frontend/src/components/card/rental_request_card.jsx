import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const getStatusBadgeColor = (status) => {
    switch (status) {
        case 'PENDING':
            return 'bg-yellow-100 text-yellow-800';
        case 'APPROVED':
            return 'bg-green-100 text-green-800';
        case 'REJECTED':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const RentalRequestCard = ({ request }) => {
    
    const navigate = useNavigate()
    const handleCardClick = (requestId) => {
        navigate(`/admin/rental-requests/${requestId}`)
    }

    return (
        <div className="bg-white shadow-md rounded-xl p-6 mb-4 hover:shadow-lg hover:-translate-y-[-2px] transition-all cursor-pointer"
            key={request.id}
            onClick={() => handleCardClick(request.id)}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">

                    <div className='flex items-center gap-3 mb-2'>

                        {/* RoomNumber */}
                        <h3 className='text-lg font-medium text-black'>
                            Si {request.unit?.roomNumber || request.unitId}
                        </h3>
                        
                        {/* Status */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(request.status)}`}>
                            {request.status}
                        </span>
                    </div>

                    <p className='text-gray-700 font-medium mb-1'>
                        {request.firstName} {request.lastName}
                    </p>

                    <p className='text-sm text-gray-500'>
                        {request.email} • {request.phone}
                    </p>

                    <p className='text-sm text-gray-500 mt-2'>
                        Requested: {formatDate(request.requestDate)}
                    </p>
                </div>

                <div className='text-right'>
                    <p className='text-sm text-gray-600'>
                        Duration: {request.leaseDurationMonths} month{request.leaseDurationMonths > 1 ? 's' : ''}
                    </p>
                    {request.unit && (
                        <p className='text-lg font-semibold text-blue-600 mt-2'>
                            {request.unit.rentAmount}฿/month
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RentalRequestCard;