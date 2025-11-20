import React from 'react'

function StatCard({ icon, title, value, color }) {

  const bgColor = `bg-${color}-100`;
  const textColor = `text-${color}-700`;

  return (
    <div className="flex rounded-lg shadow-md items-center lg:p-6 p-4 bg-white gap-2">
      <div className={`p-3 rounded-full ${bgColor} ${textColor} lg:text-2xl text-xl`}>{icon}</div>
      <div className='flex flex-col'>
        <p className="lg:text-lg  text-md font-medium text-gray-800">{title}</p>
        <p className="lg:text-md text-sm font-medium text-gray-500">{value}</p>
      </div>
    </div>
  )
}

export default StatCard