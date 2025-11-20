import React from 'react'

function NotificationDetail() {
  return (
    <div>
        <div className='flex flex-col'>
            <div className='bg-white rounded-xl shadow-md p-6 mb-6'>
                <div className='text-xl font-medium mb-4 text-gray-400'>Topic</div>
                <div className='text-3xl '>New Billing Payment {/* Topic */}</div>
            </div>

            <div className='bg-white rounded-xl shadow-md p-6 mb-6'>
                <div className='text-xl font-medium mb-4 text-gray-400'>Description</div>
                <div className='border p-12 rounded-lg'></div>
            </div>
        </div>
    </div>
  )
}

export default NotificationDetail