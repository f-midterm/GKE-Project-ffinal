import React, { useState, useEffect, use } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUnitDetails } from '../../api';

function QuickActionCard() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [unit, setUnit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { unit } = await getUnitDetails(id);
                setUnit(unit);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error fetching data: {error.message}</div>;
    }

    if (!unit) {
        return <div>Unit not found</div>;
    }

  return (
    <div className='bg-white rounded-2xl shadow-md'>
        <div className='p-6'>
            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Action</h2>

            {/* Container */}
            <div className="flex flex-col gap-3">
                <button 
                    onClick={() => navigate(`/admin/unit/${unit.id}/lease-agreement`)}
                    className="w-full bg-white border border-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                    View Lease Agreement
                </button>
                <button 
                    onClick={() => navigate(`/admin/unit/${unit.id}/contact-tenant`)}
                    className="w-full bg-white border border-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                    Contact Tenant
                </button>
                <button 
                    onClick={() => navigate(`/admin/unit/${unit.id}/payment-history`)}
                    className="w-full bg-white border border-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                    View Payment History
                </button>
            </div>
        </div>
    </div>
  )
}

export default QuickActionCard