import React from 'react'
import { PiHammer } from "react-icons/pi";
import { HiArrowLeft } from "react-icons/hi2";
import { SiFormspree } from "react-icons/si";
import { useParams, useNavigate } from "react-router-dom";

function MaintenanceRequestsDetailPage() {
  
  const navigate = useNavigate()
  const { id } = useParams()


  return (
    <div className='flex flex-col space-y-6'>
      <button
        onClick={() => navigate("/admin/maintenance-requests")}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-500"
      >
        <HiArrowLeft className="w-5 h-5" />
        Back to Requests
      </button>      

      {/* Mainteance Topic */}
      <div className='bg-white rounded-xl p-6 shadow-md'>
        <div className='flex gap-4 items-center font-medium text-gray-500 mb-4'>
          <PiHammer size={16} />
          Maintenance Topic
        </div>
        <div className='text-2xl'>
          Something Broken!
        </div>
      </div>

      {/* Maintenance Details */}
      <div className='bg-white rounded-xl p-6 shadow-md'>
        <div className='flex gap-4 items-center font-medium text-gray-500 mb-4'>
          <SiFormspree size={16} />
          Maintenance Details
        </div>

        <div className='flex flex-col space-y-6'>
          <div className='flex flex-col space-y-4'>
            {/* Tenant and Unit Information*/}
            <div className='flex lg:justify-between items-center lg:gap-6 gap-2 flex-col lg:flex-row'>
              <div className='flex flex-col w-full space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='text-gray-400'>Unit</div>
                  <div>Si 101</div>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='text-gray-400'>Name:</div>
                  <div>John Doe</div>
                </div>     
              </div>

              <div className='flex flex-col w-full space-y-2'>
                <div className='flex gap-12 items-center justify-between'>
                  <div className='text-gray-400'>Email:</div>
                  <div>john@example.com</div>
                </div>               
                <div className='flex gap-12 items-center justify-between'>
                  <div className='text-gray-400'>Phone:</div>
                  <div>111-222-3333</div>
                </div>  
              </div>
            </div>

            <div className='text-xl'>Descriptoin</div>
            <div className='border p-6 border-gray-400 rounded-xl mb-4 w-full h-[200px]'>{/* Description */}</div>
            <div className='flex justify-end'>
              <button className='bg-blue-400 px-6 py-2 rounded-lg text-white hover:bg-blue-500 transition justify-end shadow-md'>
                See Picture
              </button>
            </div>
          </div>

          <div className='border-b border-gray-400'></div>

          {/* Action Button */}
          <div className='flex justify-end gap-4'>
            <button className='bg-gray-200 px-6 py-2 rounded-lg text-gray-700 hover:bg-gray-300 transition justify-end shadow-md'>
              Cancel
            </button>
            <button className='bg-red-200 px-6 py-2 rounded-lg text-red-700 hover:bg-red-300 transition justify-end shadow-md'>
              Reject
            </button>
            <button className='bg-green-200 px-6 py-2 rounded-lg text-green-700 hover:bg-green-300 transition justify-end shadow-md'>
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MaintenanceRequestsDetailPage