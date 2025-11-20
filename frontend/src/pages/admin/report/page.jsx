import React, { useState, useEffect } from 'react';
import StatCard from '../../../components/card/stat_card';
import { GrMoney } from "react-icons/gr";
import { BsGraphUp, BsGraphDown } from "react-icons/bs";
import ReportSummaryChart from '../../../components/chart/report_summary_chart';
import BookingUnitTypeDonutChart from '../../../components/chart/booking_unit_type_donut_chart';
import UserBookingBarChart from '../../../components/chart/user_booking_bar_chart';
import { getMonthlyRevenue, getMonthlyExpenses } from '../../../api/services/report.service';

function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch revenue and expense data in parallel
      const [revenueMonthly, expenseMonthly] = await Promise.all([
        getMonthlyRevenue(currentYear),
        getMonthlyExpenses(currentYear)
      ]);

      // Combine data for chart
      const combinedData = revenueMonthly.map((rev, index) => ({
        name: rev.name,
        revenue: Number(rev.revenue) || 0,
        expense: Number(expenseMonthly[index]?.expense) || 0,
        profit: Number(rev.revenue || 0) - Number(expenseMonthly[index]?.expense || 0)
      }));

      setRevenueData(combinedData);
      setExpenseData(expenseMonthly);

      // Calculate totals
      const yearlyRevenue = combinedData.reduce((sum, item) => sum + item.revenue, 0);
      const yearlyExpense = combinedData.reduce((sum, item) => sum + item.expense, 0);
      const yearlyProfit = yearlyRevenue - yearlyExpense;

      setTotalRevenue(yearlyRevenue);
      setTotalExpense(yearlyExpense);
      setTotalProfit(yearlyProfit);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col'>
      {/* Title */}
      <div className='title mb-4 lg:mb-6 py-2'>Report</div>
      
      {/* Stat Card */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 lg:mb-6'>
        <StatCard 
          icon={<BsGraphUp />} 
          title={"Total Profit"} 
          value={loading ? '-' : `฿${totalProfit.toLocaleString()}`} 
          color={"green"} 
        />
        <StatCard 
          icon={<GrMoney />} 
          title={"Total Revenue"} 
          value={loading ? '-' : `฿${totalRevenue.toLocaleString()}`} 
          color={"blue"} 
        />
        <StatCard 
          icon={<BsGraphDown />} 
          title={"Total Expense"} 
          value={loading ? '-' : `฿${totalExpense.toLocaleString()}`} 
          color={"red"} 
        />
      </div>

      {/* Chart Content */}

      {/* Report Summary Chart */}
      <div className='mb-6'>
        <ReportSummaryChart 
          title="Financial Summary" 
          data={revenueData}
          strokeColor="#1E90FF"
          loading={loading}
        />
      </div>
      
      <div className='flex gap-6'>
        {/* Booking Unit Type Donut Chart */}
        <div className='w-1/3'>
          <BookingUnitTypeDonutChart />
        </div>
        
        {/* User Booking Bar chart */}
        <div className='w-2/3'>
          <UserBookingBarChart />
        </div>
      </div>
    </div>
  );
}

export default ReportPage;