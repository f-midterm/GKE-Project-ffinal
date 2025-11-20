import React, { useState, useEffect } from 'react'
import BillChart from './bill_chart'
import { getPaymentsByUnitId } from '../../api/services/payments.service'

function ElectricBillChart({ unitId }) {
    const [electricityData, setElectricityData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (unitId) {
            fetchElectricityData();
        }
    }, [unitId]);

    const fetchElectricityData = async () => {
        try {
            setLoading(true);
            setError(null);
            const payments = await getPaymentsByUnitId(unitId);
            
            // Filter electricity payments only
            const electricityPayments = payments.filter(
                payment => payment.paymentType === 'ELECTRICITY' || payment.type === 'ELECTRICITY'
            );

            // Group by month and sum amounts
            const monthlyData = electricityPayments.reduce((acc, payment) => {
                const date = new Date(payment.dueDate);
                const monthKey = date.toLocaleString('en-US', { month: 'short' });
                const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!acc[yearMonth]) {
                    acc[yearMonth] = {
                        name: monthKey,
                        value: 0,
                        date: date,
                        yearMonth: yearMonth
                    };
                }
                acc[yearMonth].value += parseFloat(payment.amount || 0);
                return acc;
            }, {});

            // Convert to array, sort by date, and take last 6 months
            const sortedData = Object.values(monthlyData)
                .sort((a, b) => a.date - b.date)
                .slice(-6)
                .map(({ name, value }) => ({ name, value: Math.round(value * 100) / 100 }));

            setElectricityData(sortedData);
        } catch (err) {
            console.error('Failed to fetch electricity data:', err);
            setError('Failed to load electricity data');
            // Set empty data on error
            setElectricityData([]);
        } finally {
            setLoading(false);
        }
    };

    if (!unitId) {
        return null;
    }

    return (
        <div>
            <BillChart 
                title={"Electricity Bill"}
                data={electricityData}
                strokeColor={"#F08787"}
                loading={loading}
                error={error}
            />
        </div>
    )
}

export default ElectricBillChart