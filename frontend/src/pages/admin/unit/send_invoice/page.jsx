import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUnitDetails } from '../../../../api/services/units.service';
import { getUtilityRates } from '../../../../api/services/settings.service';
import { createInvoice } from '../../../../api/services/invoices.service';
import { RiBillLine } from "react-icons/ri";
import { HiArrowLeft, HiDownload, HiUpload } from "react-icons/hi";
import SendInvoiceSkeleton from '../../../../components/skeleton/send_invoice_skeleton';


function SendInvoicePage() {
    const { id } = useParams();
    const [unit, setUnit] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [lease, setLease] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Invoice type
    const [invoiceType, setInvoiceType] = useState('MONTHLY_RENT');
    const [customAmount, setCustomAmount] = useState('');
    const [customDescription, setCustomDescription] = useState('');

    // Utility rates
    const [electricityRate, setElectricityRate] = useState(0);
    const [waterRate, setWaterRate] = useState(0);

    // Input units
    const [electricityUnits, setElectricityUnits] = useState('');
    const [waterUnits, setWaterUnits] = useState('');

    // Calculated amounts
    const [electricityAmount, setElectricityAmount] = useState(0);
    const [waterAmount, setWaterAmount] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    // Invoice details
    const [invoiceDate, setInvoiceDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');

    // Sending state
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState(null);

    // CSV import
    const csvFileInputRef = useRef(null);
    const [csvError, setCsvError] = useState(null);


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { unit: unitData, tenant: tenantData, lease: leaseData } = await getUnitDetails(id);
                console.log('Unit details fetched:', { unitData, tenantData, leaseData }); // Debug log
                setUnit(unitData);
                setTenant(tenantData);
                setLease(leaseData);

                // Fetch utility rates
                const rates = await getUtilityRates();
                console.log('Utility rates fetched:', rates); // Debug log
                setElectricityRate(rates.electricityRate);
                setWaterRate(rates.waterRate);

                // Generate invoice date (today) and due date (+7 days)
                const today = new Date();
                const due = new Date(today);
                due.setDate(due.getDate() + 7);

                setInvoiceDate(today.toISOString().split('T')[0]);
                setDueDate(due.toISOString().split('T')[0]);

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load data. Please try again.');
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Calculate amounts when units or type change
    useEffect(() => {
        if (invoiceType === 'MONTHLY_RENT') {
            const elecUnits = parseFloat(electricityUnits) || 0;
            const watUnits = parseFloat(waterUnits) || 0;

            const elecAmount = elecUnits * electricityRate;
            const watAmount = watUnits * waterRate;

            setElectricityAmount(elecAmount);
            setWaterAmount(watAmount);

            const rentAmount = unit?.rentAmount || 0;
            setTotalAmount(rentAmount + elecAmount + watAmount);
        } else if (invoiceType === 'SECURITY_DEPOSIT') {
            // Default to 1 month rent
            const depositAmount = parseFloat(customAmount) || (unit?.rentAmount || 0);
            setTotalAmount(depositAmount);
        } else {
            // For other types, use custom amount
            const amount = parseFloat(customAmount) || 0;
            setTotalAmount(amount);
        }
    }, [electricityUnits, waterUnits, electricityRate, waterRate, unit?.rentAmount, invoiceType, customAmount]);

    // Download CSV Template
    const handleDownloadTemplate = () => {
        const csvContent = [
            ['Unit Number', 'Electricity Units (kWh)', 'Water Units'],
            [`${unit?.roomNumber || 'A101'}`, '100.5', '15.0'],
            ['', '', ''],
            ['# Instructions:', '', ''],
            ['# 1. Fill in Electricity Units in kWh', '', ''],
            ['# 2. Fill in Water Units', '', ''],
            ['# 3. Save the file and import it', '', '']
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `utilities_template_${unit?.roomNumber || 'unit'}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Import CSV
    const handleImportCSV = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setCsvError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
                
                if (lines.length < 2) {
                    setCsvError('Invalid CSV format. Please use the template.');
                    return;
                }

                // Skip header, read first data row
                const dataLine = lines[1];
                const columns = dataLine.split(',').map(col => col.trim());

                if (columns.length < 3) {
                    setCsvError('Invalid CSV format. Expected 3 columns: Unit Number, Electricity Units, Water Units');
                    return;
                }

                const [unitNumber, elecUnits, watUnits] = columns;

                // Validate unit number matches
                if (unitNumber !== unit?.roomNumber) {
                    const confirm = window.confirm(
                        `Warning: CSV is for unit ${unitNumber}, but you're creating invoice for ${unit?.roomNumber}.\n\nContinue anyway?`
                    );
                    if (!confirm) return;
                }

                // Parse and set values
                const elec = parseFloat(elecUnits);
                const wat = parseFloat(watUnits);

                if (isNaN(elec) || isNaN(wat)) {
                    setCsvError('Invalid numbers in CSV. Please check Electricity and Water units.');
                    return;
                }

                if (elec < 0 || wat < 0) {
                    setCsvError('Units cannot be negative.');
                    return;
                }

                // Set the values
                setElectricityUnits(elec.toString());
                setWaterUnits(wat.toString());

                alert(`✅ CSV imported successfully!\n\nElectricity: ${elec} kWh\nWater: ${wat} units`);
            } catch (err) {
                console.error('CSV parse error:', err);
                setCsvError('Failed to parse CSV file. Please check the format.');
            }
        };

        reader.onerror = () => {
            setCsvError('Failed to read CSV file.');
        };

        reader.readAsText(file);
        
        // Reset input so same file can be imported again
        event.target.value = '';
    };

    const handleImportCSVClick = () => {
        csvFileInputRef.current?.click();
    };

    // Handle send bill
    const handleSendInvoice = async () => {
        // Validation
        if (!lease?.id) {
            setSendError('No active lease found for this unit');
            return;
        }

        // Type-specific validation
        if (invoiceType === 'MONTHLY_RENT') {
            if (!electricityUnits || parseFloat(electricityUnits) < 0) {
                setSendError('Please enter valid electricity units');
                return;
            }

            if (!waterUnits || parseFloat(waterUnits) < 0) {
                setSendError('Please enter valid water units');
                return;
            }
        } else {
            if (!customAmount || parseFloat(customAmount) <= 0) {
                setSendError('Please enter a valid amount');
                return;
            }
        }

        try {
            setSending(true);
            setSendError(null);

            const leaseId = lease.id;
            const currentMonth = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

            let invoiceData;
            
            if (invoiceType === 'MONTHLY_RENT') {
                console.log('Creating MONTHLY_RENT invoice with data:', {
                    leaseId,
                    invoiceDate,
                    dueDate,
                    rentAmount: unit.rentAmount,
                    electricityAmount,
                    waterAmount,
                    invoiceType
                });

                // Create invoice with payment line items
                invoiceData = {
                    leaseId,
                    invoiceDate,
                    dueDate,
                    rentAmount: unit.rentAmount,
                    electricityAmount,
                    waterAmount,
                    invoiceType,
                    notes: `ค่าเช่าและค่าสาธารณูปโภคประจำเดือน ${currentMonth}`
                };
            } else {
                console.log(`Creating ${invoiceType} invoice with data:`, {
                    leaseId,
                    invoiceDate,
                    dueDate,
                    amount: parseFloat(customAmount),
                    invoiceType,
                    description: customDescription
                });

                // Create custom invoice
                invoiceData = {
                    leaseId,
                    invoiceDate,
                    dueDate,
                    amount: parseFloat(customAmount),
                    invoiceType,
                    notes: customDescription || `${invoiceType.replace(/_/g, ' ')} - ${currentMonth}`
                };
            }

            const invoice = await createInvoice(invoiceData);

            console.log('✅ Invoice created successfully:', invoice);
            console.log('Invoice Number:', invoice.invoiceNumber);
            
            setInvoiceNumber(invoice.invoiceNumber);

            // Success - navigate back
            alert(`✅ Sent invoice successfully\nInvoice Number: ${invoice.invoiceNumber}`);
            navigate(`/admin/unit/${unit.id}`);
        } catch (err) {
            console.error('Failed to create invoice:', err);
            console.error('Error response:', err.response);
            
            // Extract error message from response
            let errorMessage = 'Failed to create invoice. Please try again.';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 500) {
                errorMessage = 'Server error occurred. Please check the lease is active and try again.';
            } else if (err.response?.status === 400) {
                errorMessage = 'Invalid invoice data. Please check all fields.';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setSendError(errorMessage);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <SendInvoiceSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!unit) {
        return <div>Loading...</div>;
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

            <div>
                <div className='title lg:mb-6 mb-4'>Si {unit.roomNumber}</div>
            </div>
            
            <div className='bg-white rounded-xl mb-4 p-6 shadow-md text-xl font-medium flex gap-4 items-center'>
                <div className='bg-gray-200 p-4 rounded-full'><RiBillLine /></div>
                Create Invoice
            </div>
            
            <div className='grid grid-cols-1 gap-6'>

                {/* Left Detail */}
                <div className='grid grid-cols-1 gap-6'>
                    <div className='bg-white p-6 rounded-xl shadow-md'>
                        <div className='text-lg mb-4 font-medium'>
                            Invoice Details
                        </div>

                        <div className='text-gray-500 space-y-4'>
                            <div className='flex items-center justify-between'>
                                <div>Invoice ID :</div>
                                <div className='text-black'>INV-{invoiceDate.replace(/-/g, '')}-{unit?.id}</div>
                            </div>
                            <div className='flex items-center justify-between'>
                                <div>Invoice Date :</div>
                                <div className='text-black'>{new Date(invoiceDate).toLocaleDateString('th-TH')}</div>
                            </div>
                            <div className='flex items-center justify-between'>
                                <div>Due Date :</div>
                                <div className='text-black'>{new Date(dueDate).toLocaleDateString('th-TH')}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className='bg-white p-6 rounded-xl shadow-md'>
                        <div className='text-lg mb-4 font-medium'>
                            Invoice Type
                        </div>

                        <div className='space-y-4'>
                            <div>
                                <label className='block text-sm text-gray-500 mb-2'>Select Invoice Type</label>
                                <select
                                    value={invoiceType}
                                    onChange={(e) => setInvoiceType(e.target.value)}
                                    className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400'
                                >
                                    <option value="MONTHLY_RENT">Monthly Rent + Utilities</option>
                                    <option value="SECURITY_DEPOSIT">Security Deposit</option>
                                    <option value="CLEANING_FEE">Cleaning Fee</option>
                                    <option value="MAINTENANCE_FEE">Maintenance Fee</option>
                                    <option value="CUSTOM">Custom Invoice</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className='bg-white p-6 rounded-xl shadow-md'>
                        <div className='text-lg mb-4 font-medium'>
                            Amount Details
                        </div>

                        <div className='text-gray-500 space-y-4'>
                            {invoiceType === 'MONTHLY_RENT' ? (
                                <>
                                    <div className='flex items-center justify-between'>
                                        <div>Monthly Rent :</div>
                                        <div className='text-black'>{unit?.rentAmount?.toLocaleString()} ฿</div>
                                    </div>

                                    {/* CSV Import Section */}
                                    {/* <div className='border-t pt-4 border-b pb-4'>
                                        <div className='text-sm font-medium mb-2 text-gray-700'>Quick Import from CSV</div>
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={handleDownloadTemplate}
                                                className='flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors'
                                            >
                                                <HiDownload className='w-4 h-4' />
                                                Download Template
                                            </button>
                                            <button
                                                onClick={handleImportCSVClick}
                                                className='flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors'
                                            >
                                                <HiUpload className='w-4 h-4' />
                                                Import CSV
                                            </button>
                                            <input
                                                ref={csvFileInputRef}
                                                type="file"
                                                accept=".csv"
                                                onChange={handleImportCSV}
                                                className='hidden'
                                            />
                                        </div>
                                        {csvError && (
                                            <div className='mt-2 text-sm text-red-500'>{csvError}</div>
                                        )}
                                        <div className='mt-2 text-xs text-gray-400'>
                                            💡 Import utilities data from CSV for faster entry
                                        </div>
                                    </div> */}
                                    
                                    <div className='border-t pt-4'>
                                        <label className='block text-sm mb-2'>Electricity Usage (kWh)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={electricityUnits}
                                            onChange={(e) => setElectricityUnits(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400'
                                            placeholder='Enter electricity units'
                                        />
                                        <div className='flex items-center justify-between mt-2 text-sm'>
                                            <div>Rate: {electricityRate} ฿/kWh</div>
                                            <div className='text-black font-medium'>{electricityAmount.toFixed(2)} ฿</div>
                                        </div>
                                    </div>

                                    <div className='border-t pt-4'>
                                        <label className='block text-sm mb-2'>Water Usage (Units)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={waterUnits}
                                            onChange={(e) => setWaterUnits(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400'
                                            placeholder='Enter water units'
                                        />
                                        <div className='flex items-center justify-between mt-2 text-sm'>
                                            <div>Rate: {waterRate} ฿/unit</div>
                                            <div className='text-black font-medium'>{waterAmount.toFixed(2)} ฿</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className='border-t pt-4'>
                                        <label className='block text-sm mb-2'>
                                            {invoiceType === 'SECURITY_DEPOSIT' && 'Deposit Amount (default: 1 month rent)'}
                                            {invoiceType === 'CLEANING_FEE' && 'Cleaning Fee Amount'}
                                            {invoiceType === 'MAINTENANCE_FEE' && 'Maintenance Fee Amount'}
                                            {invoiceType === 'CUSTOM' && 'Custom Amount'}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400'
                                            placeholder={invoiceType === 'SECURITY_DEPOSIT' ? unit?.rentAmount || 0 : 'Enter amount'}
                                        />
                                    </div>

                                    <div className='border-t pt-4'>
                                        <label className='block text-sm mb-2'>Description / Notes</label>
                                        <textarea
                                            value={customDescription}
                                            onChange={(e) => setCustomDescription(e.target.value)}
                                            rows={3}
                                            className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400'
                                            placeholder='Enter description or additional notes'
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                

                {/* Right Detail */}
                <div className='bg-white p-6 rounded-xl shadow-md'>
                    <div className='text-lg mb-4 font-medium'>
                        Bill to
                    </div>

                    <div className='text-gray-500 space-y-4'>
                        <div className='flex items-center justify-between'>
                            <div>Name :</div>
                            <div className='text-black'>{tenant?.firstName} {tenant?.lastName}</div>
                        </div>
                        <div className='flex items-center justify-between'>
                            <div>Email :</div>
                            <div className='text-blue-500'>{tenant?.email}</div>
                        </div>
                        <div className='flex items-center justify-between'>
                            <div>Phone :</div>
                            <div className='text-black'>{tenant?.phone}</div>
                        </div>
                    </div>
                    
                    <div className='border-b border-gray-200 my-6'></div>

                    <div className='text-gray-500'>
                        <div className='flex items-center justify-between text-lg'>
                            <div className='font-medium'>Total Amount :</div>
                            <div className='text-black font-bold text-xl'>{totalAmount.toFixed(2)} ฿</div>
                        </div>
                    </div>

                    {sendError && (
                        <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm'>
                            {sendError}
                        </div>
                    )}

                    <div className='border-b border-gray-200 my-6'></div>
                    {/* Action Button */}
                    <div className='flex lg:mt-12 mt-6 justify-end gap-4 '>
                        <button 
                            onClick={() => navigate(`/admin/unit/${unit.id}`)}
                            disabled={sending}
                            className='px-4 py-2 bg-gray-200 text-gray-600 font-medium rounded-lg shadow-md hover:translate-y-[-1px] hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSendInvoice}
                            disabled={
                                sending || 
                                (invoiceType === 'MONTHLY_RENT' && (!electricityUnits || !waterUnits)) ||
                                (invoiceType !== 'MONTHLY_RENT' && !customAmount)
                            }
                            className='px-4 py-2 bg-blue-400 text-white font-medium rounded-lg shadow-md hover:translate-y-[-1px] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {sending ? 'Sending...' : 'Send to Tenant'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SendInvoicePage;