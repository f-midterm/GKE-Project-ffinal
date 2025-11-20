import React, { useState, useEffect } from 'react';
import { getUtilityRates } from '../../api/services/settings.service';

function TenantsUnitTable({ unit, lease, tenant }) {
    const [utilityRates, setUtilityRates] = useState({
        electricityRate: null,
        waterRate: null
    });
    const [loadingRates, setLoadingRates] = useState(true);
    const [ratesError, setRatesError] = useState(false);

    const isVacant = unit && unit.status === 'AVAILABLE';

    useEffect(() => {
        fetchUtilityRates();
    }, []);

    const fetchUtilityRates = async () => {
        try {
            setLoadingRates(true);
            setRatesError(false);
            const rates = await getUtilityRates();
            setUtilityRates({
                electricityRate: rates.electricityRate,
                waterRate: rates.waterRate
            });
        } catch (error) {
            console.error('Failed to fetch utility rates:', error);
            setRatesError(true);
        } finally {
            setLoadingRates(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getUtilityRateDisplay = (rate, unit) => {
        if (loadingRates) return 'Loading...';
        if (ratesError) {
            return (
                <span className="text-red-500 text-sm">
                    Error loading rate
                    <button 
                        onClick={fetchUtilityRates}
                        className="ml-2 text-blue-500 underline hover:no-underline"
                    >
                        Retry
                    </button>
                </span>
            );
        }
        if (rate === null || rate === undefined) return 'N/A';
        return `${rate} ${unit}`;
    };

    const infoItems = !isVacant && tenant && lease ? [
        { label: 'Current tenant', value: `${tenant.firstName} ${tenant.lastName}` },
        { label: 'Lease Dates', value: `${formatDate(lease.startDate)} - ${formatDate(lease.endDate)}` },
        { label: 'Monthly Rent', value: `${unit.rentAmount} ฿/month` },
        { 
            label: 'Electricity Price/Unit', 
            value: getUtilityRateDisplay(utilityRates.electricityRate, '฿/kWh')
        },
        { 
            label: 'Water Price/Unit', 
            value: getUtilityRateDisplay(utilityRates.waterRate, '฿/unit')
        },
    ] : [];

    return (
        <div className='bg-white shadow-md rounded-lg'>
            <div className='p-6'>
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Tenant Information</h2>
                    <div className="divide-y divide-gray-200">
                        {infoItems.length > 0 ? (
                            infoItems.map((item, index) => (
                                <div key={index} className='flex justify-between items-center py-4'>
                                    <span className="text-gray-600">{item.label}</span>
                                    <div className="flex items-center gap-3">
                                        {typeof item.value === 'string' ? (
                                            <span className="text-gray-900 font-medium">{item.value}</span>
                                        ) : (
                                            item.value
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-4 text-center text-gray-500">
                                {isVacant ? 'Unit is vacant' : 'No tenant information available'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TenantsUnitTable