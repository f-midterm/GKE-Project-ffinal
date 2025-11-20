import React from 'react'
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

function MaintenanceRequestsCard() {
  return (
    <div className='bg-white rounded-xl shadow-md hover:translate-y-[-2px] hover:shadow-lg cursor-pointer p-8'>
      <div className="flex justify-between items-start">

        <div className="flex-1">
          <div className='flex items-center gap-3 mb-4'>
            {/* RoomNumber */}
            <div className='text font-medium text-black'>Si 101</div>
            {/* Status */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor("PENDING")}`}>
              PENDING
            </span>
          </div>

          {/* Tenant Name */}
          <div className='text-xl'>
            Maintenance Topic
          </div>
        </div>

        <div className='flex-1'>
          <div className='flex justify-end items-center gap-3'>
            
            <div className='space-y-2'>
              <p>John Doe</p>
              <p className='text-sm text-gray-400'>john@example.com • 123-456-7890</p>
              <p className='text-sm text-gray-400'>Request at: November 21, 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MaintenanceRequestsCard