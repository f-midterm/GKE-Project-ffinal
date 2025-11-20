import React, { useState, useEffect } from 'react';
import { IoFilter } from "react-icons/io5";
import { BiSort } from "react-icons/bi";
import { FaExclamationTriangle, FaEye, FaTrash, FaImage } from 'react-icons/fa';
import { getPaidInvoices, deleteInvoice } from '../../api/services/invoices.service';
import { getBackendResourceUrl } from '../../api/client/apiClient';
import { useNavigate } from 'react-router-dom';

function PaymentsTable() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPaidInvoices();
  }, []);

  const fetchPaidInvoices = async () => {
    try {
      setLoading(true);
      const data = await getPaidInvoices();
      
      // Debug: Check if slipUrl exists
      console.log('Paid invoices data:', data);
      console.log('First invoice slipUrl:', data[0]?.slipUrl);
      
      // Calculate late fees for paid invoices
      const invoicesWithLateFees = data.map(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate);
        const dueDate = new Date(invoice.dueDate);
        const paidDate = new Date(invoice.paidDate || invoice.updatedAt);
        
        invoiceDate.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        paidDate.setHours(0, 0, 0, 0);
        
        if (paidDate > dueDate) {
          const daysLate = Math.floor((paidDate - dueDate) / (1000 * 60 * 60 * 24));
          const lateFee = daysLate * 300;
          return {
            ...invoice,
            daysLate,
            lateFee,
            totalWithLateFee: invoice.totalAmount + lateFee,
            wasOverdue: true
          };
        }
        
        return {
          ...invoice,
          daysLate: 0,
          lateFee: 0,
          totalWithLateFee: invoice.totalAmount,
          wasOverdue: false
        };
      });
      
      setInvoices(invoicesWithLateFees);
    } catch (error) {
      console.error('Failed to fetch paid invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
      invoice.lease?.unit?.roomNumber?.toLowerCase().includes(searchLower) ||
      `${invoice.lease?.tenant?.firstName} ${invoice.lease?.tenant?.lastName}`.toLowerCase().includes(searchLower)
    );
  });

  const handleViewSlip = (invoice) => {
    setSelectedSlip(invoice);
    setShowSlipModal(true);
    setImageLoading(true);
    setImageError(false);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteInvoice(invoiceId);
      alert('Invoice deleted successfully');
      fetchPaidInvoices(); // Refresh list
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };

  return (
    <div className='bg-white rounded-lg shadow overflow-hidden'>
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        {/* Search Box*/}
          <div className='lg:w-1/4'>
            <input 
              type="text"
              id='search'
              name='search'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='lg:px-3 lg:py-2 px-2 w-full border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none'
              placeholder='Search invoices...'
            />
          </div>

        {/* Action Button */}
          <div className='flex lg:gap-4 gap-1'>
            <div className='flex lg:gap-2 gap-1 items-center btn border-2 lg:py-2 lg:px-4 p-1 rounded-lg hover:translate-y-[-1px] hover:shadow-md cursor-pointer text-xs lg:text-base'>
              <IoFilter />Filter
            </div>
            <div className='flex lg:gap-2 gap-1 items-center btn border-2 lg:py-2 lg:px-4 p-1 rounded-lg hover:translate-y-[-1px] hover:shadow-md cursor-pointer text-xs lg:text-base'>
              <BiSort />Sort
            </div>
          </div>
      </div>

      {/* Table Section */}
      <div className='overflow-x-auto'>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className='bg-gray-50'>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>

          <tbody className='bg-white divide-y divide-gray-200'>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  Loading payments...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? 'No payments found matching your search' : 'No paid invoices yet'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className={`hover:bg-gray-50 ${invoice.wasOverdue ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className='flex items-center gap-2'>
                      {invoice.wasOverdue && (
                        <FaExclamationTriangle className='text-orange-500' title='Paid with late fee' />
                      )}
                      <span className='font-medium text-gray-900'>{invoice.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.lease?.unit?.roomNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.lease?.tenant ? 
                      `${invoice.lease.tenant.firstName} ${invoice.lease.tenant.lastName}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(invoice.paidDate || invoice.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className={`font-semibold ${invoice.wasOverdue ? 'text-orange-600' : 'text-green-600'}`}>
                        ฿{formatCurrency(invoice.totalWithLateFee)}
                      </p>
                      {invoice.wasOverdue && (
                        <p className='text-xs text-orange-600 mt-1'>
                          +฿{formatCurrency(invoice.lateFee)} late fee ({invoice.daysLate} day{invoice.daysLate > 1 ? 's' : ''})
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className='px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className='flex items-center gap-3'>
                      {invoice.slipUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSlip(invoice);
                          }}
                          className='flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm'
                          title='View payment slip'
                        >
                          <FaImage /> Slip
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to user's invoice detail page
                          const tenantId = invoice.lease?.tenant?.id || invoice.lease?.user?.id;
                          if (tenantId) {
                            navigate(`/user/${tenantId}/billing/detail/${invoice.id}`);
                          } else {
                            alert('Cannot find tenant information');
                          }
                        }}
                        className='flex items-center gap-1 text-green-600 hover:text-green-800 font-medium text-sm'
                        title='View invoice details'
                      >
                        <FaEye /> View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInvoice(invoice.id);
                        }}
                        className='flex items-center gap-1 text-red-600 hover:text-red-800 font-medium text-sm'
                        title='Delete invoice'
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slip Modal */}
      {showSlipModal && selectedSlip && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' onClick={() => setShowSlipModal(false)}>
          <div className='bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto' onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className='sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center'>
              <div>
                <h3 className='text-xl font-bold text-gray-800'>Payment Slip</h3>
                <p className='text-sm text-gray-600'>Invoice: {selectedSlip.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setShowSlipModal(false)}
                className='text-gray-400 hover:text-gray-600 text-2xl font-bold'
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className='p-6'>
              <div className='bg-gray-50 p-4 rounded-lg mb-4'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-600'>Unit:</span>
                    <span className='font-semibold ml-2'>{selectedSlip.lease?.unit?.roomNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Amount:</span>
                    <span className='font-semibold ml-2 text-green-600'>
                      ฿{formatCurrency(selectedSlip.totalWithLateFee)}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Tenant:</span>
                    <span className='font-semibold ml-2'>
                      {selectedSlip.lease?.tenant ? 
                        `${selectedSlip.lease.tenant.firstName} ${selectedSlip.lease.tenant.lastName}` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Paid Date:</span>
                    <span className='font-semibold ml-2'>{formatDate(selectedSlip.paidDate || selectedSlip.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {selectedSlip.slipUrl ? (
                <div className='flex justify-center'>
                  {imageLoading && (
                    <div className='text-center py-12'>
                      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
                      <p className='text-gray-500'>Loading image...</p>
                    </div>
                  )}
                  {imageError && (
                    <div className='text-center py-12 text-red-500'>
                      <FaImage className='mx-auto text-6xl mb-4 text-red-300' />
                      <p>Failed to load payment slip</p>
                      <p className='text-sm mt-2'>Path: {selectedSlip.slipUrl}</p>
                    </div>
                  )}
                  <img 
                    src={getBackendResourceUrl(selectedSlip.slipUrl)}
                    alt="Payment Slip"
                    onLoad={() => setImageLoading(false)}
                    onError={(e) => {
                      console.error('Image load error:', e);
                      console.log('Slip URL:', selectedSlip.slipUrl);
                      console.log('Full URL:', getBackendResourceUrl(selectedSlip.slipUrl));
                      setImageLoading(false);
                      setImageError(true);
                    }}
                    className={`max-w-full rounded-lg shadow-lg ${imageLoading || imageError ? 'hidden' : ''}`}
                  />
                </div>
              ) : (
                <div className='text-center py-12 text-gray-500'>
                  <FaImage className='mx-auto text-6xl mb-4 text-gray-300' />
                  <p>No payment slip available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentsTable