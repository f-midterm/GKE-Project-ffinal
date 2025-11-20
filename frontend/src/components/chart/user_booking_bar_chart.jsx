import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getMonthlyBookings } from '../../api/services/report.service';

const UserBookingBarChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bookingData = await getMonthlyBookings(currentYear);
      setData(bookingData);
    } catch (error) {
      console.error('Error fetching booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md">
      <div className='flex justify-between items-center'>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Summary ({currentYear})</h2>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="bookings" fill="#82ca9d" name="Bookings" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default UserBookingBarChart;
