import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUnitDetails } from '../../../../api';
import { downloadLeaseAgreementPdf } from '../../../../api/services/leases.service';
import { HiArrowLeft, HiDocumentText } from "react-icons/hi2";
import { FaFilePdf } from "react-icons/fa";

function LeaseAgreementPage() {
    const { id } = useParams();
    const [unit, setUnit] = useState(null);
    const [lease, setLease] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { unit, lease, tenant } = await getUnitDetails(id);
                setUnit(unit);
                setLease(lease);
                setTenant(tenant);
            } catch (err) {
                console.error(err);
                setError('Failed to load unit details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleDownloadPdf = async () => {
        if (!lease) {
            alert('No active lease found for this unit');
            return;
        }

        try {
            setDownloading(true);
            const pdfBlob = await downloadLeaseAgreementPdf(lease.id);
            
            // Create blob URL and trigger download (pdfBlob is already a Blob)
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `lease_agreement_Si${unit.roomNumber}_${tenant?.firstName}_${tenant?.lastName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading PDF:', err);
            alert('Failed to download lease agreement. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handleViewPdf = async () => {
        if (!lease) {
            alert('No active lease found for this unit');
            return;
        }

        try {
            setDownloading(true);
            const pdfBlob = await downloadLeaseAgreementPdf(lease.id);
            
            // Create blob URL and open in new tab (pdfBlob is already a Blob)
            const url = window.URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
            
            // Clean up after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('Error viewing PDF:', err);
            alert('Failed to view lease agreement. Please try again.');
        } finally {
            setDownloading(false);
        }
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

            <div className='title lg:mb-6 mb-4'>Lease Agreement</div>

            {/* Lease Information */}
            <div className='bg-white p-6 rounded-xl shadow-md mb-6'>
                <div className='flex items-center gap-3 mb-4'>
                    <HiDocumentText className="w-6 h-6 text-blue-600" />
                    <h2 className='text-xl font-semibold'>Lease Information</h2>
                </div>

                <div className='border-b border-gray-300 mb-4'></div>

                {!lease ? (
                    <div className='text-center py-8 text-gray-500'>
                        <p className='text-lg mb-2'>No Active Lease</p>
                        <p className='text-sm'>This unit does not have an active lease agreement.</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        <LeaseDetail label="Unit" value={`Si ${unit?.roomNumber}`} />
                        <LeaseDetail label="Tenant" value={`${tenant?.firstName || ''} ${tenant?.lastName || ''}`} />
                        <LeaseDetail label="Start Date" value={lease.startDate ? new Date(lease.startDate).toLocaleDateString('th-TH') : '-'} />
                        <LeaseDetail label="End Date" value={lease.endDate ? new Date(lease.endDate).toLocaleDateString('th-TH') : '-'} />
                        <LeaseDetail label="Monthly Rent" value={`฿${parseFloat(lease.monthlyRent).toLocaleString()}`} />
                        <LeaseDetail 
                            label="Status" 
                            value={
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    lease.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                    lease.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {lease.status}
                                </span>
                            }
                        />
                    </div>
                )}
            </div>

            {/* PDF Actions */}
            {lease && (
                <div className='bg-white p-6 rounded-xl shadow-md'>
                    <div className='text-lg mb-4 font-medium'>
                        Lease Agreement Document
                    </div>

                    <div className='border-b border-gray-300 mb-4'></div>

                    <div className='flex flex-col sm:flex-row gap-4'>
                        <button
                            onClick={handleViewPdf}
                            disabled={downloading}
                            className='flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            <FaFilePdf className="w-5 h-5" />
                            {downloading ? 'Loading...' : 'View PDF in New Tab'}
                        </button>

                        <button
                            onClick={handleDownloadPdf}
                            disabled={downloading}
                            className='flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            <FaFilePdf className="w-5 h-5" />
                            {downloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                    </div>

                    <p className='text-sm text-gray-500 mt-4'>
                        Click "View PDF in New Tab" to preview the lease agreement document in your browser, 
                        or "Download PDF" to save it to your computer.
                    </p>
                </div>
            )}
        </div>
    );
}

function LeaseDetail({ label, value }) {
    return (
        <div className="flex justify-between">
            <span className="font-medium text-gray-400">{label}:</span>
            {typeof value === 'string' ? (
                <span className="text-gray-900">{value}</span>
            ) : (
                value
            )}
        </div>
    );
}

export default LeaseAgreementPage;
