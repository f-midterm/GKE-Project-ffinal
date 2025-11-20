import React, { useState, useEffect } from 'react'
import BillChart from './bill_chart'
import { getPaymentsByUnitId } from '../../api/services/payments.service'

function WaterBillChart({ unitId }) {
    const [waterData, setWaterData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (unitId) {
            fetchWaterData();
        }
    }, [unitId]);

    const fetchWaterData = async () => {
        try {
            setLoading(true);
            setError(null);
            const payments = await getPaymentsByUnitId(unitId);
            
            // Filter water payments only
            const waterPayments = payments.filter(
                payment => payment.paymentType === 'WATER' || payment.type === 'WATER'
            );

            // Group by month and sum amounts
            const monthlyData = waterPayments.reduce((acc, payment) => {
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

            setWaterData(sortedData);
        } catch (err) {
            console.error('Failed to fetch water data:', err);
            setError('Failed to load water data');
            // Set empty data on error
            setWaterData([]);
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
                title={"Water Bill"}
                data={waterData}
                strokeColor={"#6D94C5"}
                loading={loading}
                error={error}
            />
        </div>
    )
}

export default WaterBillChart
