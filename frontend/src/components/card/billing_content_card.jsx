import React from 'react'
import { FiChevronRight } from "react-icons/fi";
import { FaHome, FaBolt, FaTint, FaWrench, FaFileInvoice } from "react-icons/fa";

const STATUS_CONFIG = {
  PENDING: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    badge: 'Pending'
  },
  OVERDUE: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    badge: 'Overdue'
  },
  PAID: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    badge: 'Paid'
  },
  PARTIAL: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    badge: 'Partial'
  }
};

const PAYMENT_TYPE_CONFIG = {
  RENT: { icon: <FaHome className="inline" />, label: 'Rent', color: 'text-indigo-600' },
  ELECTRICITY: { icon: <FaBolt className="inline" />, label: 'Electricity', color: 'text-yellow-600' },
  WATER: { icon: <FaTint className="inline" />, label: 'Water', color: 'text-blue-600' },
  MAINTENANCE: { icon: <FaWrench className="inline" />, label: 'Maintenance', color: 'text-gray-600' },
  SECURITY_DEPOSIT: { icon: <FaFileInvoice className="inline" />, label: 'Deposit', color: 'text-purple-600' },
  OTHER: { icon: <FaFileInvoice className="inline" />, label: 'Other', color: 'text-gray-600' }
};

function BillingContentCard({ invoice, onClick }) {
  if (!invoice) return null;

  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING;
  
  // Get unique payment types from payments array
  const paymentTypes = invoice.payments 
    ? [...new Set(invoice.payments.map(p => p.paymentType))]
    : [];

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get unit number from lease
  const unitNumber = invoice.lease?.unit?.roomNumber || 'N/A';
  const tenantName = invoice.lease?.tenant 
    ? `${invoice.lease.tenant.firstName} ${invoice.lease.tenant.lastName}`
    : 'N/A';

  return (
    <div 
      onClick={onClick}
      className='flex justify-between gap-4 items-center bg-white rounded-xl p-6 shadow-md hover:translate-y-[-1px] hover:shadow-lg cursor-pointer transition-all'
    >
        <div className='flex lg:justify-between flex-col lg:flex-row w-full gap-4 lg:gap-8'>
            {/* Invoice Number */}
            <div className='flex flex-col min-w-[150px]'>
                <div className='text-xs text-gray-400 mb-1'>Invoice ID</div>
                <div className='font-medium text-gray-800'>{invoice.invoiceNumber}</div>
            </div>

            {/* Due Date */}
            <div className='flex flex-col min-w-[120px]'>
                <div className='text-xs text-gray-400 mb-1'>
                  {invoice.status === 'PAID' ? 'Paid Date' : 'Due Date'}
                </div>
                <div className='font-medium text-gray-700'>
                  {invoice.status === 'PAID' 
                    ? formatDate(invoice.payments?.find(p => p.paidDate)?.paidDate || invoice.invoiceDate)
                    : formatDate(invoice.dueDate)
                  }
                </div>
            </div>

            {/* Tenant Name */}
            <div className='flex flex-col min-w-[150px]'>
                <div className='text-xs text-gray-400 mb-1'>Tenant</div>
                <div className='font-medium text-gray-700'>{tenantName}</div>
            </div>

            {/* Unit */}
            {/* <div className='flex flex-col min-w-[80px]'>
                <div className='text-xs text-gray-400 mb-1'>Unit</div>
                <div className='font-medium text-gray-700'>{unitNumber}</div>
            </div> */}

            {/* Payment Types
            <div className='flex flex-col min-w-[180px]'>
                <div className='text-xs text-gray-400 mb-1'>Types</div>
                <div className='flex gap-2 flex-wrap'>
                  {paymentTypes.slice(0, 3).map((type, index) => {
                    const config = PAYMENT_TYPE_CONFIG[type] || PAYMENT_TYPE_CONFIG.OTHER;
                    return (
                      <span key={index} className={`text-sm ${config.color} flex items-center gap-1`}>
                        {config.icon}
                        <span className='hidden lg:inline'>{config.label}</span>
                      </span>
                    );
                  })}
                  {paymentTypes.length > 3 && (
                    <span className='text-sm text-gray-500'>+{paymentTypes.length - 3}</span>
                  )}
                </div>
            </div> */}

            {/* Amount */}
            <div className='flex flex-col min-w-[120px]'>
                <div className='text-xs text-gray-400 mb-1'>Amount</div>
                <div>
                  <div className={`text-lg font-semibold ${invoice.wasPaidLate ? 'text-orange-600' : 'text-blue-600'}`}>
                    ฿{formatCurrency(invoice.totalWithLateFee || invoice.totalAmount)}
                  </div>
                  {invoice.wasPaidLate && invoice.lateFee > 0 && (
                    <div className='text-xs text-orange-600 mt-1'>
                      +฿{formatCurrency(invoice.lateFee)} late fee
                    </div>
                  )}
                </div>
            </div>

            {/* Status Badge */}
            <div className='flex items-center min-w-[100px]'>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                  {statusConfig.badge}
                </span>
            </div>
        </div>

        <div className='text-gray-400 hover:text-gray-600'>
          <FiChevronRight size={24} />
        </div>
    </div>
  )
}

export default BillingContentCard