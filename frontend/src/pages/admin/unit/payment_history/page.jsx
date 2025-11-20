import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUnitDetails } from '../../../../api';
import { getPaymentsByUnitId } from '../../../../api/services/payments.service';
import { HiArrowLeft } from "react-icons/hi2";
import { MdCheckCircle, MdError, MdPending, MdAccessTime } from "react-icons/md";

function PaymentsHistoryPage() {
    const { id } = useParams();
    const [unit, setUnit] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, paid, unpaid, late
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { unit, tenant } = await getUnitDetails(id);
                setUnit(unit);
                setTenant(tenant);

                // Fetch payments for this unit
                const paymentsData = await getPaymentsByUnitId(id);
                setPayments(paymentsData || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load payment history');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const getFilteredPayments = () => {
        if (filter === 'all') return payments;
        if (filter === 'paid') return payments.filter(p => p.status === 'PAID');
        if (filter === 'unpaid') return payments.filter(p => p.status === 'PENDING');
        if (filter === 'late') {
            // Late payments are those with due date in the past and not paid
            const today = new Date();
            return payments.filter(p => {
                const dueDate = new Date(p.dueDate);
                return p.status === 'PENDING' && dueDate < today;
            });
        }
        return payments;
    };

    const getPaymentStats = () => {
        const total = payments.length;
        const paid = payments.filter(p => p.status === 'PAID').length;
        const pending = payments.filter(p => p.status === 'PENDING').length;
        const today = new Date();
        const late = payments.filter(p => {
            const dueDate = new Date(p.dueDate);
            return p.status === 'PENDING' && dueDate < today;
        }).length;

        const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const paidAmount = payments
            .filter(p => p.status === 'PAID')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const pendingAmount = payments
            .filter(p => p.status === 'PENDING')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        return { total, paid, pending, late, totalAmount, paidAmount, pendingAmount };
    };

    const getStatusIcon = (status, dueDate) => {
        if (status === 'PAID') {
            return <MdCheckCircle className="w-5 h-5 text-green-600" />;
        }
        
        const today = new Date();
        const due = new Date(dueDate);
        
        if (status === 'PENDING' && due < today) {
            return <MdError className="w-5 h-5 text-red-600" />;
        }
        
        return <MdPending className="w-5 h-5 text-yellow-600" />;
    };

    const getStatusBadge = (status, dueDate) => {
        if (status === 'PAID') {
            return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Paid</span>;
        }
        
        const today = new Date();
        const due = new Date(dueDate);
        
        if (status === 'PENDING' && due < today) {
            const daysLate = Math.floor((today - due) / (1000 * 60 * 60 * 24));
            return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Late ({daysLate} days)</span>;
        }
        
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Pending</span>;
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <button
                    onClick={() => navigate(`/admin/unit/${id}`)}
                    className="mt-4 text-blue-600 hover:text-blue-800"
                >
                    Back to Unit
                </button>
            </div>
        );
    }

    if (!unit) {
        return <div className="text-center py-8">Unit not found</div>;
    }

    const stats = getPaymentStats();
    const filteredPayments = getFilteredPayments();

    return (
        <div className='flex flex-col'>
            {/* Back Button */}
            <button
                onClick={() => navigate(`/admin/unit/${unit.id}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-500 mb-6"
            >
                <HiArrowLeft className="w-5 h-5" />
                Back to Unit
            </button>

            <div className='title lg:mb-6 mb-4'>Payment History</div>

            {/* Unit Info */}
            <div className='bg-white p-6 rounded-xl shadow-md mb-6'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                    <div>
                        <span className="text-gray-500 text-sm">Unit:</span>
                        <p className="font-semibold text-lg">Si {unit?.roomNumber}</p>
                    </div>
                    <div>
                        <span className="text-gray-500 text-sm">Tenant:</span>
                        <p className="font-semibold text-lg">
                            {tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Vacant'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Statistics */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                <div className='bg-white p-4 rounded-lg shadow-md'>
                    <div className='flex items-center gap-3'>
                        <div className='bg-blue-100 p-3 rounded-lg'>
                            <MdAccessTime className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className='text-sm text-gray-600'>Total Payments</p>
                            <p className='text-xl font-bold'>{stats.total}</p>
                            <p className='text-xs text-gray-500'>฿{stats.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-4 rounded-lg shadow-md'>
                    <div className='flex items-center gap-3'>
                        <div className='bg-green-100 p-3 rounded-lg'>
                            <MdCheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className='text-sm text-gray-600'>Paid</p>
                            <p className='text-xl font-bold text-green-600'>{stats.paid}</p>
                            <p className='text-xs text-gray-500'>฿{stats.paidAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-4 rounded-lg shadow-md'>
                    <div className='flex items-center gap-3'>
                        <div className='bg-yellow-100 p-3 rounded-lg'>
                            <MdPending className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className='text-sm text-gray-600'>Pending</p>
                            <p className='text-xl font-bold text-yellow-600'>{stats.pending}</p>
                            <p className='text-xs text-gray-500'>฿{stats.pendingAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-4 rounded-lg shadow-md'>
                    <div className='flex items-center gap-3'>
                        <div className='bg-red-100 p-3 rounded-lg'>
                            <MdError className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className='text-sm text-gray-600'>Late</p>
                            <p className='text-xl font-bold text-red-600'>{stats.late}</p>
                            <p className='text-xs text-gray-500'>Overdue</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className='bg-white p-4 rounded-lg shadow-md mb-6'>
                <div className='flex flex-wrap gap-2'>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            filter === 'all' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All ({stats.total})
                    </button>
                    <button
                        onClick={() => setFilter('paid')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            filter === 'paid' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Paid ({stats.paid})
                    </button>
                    <button
                        onClick={() => setFilter('unpaid')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            filter === 'unpaid' 
                                ? 'bg-yellow-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Unpaid ({stats.pending})
                    </button>
                    <button
                        onClick={() => setFilter('late')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            filter === 'late' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Late ({stats.late})
                    </button>
                </div>
            </div>

            {/* Payment History Table */}
            <div className='bg-white rounded-lg shadow-md overflow-hidden'>
                <div className='p-6'>
                    <h2 className='text-xl font-semibold mb-4'>Payment Records</h2>
                    
                    {filteredPayments.length === 0 ? (
                        <div className='text-center py-8 text-gray-500'>
                            <p>No payment records found</p>
                        </div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='w-full'>
                                <thead className='bg-gray-50 border-b'>
                                    <tr>
                                        <th className='px-4 py-3 text-left text-sm font-semibold text-gray-600'>Type</th>
                                        <th className='px-4 py-3 text-left text-sm font-semibold text-gray-600'>Amount</th>
                                        <th className='px-4 py-3 text-left text-sm font-semibold text-gray-600'>Due Date</th>
                                        <th className='px-4 py-3 text-left text-sm font-semibold text-gray-600'>Paid Date</th>
                                        <th className='px-4 py-3 text-left text-sm font-semibold text-gray-600'>Status</th>
                                        <th className='px-4 py-3 text-left text-sm font-semibold text-gray-600'>Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-200'>
                                    {filteredPayments.map((payment) => (
                                        <tr key={payment.id} className='hover:bg-gray-50'>
                                            <td className='px-4 py-3'>
                                                <div className='flex items-center gap-2'>
                                                    {getStatusIcon(payment.status, payment.dueDate)}
                                                    <span className='text-sm font-medium'>{payment.type || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className='px-4 py-3 text-sm font-semibold'>
                                                ฿{parseFloat(payment.amount).toLocaleString()}
                                            </td>
                                            <td className='px-4 py-3 text-sm'>
                                                {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('th-TH', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                }) : '-'}
                                            </td>
                                            <td className='px-4 py-3 text-sm'>
                                                {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('th-TH', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                }) : '-'}
                                            </td>
                                            <td className='px-4 py-3'>
                                                {getStatusBadge(payment.status, payment.dueDate)}
                                            </td>
                                            <td className='px-4 py-3 text-sm'>
                                                {payment.receiptNumber || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PaymentsHistoryPage;