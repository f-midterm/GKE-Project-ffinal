import React, { useState, useEffect } from 'react';
import PaymentsTable from '../../../components/table/payments_table'
import StatCard from '../../../components/card/stat_card'
import { MdAttachMoney, MdOutlinePending, MdOutlineTrendingUp } from "react-icons/md";
import { IoBanOutline } from "react-icons/io5";
import { FaExclamationTriangle } from "react-icons/fa";
import { Link } from 'react-router-dom'
import PaymentsPageSkeleton from '../../../components/skeleton/payments_page_skeleton';
import { getPaidInvoices } from '../../../api/services/invoices.service';

function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPaid: 0,
    paidWithLateFee: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getPaidInvoices();
      
      // Calculate stats
      let totalRevenue = 0;
      let paidWithLateFeeCount = 0;
      
      data.forEach(invoice => {
        const dueDate = new Date(invoice.dueDate);
        const paidDate = new Date(invoice.paidDate || invoice.updatedAt);
        dueDate.setHours(0, 0, 0, 0);
        paidDate.setHours(0, 0, 0, 0);
        
        let amount = invoice.totalAmount;
        
        if (paidDate > dueDate) {
          const daysLate = Math.floor((paidDate - dueDate) / (1000 * 60 * 60 * 24));
          const lateFee = daysLate * 300;
          amount += lateFee;
          paidWithLateFeeCount++;
        }
        
        totalRevenue += amount;
      });
      
      setStats({
        totalPaid: data.length,
        paidWithLateFee: paidWithLateFeeCount,
        totalRevenue: totalRevenue
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <PaymentsPageSkeleton />;
  }

  return (
    <div className='flex flex-col'>
        {/* Header */}
        <div className='flex w-full items-center lg:mb-8 mb-6 justify-between'>
            {/* Title */}
            <div>
                <h1 className='title'>
                    Payments
                </h1>
            </div>

            {/* Generate Bill for pend to users */}
            <Link to="" className='btn bg-gray-200 shadow-md text-gray-700 lg:px-6 px-4 py-2 rounded-lg lg:text-lg text-sm hover:translate-y-[-1px] hover:shadow-lg hover:bg-gray-300 transition-all duration-300 cursor-pointer'>
                Download All Bill
            </Link>
        </div>

        {/* Stat Card */}
        <div className='grid lg:grid-cols-3 grid-cols-1 lg:mb-6 mb-4 gap-4'>
            <StatCard icon={<MdAttachMoney />} title={"Total Revenue"} value={`฿${formatCurrency(stats.totalRevenue)}`} color={"green"} />
            <StatCard icon={<MdOutlineTrendingUp />} title={"Paid Invoices"} value={stats.totalPaid} color={"blue"} />
            <StatCard icon={<FaExclamationTriangle />} title={"Paid with Late Fee"} value={stats.paidWithLateFee} color={"orange"} />
        </div>

        {/* Payment Table */}
        <div className=''>
            <PaymentsTable />
        </div>
    </div>
  )
}

export default PaymentsPage