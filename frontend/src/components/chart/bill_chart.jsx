import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function BillChart({ title, data, strokeColor, loading, error }) {
  return (
    <div className='bg-white rounded-2xl shadow-md'>
      <div className='p-6'>
        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        <div style={{ width: '100%', height: 250 }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading chart data...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500 text-center">
                <div>{error}</div>
                <div className="text-sm text-gray-500 mt-2">Please try refreshing the page</div>
              </div>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-center">
                <div>No data available</div>
                <div className="text-sm mt-2">Data will appear once payments are recorded</div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer>
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 20,
                  left: -20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  padding={{ left: 10, right: 10 }} 
                />
                <YAxis 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e0e0e0'
                  }}
                  labelStyle={{ color: '#333', fontWeight: 'bold' }}
                  itemStyle={{ color: strokeColor }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={strokeColor || "#8884d8"} 
                  strokeWidth={2}
                  dot={{ r: 4, fill: strokeColor }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default BillChart