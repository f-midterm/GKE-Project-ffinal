import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUnitDetails, updateUnit, deleteUnit } from '../../../api/services/units.service';
import TenantsUnitTable from '../../../components/table/tenants_unit_table';
import ElectricBillChart from '../../../components/chart/electric_bill_chart';
import WaterBillChart from '../../../components/chart/water_bill_chart';
import MaintenanceLogTable from '../../../components/table/maintenance_log_table';
import QuickActionCard from '../../../components/card/quick_action_card';
import UnitFilesCard from '../../../components/card/unit_files_card';
import { FiAlertCircle } from "react-icons/fi";

import UnitPageSkeleton from '../../../components/skeleton/unit_page_skeleton';

function UnitPage() {
  const { id } = useParams();
  const [unit, setUnit] = useState(null);
  const [lease, setLease] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { unit, lease, tenant } = await getUnitDetails(id);
        setUnit(unit);
        setLease(lease);
        setTenant(tenant);

      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleEdit = () => {
    navigate(`/admin/unit/${unit.id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete unit ${unit.roomNumber}?`)) {
      return;
    }

    try {
      await deleteUnit(unit.id);
      alert('Unit deleted successfully');
      navigate('/admin');
    } catch (err) {
      alert(`Failed to delete unit: ${err.message}`);
    }
  };

  if (loading) {
    return <UnitPageSkeleton />;
  }

  if (error) {
    return <div>Error fetching data: {error.message}</div>;
  }

  if (!unit) {
    return <div>Unit not found</div>;
  }

  return (
    <div>
      {/* Room Number */}
      <div className='flex flex-row justify-between items-center sm:items-center gap-4'>
        <div>
          <div className='title lg:mb-6 mb-4'>Si {unit.roomNumber}</div>
          <div className='lg:text-xl text-lg text-gray-500'>
            Siri apartment, Floor <span>{unit.floor}</span>
          </div>
          {!lease && (
            <div className='mt-2 inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium'>
              <FiAlertCircle size={16} />
              <span>Vacant - No Tenant</span>
            </div>
          )}
        </div>
        {/* Action Button */}
        <div className='flex justify-space gap-4'>
          {lease && (
            <button 
              onClick={() => navigate(`/admin/unit/${unit.id}/send-invoice`)}
              className="bg-white text-gray-800 font-medium py-2 px-6 rounded-lg shadow-md hover:translate-y-[-1px] hover:bg-gray-50"
            >
              Send Invoice
            </button>
          )}
          <button 
            onClick={handleEdit}
            className="bg-blue-500 text-white font-medium py-2 px-6 rounded-lg shadow-md hover:translate-y-[-1px] hover:bg-blue-600"
          >
            Edit Unit
          </button>
          <button 
            onClick={handleDelete}
            className="bg-red-500 text-white font-medium py-2 px-6 rounded-lg shadow-md hover:translate-y-[-1px] hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
      
      {!lease && (
        <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6'>
          <div className='flex items-start gap-4'>
            <div className='bg-blue-100 rounded-full p-3'>
              <FiAlertCircle className='text-blue-600' size={24} />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>This unit is currently vacant</h3>
              <p className='text-gray-600 mb-4'>
                You can still edit unit information, but tenant-related features are not available until a tenant is assigned.
              </p>
              <button className='bg-blue-500 px-6 py-2 text-white font-medium rounded-lg shadow-md hover:translate-y-[-1px] hover:bg-blue-600'>
                Add Tenant
              </button>
            </div>
          </div>
        </div>
      )}

      {lease && (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6'>
          {/* Left Column */}
          <div className='lg:col-span-2 flex flex-col gap-6'>
            {/* Tenant infomation */}
            <TenantsUnitTable unit={unit} lease={lease} tenant={tenant} />

            {/* Electricity and Water bill graph */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <ElectricBillChart unitId={unit.id} />
              <WaterBillChart unitId={unit.id} />
            </div>

            {/* Maintenance Log Table */}
            <MaintenanceLogTable unitId={unit.id} />
          </div>

          {/* Right Column */}
          <div className='lg:col-span-1 flex flex-col gap-6'>
            <QuickActionCard />
            {/* <UnitFilesCard /> */}
          </div>
        </div>
      )}
    </div>
  );
}

export default UnitPage;