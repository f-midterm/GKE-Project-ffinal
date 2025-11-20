import React, { useState, useEffect } from 'react';
import TenantsTable from '../../../components/table/tenants_table'
import TenantsPageSkeleton from '../../../components/skeleton/tenants_page_skeleton';
import EditTenantModal from '../../../components/modal/edit_tenant_modal';
import { getAllTenants, updateTenant, deleteTenant } from '../../../api/services/tenants.service';

function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTenants();
      setTenants(data);
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setError('Failed to load tenants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (tenant) => {
    setSelectedTenant(tenant);
    setIsEditModalOpen(true);
  };

  const handleSaveTenant = async (tenantId, formData) => {
    try {
      await updateTenant(tenantId, formData);
      // Refresh the tenant list
      await fetchTenants();
      alert('Tenant updated successfully');
    } catch (err) {
      throw new Error(err.message || 'Failed to update tenant');
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedTenant(null);
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm(`Are you sure you want to delete tenant: ${tenant.firstName} ${tenant.lastName}?`)) {
      return;
    }

    try {
      await deleteTenant(tenant.id);
      alert('Tenant deleted successfully');
      // Refresh the tenant list
      fetchTenants();
    } catch (err) {
      alert(`Failed to delete tenant: ${err.message}`);
    }
  };

  if (loading) {
    return <TenantsPageSkeleton />;
  }

  return (
    <div className='flex flex-col'>
      {/* Title */}
      <div className='lg:mb-8 mb-6'>
        <h1 className='title'>
          Tenants
        </h1>
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <button 
              onClick={fetchTenants}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}
        {!error && !loading && (
          <p className="text-gray-600 mt-2">
            Total tenants: {tenants.length}
          </p>
        )}
      </div>

      {/* Tenants Table */}
      <div className=''>
        <TenantsTable 
          tenants={tenants}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Edit Tenant Modal */}
      <EditTenantModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        tenant={selectedTenant}
        onSave={handleSaveTenant}
      />
    </div>
  )
}

export default TenantsPage