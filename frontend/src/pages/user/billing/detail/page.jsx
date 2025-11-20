import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHome, FaBolt, FaTint, FaWrench, FaFileInvoice, FaArrowLeft, FaDownload, FaPrint, FaCheckCircle } from 'react-icons/fa';
import { getInvoiceById, downloadReceiptPdf, viewReceiptPdf } from '../../../../api/services/invoices.service';

const PAYMENT_TYPE_CONFIG = {
  RENT: { icon: <FaHome className="inline" />, label: 'Rent', color: 'text-indigo-600' },
  ELECTRICITY: { icon: <FaBolt className="inline" />, label: 'Electricity', color: 'text-yellow-600' },
  WATER: { icon: <FaTint className="inline" />, label: 'Water', color: 'text-blue-600' },
  MAINTENANCE: { icon: <FaWrench className="inline" />, label: 'Maintenance', color: 'text-gray-600' },
  SECURITY_DEPOSIT: { icon: <FaFileInvoice className="inline" />, label: 'Security Deposit', color: 'text-purple-600' },
  OTHER: { icon: <FaFileInvoice className="inline" />, label: 'Other', color: 'text-gray-600' }
};

const PAYMENT_METHOD_LABELS = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  MOBILE_BANKING: 'Mobile Banking',
  CHECK: 'Check'
};

function InvoiceDetailPage() {
  const { id, invoiceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [daysLate, setDaysLate] = useState(0);
  const [lateFee, setLateFee] = useState(0);
  const [totalWithLateFee, setTotalWithLateFee] = useState(0);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const invoiceData = await getInvoiceById(invoiceId);
      
      // Verify invoice is paid
      if (invoiceData.status !== 'PAID') {
        navigate(`/user/${id}/billing/payment/${invoiceId}`);
        return;
      }
      
      // Calculate late fee if paid after due date
      const dueDate = new Date(invoiceData.dueDate);
      const paidDate = new Date(invoiceData.paidDate || invoiceData.updatedAt);
      dueDate.setHours(0, 0, 0, 0);
      paidDate.setHours(0, 0, 0, 0);
      
      if (paidDate > dueDate) {
        const days = Math.floor((paidDate - dueDate) / (1000 * 60 * 60 * 24));
        const fee = days * 300;
        setDaysLate(days);
        setLateFee(fee);
        setTotalWithLateFee(invoiceData.totalAmount + fee);
      } else {
        setDaysLate(0);
        setLateFee(0);
        setTotalWithLateFee(invoiceData.totalAmount);
      }
      
      setInvoice(invoiceData);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await downloadReceiptPdf(invoice.id, invoice.invoiceNumber);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintPdf = async () => {
    try {
      setDownloading(true);
      await viewReceiptPdf(invoice.id);
    } catch (err) {
      console.error('Error viewing receipt:', err);
      alert('Failed to open receipt. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get the first paid payment for paid date (they should all have the same paid date)
  const paidDate = invoice?.payments?.find(p => p.paidDate)?.paidDate;
  const paymentMethod = invoice?.payments?.find(p => p.paymentMethod)?.paymentMethod;
  const receiptNumber = invoice?.payments?.find(p => p.receiptNumber)?.receiptNumber;

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-[500px]'>
        <div className='text-xl text-gray-600'>Loading invoice details...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className='flex flex-col justify-center items-center min-h-[500px]'>
        <div className='text-xl text-red-600 mb-4'>{error || 'Invoice not found'}</div>
        <button
          onClick={() => navigate(`/user/${id}/billing`)}
          className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
        >
          Back to Billing
        </button>
      </div>
    );
  }

  return (
    <div className='mx-auto p-6'>
      {/* Back Button */}
      {/* <button
        onClick={() => navigate(`/admin/payments`)}
        className='flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 print:hidden'
      >
        <FaArrowLeft /> Back to Billing
      </button> */}

      {/* Success Badge */}
      <div className='flex justify-center mb-6'>
        <div className='bg-green-100 text-green-800 px-6 py-3 rounded-full flex items-center gap-3'>
          <FaCheckCircle className='text-2xl' />
          <span className='text-lg font-semibold'>Payment Completed</span>
        </div>
      </div>

      {/* Invoice Header */}
      <div className='bg-white rounded-xl shadow-md p-6 mb-6'>
        <div className='flex justify-between items-start mb-4'>
          <div>
            <h1 className='text-2xl font-bold text-gray-800 mb-2'>Invoice Details</h1>
            <p className='text-gray-600'>Invoice: {invoice.invoiceNumber}</p>
            {receiptNumber && (
              <p className='text-green-600 font-medium'>Receipt: {receiptNumber}</p>
            )}
          </div>
          <div className='text-right'>
            <span className='px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800'>
              Paid
            </span>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t'>
          <div>
            <p className='text-sm text-gray-500'>Invoice Date</p>
            <p className='text-gray-800 font-medium'>{formatDate(invoice.invoiceDate)}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Paid Date</p>
            <p className='text-green-600 font-medium'>{formatDate(paidDate)}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Unit</p>
            <p className='text-gray-800 font-medium'>{invoice.lease?.unit?.roomNumber || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className='grid lg:grid-cols-2 gap-6'>
        <div className='bg-white rounded-xl shadow-md p-6 mb-6'>
          <h2 className='text-xl font-bold text-gray-800 mb-4'>Payment Details</h2>
          <div className='space-y-3'>
            {invoice.payments && invoice.payments.map((payment, index) => {
              const config = PAYMENT_TYPE_CONFIG[payment.paymentType] || PAYMENT_TYPE_CONFIG.OTHER;
              return (
                <div key={index} className='flex justify-between items-center py-3 border-b last:border-b-0'>
                  <div className='flex items-center gap-3'>
                    <span className={`text-xl ${config.color}`}>{config.icon}</span>
                    <div>
                      <p className='font-medium text-gray-800'>{config.label}</p>
                      {payment.notes && <p className='text-sm text-gray-500'>{payment.notes}</p>}
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='text-gray-800 font-medium'>฿{formatCurrency(payment.amount)}</div>
                    <span className='text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full'>PAID</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className='mt-6 pt-4 border-t-2 border-gray-300'>
            {daysLate > 0 && (
              <div className='mb-4'>
                <div className='bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3'>
                  <div className='flex items-center gap-2 text-orange-700 mb-2'>
                    <span className='font-medium'>Late Payment Fee</span>
                  </div>
                  <p className='text-sm text-orange-600 mb-2'>
                    This invoice was paid <strong>{daysLate} day{daysLate > 1 ? 's' : ''}</strong> after the due date.
                  </p>
                  <div className='flex justify-between items-center text-orange-700 font-medium'>
                    <span>Late Fee ({daysLate} days × 300 ฿):</span>
                    <span>+฿{formatCurrency(lateFee)}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className='flex justify-between items-center mb-2'>
              <span className='text-lg font-medium text-gray-700'>Subtotal</span>
              <span className='text-lg font-medium text-gray-800'>฿{formatCurrency(invoice.totalAmount)}</span>
            </div>
            
            {daysLate > 0 && (
              <div className='flex justify-between items-center mb-2'>
                <span className='text-lg font-medium text-orange-600'>Late Fee</span>
                <span className='text-lg font-medium text-orange-600'>+฿{formatCurrency(lateFee)}</span>
              </div>
            )}
            
            <div className='flex justify-between items-center mb-4 pt-3 border-t border-gray-200'>
              <span className='text-xl font-bold text-gray-800'>Total Paid</span>
              <span className={`text-2xl font-bold ${daysLate > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                ฿{formatCurrency(totalWithLateFee)}
              </span>
            </div>
            
            {paymentMethod && (
              <div className='flex justify-between items-center text-gray-600'>
                <span>Payment Method:</span>
                <span className='font-medium'>{PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}</span>
              </div>
            )}
          </div>
        </div>

        {/* Property Information */}
        <div className='bg-white rounded-xl shadow-md p-6 mb-6'>
          <h2 className='text-xl font-bold text-gray-800 mb-4'>Property Information</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-gray-500'>Unit Number</p>
              <p className='text-gray-800 font-medium'>{invoice.lease?.unit?.roomNumber || 'N/A'}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Unit Type</p>
              <p className='text-gray-800 font-medium'>{invoice.lease?.unit?.unitType || 'N/A'}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Tenant Name</p>
              <p className='text-gray-800 font-medium'>
                {invoice.lease?.tenant ? `${invoice.lease.tenant.firstName} ${invoice.lease.tenant.lastName}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm text-gray-500'>Contact</p>
              <p className='text-gray-800 font-medium'>{invoice.lease?.tenant?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
        
      {/* Notes */}
      {invoice.notes && (
        <div className='border-l-4 bg-blue-50 border-blue-500 p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 mb-2'>Notes</h3>
          <p className='text-gray-700'>{invoice.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex gap-4 justify-center print:hidden'>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className='px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2'
        >
          <FaDownload /> {downloading ? 'Downloading...' : 'Download Receipt'}
        </button>
        <button
          onClick={handlePrintPdf}
          disabled={downloading}
          className='px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2'
        >
          <FaPrint /> {downloading ? 'Opening...' : 'Print PDF'}
        </button>
      </div>

      {/* Thank You Message */}
      <div className='mt-8 text-center text-gray-600'>
        <p>Thank you for your payment!</p>
        <p className='text-sm'>For any inquiries, please contact the management office.</p>
      </div>
    </div>
  );
}

export default InvoiceDetailPage;
