import React, { useState, useEffect, use } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { getUnitDetails } from '../../../../api';
import { HiArrowLeft } from "react-icons/hi2";

function ContactTenantPage() {

    const { id } = useParams();
    const [unit, setUnit] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { unit, tenant } = await getUnitDetails(id);
                setUnit(unit);
                setTenant(tenant);  
            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, [id]);

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

            <div className='title lg:mb-6 mb-4'>Contact Tenant</div>

            {/* Tenant Details */}
            <div className='bg-white p-6 rounded-xl shadow-md mb-6'>
                <div className='text-lg mb-4 font-medium'>
                    Contact Details
                </div>

                <div className='border-b border-gray-300 mb-4'></div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    <ContactDetail label="Name" value={tenant?.firstName + " " + tenant?.lastName} />
                    <ContactDetail label="Email" value={tenant?.email} isEmail={true} />
                    <ContactDetail label="Phone" value={tenant?.phone} />
                    <ContactDetail label="Unit" value={`Si ${unit?.roomNumber}`} />
                </div>
            </div>

            <div className='bg-white p-6 rounded-xl shadow-md'>
                <div className='text-lg mb-4 font-medium'>
                    Emergency Contact Details
                </div>

                <div className='border-b border-gray-300 mb-4'></div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    <ContactDetail label="Name" value={tenant?.emergencyContact} />
                    <ContactDetail label="Phone" value={tenant?.emergencyPhone} />
                </div>
            </div>
        </div>
    )
}

function ContactDetail({ label, value, isEmail = false }) {
  return (
    <div className="flex justify-between">
      <span className="font-medium text-gray-400">{label}:</span>
      { isEmail ? (
        <a href={`mailto:${value}`} className="text-blue-600 hover:underline">{value}</a>
      ) : (
        <span className="text-gray-900">{value}</span>
      )}
    </div>
  );
}

export default ContactTenantPage