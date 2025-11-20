import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getRentalRequestsByUnitType } from '../../api/services/report.service';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const BookingUnitTypeDonutChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const unitTypeData = await getRentalRequestsByUnitType();
      setData(unitTypeData);
    } catch (error) {
      console.error('Error fetching unit type data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Unit Types</h2>
      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-gray-400 text-center">
            <div>No booking data available</div>
            <div className="text-sm mt-2">Data will appear once bookings are approved</div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default BookingUnitTypeDonutChart;
