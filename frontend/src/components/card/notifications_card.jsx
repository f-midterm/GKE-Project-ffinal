import React, { useState, useEffect } from 'react'
import { FiChevronRight } from "react-icons/fi";

function NotificationsCard() {
  return (
    <div className='bg-white p-6 rounded-xl shadow-md hover:translate-y-[-1px] hover:shadow-lg cursor-pointer'>
      <div className='flex items-center gap-16'>
        
        <div className='bg-green-200 p-6 rounded-full'>{/* Icon */}</div>
        
        <div className='flex w-full lg:items-center flex-col lg:flex-row lg:justify-between'>
          <div className='text-gray-600 font-medium'>
            {/* Topic : User : New Bill Payment, Overdue Cautions, Ads  Admin : New Rental Requests, New Maintenance Requests */} 
            Topic
          </div>

          <div className='text-gray-400'>
            {/* Description */}
            Description
          </div>

          <div className='text-indigo-500'>
            {/* Type : Payment, Request, Maintenance, Others  */}
            Type
          </div>
        </div>

        <div><FiChevronRight /></div>
      </div>
    </div>
  )
}

export default NotificationsCard