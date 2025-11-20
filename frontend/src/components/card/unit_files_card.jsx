import React from 'react'

function UnitFilesCard() {
  return (
    <div className='bg-white rounded-2xl shadow-md'>
        <div className='p-6'>
           {/* Title */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Unit Files</h2> 

            {/* Container */}
            <div className='h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg'>
                <p className="text-gray-500">Drag & drop files or click to upload</p>
            </div>
        </div>
    </div>
  )
}

export default UnitFilesCard