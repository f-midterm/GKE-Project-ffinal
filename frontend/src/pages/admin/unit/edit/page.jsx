import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUnitById, updateUnit } from '../../../../api/services/units.service';
import { FiSave, FiX, FiArrowLeft } from 'react-icons/fi';

function EditUnitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: '',
    rentAmount: '',
    unitType: 'STANDARD',
    sizeSqm: '',
    status: 'AVAILABLE',
    description: ''
  });

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        setLoading(true);
        const unit = await getUnitById(id);
        
        setFormData({
          roomNumber: unit.roomNumber || '',
          floor: unit.floor || '',
          rentAmount: unit.rentAmount || '',
          unitType: unit.unitType || 'STANDARD',
          sizeSqm: unit.sizeSqm || '',
          status: unit.status || 'AVAILABLE',
          description: unit.description || ''
        });
        
      } catch (err) {
        setError(err.message || 'Failed to fetch unit details');
        console.error('Error fetching unit:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnit();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // Convert numeric fields
      const updateData = {
        ...formData,
        floor: parseInt(formData.floor),
        rentAmount: parseFloat(formData.rentAmount),
        sizeSqm: formData.sizeSqm ? parseFloat(formData.sizeSqm) : null
      };
      
      await updateUnit(id, updateData);
      
      // Navigate back to unit page
      navigate(`/admin/unit/${id}`);
      
    } catch (err) {
      setError(err.message || 'Failed to update unit');
      console.error('Error updating unit:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/unit/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !formData.roomNumber) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Unit</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm"
        >
          <FiArrowLeft size={16} />
          <span>Back to Unit Details</span>
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800">Edit Unit</h1>
        <p className="text-gray-600 text-sm mt-1">Update unit information</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Room Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., A101"
            />
          </div>

          {/* Floor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="floor"
              value={formData.floor}
              onChange={handleChange}
              onKeyPress={(e) => {
                if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              required
              min="1"
              step="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 1"
            />
          </div>

          {/* Rent Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rent Price (฿) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="rentAmount"
              value={formData.rentAmount}
              onChange={handleChange}
              onKeyPress={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 10000"
            />
          </div>

          {/* Size (Sqm) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size (Sqm)
            </label>
            <input
              type="number"
              name="sizeSqm"
              value={formData.sizeSqm}
              onChange={handleChange}
              onKeyPress={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 30.5"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Type <span className="text-red-500">*</span>
            </label>
            <select
              name="unitType"
              value={formData.unitType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="STANDARD">Standard</option>
              <option value="DELUXE">Deluxe</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RESERVED">Reserved</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional unit details..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiX size={16} />
            <span>Cancel</span>
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditUnitPage;
