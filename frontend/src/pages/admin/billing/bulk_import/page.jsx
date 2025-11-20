import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiDownload, HiUpload, HiCheckCircle } from "react-icons/hi";
import { GrDocumentText } from "react-icons/gr";
import { createInvoice } from '../../../../api/services/invoices.service';
import { getAllUnits, getUnitDetails } from '../../../../api/services/units.service';

function BulkImportPage() {
    const navigate = useNavigate();
    const csvFileInputRef = useRef(null);
    
    const [csvData, setCsvData] = useState([]);
    const [csvError, setCsvError] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);

    // Download CSV Template
    const handleDownloadTemplate = async () => {
        try {
            setLoading(true);
            
            // Fetch all units - filter by OCCUPIED status (means has active lease)
            const units = await getAllUnits();
            const activeUnits = units.filter(unit => 
                unit.status === 'OCCUPIED'
            );

            if (activeUnits.length === 0) {
                alert('⚠️ No occupied units found!\n\nPlease ensure there are units with active tenants before generating template.');
                return;
            }

            // Calculate dates: 1st of current/next month for invoice, 8th for due date
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            
            // Format dates properly to avoid timezone issues
            const invoiceDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
            const dueDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-08`;

            // Build CSV content with actual unit data
            const csvRows = [
                ['Unit Number', 'Electricity Units (kWh)', 'Water Units', 'Invoice Date (YYYY-MM-DD)', 'Due Date (YYYY-MM-DD)']
            ];

            // Add all active units
            activeUnits.forEach(unit => {
                csvRows.push([
                    unit.roomNumber,
                    '0.00', // Default electricity units (admin will fill)
                    '0.00', // Default water units (admin will fill)
                    invoiceDate,
                    dueDate
                ]);
            });

            // Add instructions
            csvRows.push(['', '', '', '', '']);
            csvRows.push(['# Instructions:', '', '', '', '']);
            csvRows.push(['# 1. Fill in Electricity Units (kWh) for each unit', '', '', '', '']);
            csvRows.push(['# 2. Fill in Water Units for each unit', '', '', '', '']);
            csvRows.push([`# 3. Invoice Date is set to ${invoiceDate} (1st of next month)`, '', '', '', '']);
            csvRows.push([`# 4. Due Date is set to ${dueDate} (8th of next month)`, '', '', '', '']);
            csvRows.push(['# 5. You can modify dates if needed (format: YYYY-MM-DD)', '', '', '', '']);
            csvRows.push(['# 6. Save the file and import it', '', '', '', '']);
            csvRows.push(['# 7. Review data and click "Generate All Invoices"', '', '', '', '']);
            csvRows.push(['', '', '', '', '']);
            csvRows.push([`# Total active units: ${activeUnits.length}`, '', '', '', '']);

            const csvContent = csvRows.map(row => row.join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `bulk_utilities_${activeUnits.length}_units_${invoiceDate}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert(`✅ Template downloaded!\n\nActive units: ${activeUnits.length}\nInvoice Date: ${invoiceDate}\nDue Date: ${dueDate}\n\nPlease fill in electricity and water units.`);
        } catch (error) {
            console.error('Failed to generate template:', error);
            alert('❌ Failed to generate template. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Import CSV
    const handleImportCSV = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setCsvError(null);
        setCsvData([]);
        setShowResults(false);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
                
                if (lines.length < 2) {
                    setCsvError('Invalid CSV format. Please use the template.');
                    return;
                }

                // Parse CSV data
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    const columns = lines[i].split(',').map(col => col.trim());
                    
                    if (columns.length < 5) continue;
                    
                    const [unitNumber, elecUnits, watUnits, invoiceDate, dueDate] = columns;
                    
                    // Validate required fields
                    if (!unitNumber || !elecUnits || !watUnits || !invoiceDate || !dueDate) {
                        continue;
                    }

                    // Parse numbers
                    const elec = parseFloat(elecUnits);
                    const wat = parseFloat(watUnits);

                    if (isNaN(elec) || isNaN(wat)) {
                        setCsvError(`Invalid numbers in row ${i + 1}: Electricity or Water units are not valid numbers.`);
                        return;
                    }

                    if (elec < 0 || wat < 0) {
                        setCsvError(`Invalid values in row ${i + 1}: Units cannot be negative.`);
                        return;
                    }

                    // Validate dates
                    if (!isValidDate(invoiceDate) || !isValidDate(dueDate)) {
                        setCsvError(`Invalid date format in row ${i + 1}. Use YYYY-MM-DD or M/D/YYYY format.`);
                        return;
                    }

                    // Normalize dates to YYYY-MM-DD format
                    const normalizedInvoiceDate = normalizeDate(invoiceDate);
                    const normalizedDueDate = normalizeDate(dueDate);

                    data.push({
                        unitNumber,
                        electricityUnits: elec,
                        waterUnits: wat,
                        invoiceDate: normalizedInvoiceDate,
                        dueDate: normalizedDueDate,
                        status: 'pending'
                    });
                }

                if (data.length === 0) {
                    setCsvError('No valid data found in CSV. Please check the format.');
                    return;
                }

                setCsvData(data);
                alert(`✅ CSV imported successfully!\n\nTotal units to process: ${data.length}`);
            } catch (err) {
                console.error('CSV parse error:', err);
                setCsvError('Failed to parse CSV file. Please check the format.');
            }
        };

        reader.onerror = () => {
            setCsvError('Failed to read CSV file.');
        };

        reader.readAsText(file);
        
        // Reset input
        event.target.value = '';
    };

    const isValidDate = (dateString) => {
        // Support both YYYY-MM-DD and M/D/YYYY formats
        const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
        const usRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
        
        if (!isoRegex.test(dateString) && !usRegex.test(dateString)) return false;
        
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    };

    const normalizeDate = (dateString) => {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        // Convert M/D/YYYY to YYYY-MM-DD
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
            const [month, day, year] = dateString.split('/');
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        
        return dateString;
    };

    const handleImportCSVClick = () => {
        csvFileInputRef.current?.click();
    };

    // Generate all invoices
    const handleGenerateAllInvoices = async () => {
        if (csvData.length === 0) {
            alert('No data to process. Please import a CSV file first.');
            return;
        }

        if (!window.confirm(`Generate ${csvData.length} invoices?\n\nThis will create invoices for all units in the CSV.`)) {
            return;
        }

        setGenerating(true);
        setProgress({ current: 0, total: csvData.length });
        const processResults = [];

        try {
            // Fetch all units to create a map
            const units = await getAllUnits();
            const unitsMap = {};
            units.forEach(unit => {
                unitsMap[unit.roomNumber] = unit;
            });

            // Process each row
            for (let i = 0; i < csvData.length; i++) {
                const row = csvData[i];
                setProgress({ current: i + 1, total: csvData.length });

                try {
                    // Find unit
                    const unit = unitsMap[row.unitNumber];
                    if (!unit) {
                        throw new Error(`Unit ${row.unitNumber} not found`);
                    }

                    // Fetch unit details to get lease info
                    const unitDetails = await getUnitDetails(unit.id);
                    
                    if (!unitDetails.lease || unitDetails.lease.status !== 'ACTIVE') {
                        throw new Error(`No active lease found for unit ${row.unitNumber}`);
                    }

                    // Calculate amounts
                    const electricityRate = 7; // Default rate, should fetch from settings
                    const waterRate = 20; // Default rate, should fetch from settings
                    
                    const electricityAmount = row.electricityUnits * electricityRate;
                    const waterAmount = row.waterUnits * waterRate;
                    const rentAmount = unitDetails.unit.rentAmount || 0;

                    // Create invoice
                    const currentMonth = new Date(row.invoiceDate).toLocaleDateString('th-TH', { 
                        month: 'long', 
                        year: 'numeric' 
                    });

                    const invoice = await createInvoice({
                        leaseId: unitDetails.lease.id,
                        invoiceDate: row.invoiceDate,
                        dueDate: row.dueDate,
                        rentAmount: rentAmount,
                        electricityAmount: electricityAmount,
                        waterAmount: waterAmount,
                        invoiceType: 'MONTHLY_RENT',
                        notes: `ค่าเช่าและค่าสาธารณูปโภคประจำเดือน ${currentMonth}`
                    });

                    processResults.push({
                        unitNumber: row.unitNumber,
                        success: true,
                        invoiceNumber: invoice.invoiceNumber,
                        totalAmount: invoice.totalAmount
                    });

                } catch (error) {
                    console.error(`Failed to create invoice for ${row.unitNumber}:`, error);
                    processResults.push({
                        unitNumber: row.unitNumber,
                        success: false,
                        error: error.message || 'Unknown error'
                    });
                }
            }

            setResults(processResults);
            setShowResults(true);

            const successCount = processResults.filter(r => r.success).length;
            const failCount = processResults.filter(r => !r.success).length;

            alert(`✅ Processing complete!\n\nSuccess: ${successCount}\nFailed: ${failCount}`);

        } catch (error) {
            console.error('Bulk generation error:', error);
            alert('Failed to generate invoices. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return (
        <div className='flex flex-col'>
            {/* Back Button */}
            {/* <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-500 mb-6"
            >
                <HiArrowLeft className="w-5 h-5" />
                Back to Dashboard
            </button> */}

            <div className='title lg:mb-6 mb-4'>Bulk Invoice Import</div>
            
            <div className='bg-white rounded-xl mb-4 p-6 shadow-md text-xl font-medium flex gap-4 items-center'>
                <div className='bg-blue-200 p-4 rounded-full'><GrDocumentText /></div>
                Import Utilities CSV - Generate Multiple Invoices
            </div>

            {/* Instructions */}
            <div className='bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6'>
                <h3 className='font-medium text-lg mb-3'>📋 How to use:</h3>
                <ol className='list-decimal list-inside space-y-2 text-gray-700'>
                    <li>Click "Download Template" to get CSV with all active units (auto-filled)</li>
                    <li>Open the CSV file and fill in electricity and water usage for each unit</li>
                    <li>Dates are pre-set: Invoice Date (1st of next month), Due Date (8th of next month)</li>
                    <li>Save the file and click "Import CSV"</li>
                    <li>Review the imported data in the table below</li>
                    <li>Click "Generate All Invoices" to create invoices for all units at once</li>
                </ol>
                <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm'>
                    💡 <strong>Tip:</strong> Best used on 25-30th of each month. Template includes only units with active leases!
                </div>
            </div>

            {/* CSV Import Section */}
            <div className='bg-white p-6 rounded-xl shadow-md mb-6'>
                <div className='text-lg mb-4 font-medium'>CSV Import</div>
                
                <div className='flex gap-4 mb-4'>
                    <button
                        onClick={handleDownloadTemplate}
                        disabled={loading || generating}
                        className='flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {loading ? (
                            <>
                                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700'></div>
                                Loading...
                            </>
                        ) : (
                            <>
                                <HiDownload className='w-5 h-5' />
                                Download Template
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleImportCSVClick}
                        disabled={generating || loading}
                        className='flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <HiUpload className='w-5 h-5' />
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
                    <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
                        ❌ {csvError}
                    </div>
                )}
            </div>

            {/* Preview Data */}
            {csvData.length > 0 && !showResults && (
                <div className='bg-white p-6 rounded-xl shadow-md mb-6'>
                    <div className='flex justify-between items-center mb-4'>
                        <div className='text-lg font-medium'>Preview Data ({csvData.length} units)</div>
                        <button
                            onClick={handleGenerateAllInvoices}
                            disabled={generating}
                            className='flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {generating ? (
                                <>
                                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                                    Generating... ({progress.current}/{progress.total})
                                </>
                            ) : (
                                <>
                                    <HiCheckCircle className='w-5 h-5' />
                                    Generate All Invoices
                                </>
                            )}
                        </button>
                    </div>

                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead className='bg-gray-50'>
                                <tr>
                                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>Unit</th>
                                    <th className='px-4 py-3 text-right text-sm font-medium text-gray-700'>Electricity (kWh)</th>
                                    <th className='px-4 py-3 text-right text-sm font-medium text-gray-700'>Water (Units)</th>
                                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>Invoice Date</th>
                                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>Due Date</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200'>
                                {csvData.map((row, index) => (
                                    <tr key={index} className='hover:bg-gray-50'>
                                        <td className='px-4 py-3 text-sm font-medium'>{row.unitNumber}</td>
                                        <td className='px-4 py-3 text-sm text-right'>{row.electricityUnits.toFixed(2)}</td>
                                        <td className='px-4 py-3 text-sm text-right'>{row.waterUnits.toFixed(2)}</td>
                                        <td className='px-4 py-3 text-sm'>{new Date(row.invoiceDate).toLocaleDateString('th-TH')}</td>
                                        <td className='px-4 py-3 text-sm'>{new Date(row.dueDate).toLocaleDateString('th-TH')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Results */}
            {showResults && (
                <div className='bg-white p-6 rounded-xl shadow-md'>
                    <div className='mb-4'>
                        <div className='text-lg font-medium mb-2'>Generation Results</div>
                        <div className='flex gap-4 text-sm'>
                            <span className='text-green-600 font-medium'>✅ Success: {successCount}</span>
                            <span className='text-red-600 font-medium'>❌ Failed: {failCount}</span>
                        </div>
                    </div>

                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead className='bg-gray-50'>
                                <tr>
                                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>Unit</th>
                                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>Status</th>
                                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>Invoice Number</th>
                                    <th className='px-4 py-3 text-right text-sm font-medium text-gray-700'>Total Amount</th>
                                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>Error</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200'>
                                {results.map((result, index) => (
                                    <tr key={index} className={result.success ? 'hover:bg-green-50' : 'hover:bg-red-50'}>
                                        <td className='px-4 py-3 text-sm font-medium'>{result.unitNumber}</td>
                                        <td className='px-4 py-3 text-sm'>
                                            {result.success ? (
                                                <span className='text-green-600 font-medium'>✅ Success</span>
                                            ) : (
                                                <span className='text-red-600 font-medium'>❌ Failed</span>
                                            )}
                                        </td>
                                        <td className='px-4 py-3 text-sm'>{result.invoiceNumber || '-'}</td>
                                        <td className='px-4 py-3 text-sm text-right'>
                                            {result.totalAmount ? `${result.totalAmount.toLocaleString()} ฿` : '-'}
                                        </td>
                                        <td className='px-4 py-3 text-sm text-red-600'>{result.error || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className='mt-6 flex gap-4'>
                        <button
                            onClick={() => {
                                setCsvData([]);
                                setShowResults(false);
                                setResults([]);
                            }}
                            className='px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium'
                        >
                            Import Another CSV
                        </button>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className='px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium'
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BulkImportPage;
