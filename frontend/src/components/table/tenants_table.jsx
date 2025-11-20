import React, { useState, useMemo } from 'react'
import { IoFilter } from "react-icons/io5";
import { BiSort } from "react-icons/bi";

function TenantsTable({ tenants = [], loading = false, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, email, unit, status
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all'); // all, ACTIVE, INACTIVE
  const [showFilters, setShowFilters] = useState(false);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format lease period
  const formatLeasePeriod = (moveInDate, leaseEndDate) => {
    if (!moveInDate || !leaseEndDate) return 'No active lease';
    return `${formatDate(moveInDate)} - ${formatDate(leaseEndDate)}`;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Filter and sort tenants
  const filteredAndSortedTenants = useMemo(() => {
    let result = [...tenants];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(tenant => {
        const fullName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
        const email = tenant.email?.toLowerCase() || '';
        const phone = tenant.phone?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || 
               email.includes(search) || 
               phone.includes(search);
      });
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(tenant => tenant.status === filterStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      let compareA, compareB;

      switch(sortBy) {
        case 'name':
          compareA = `${a.firstName} ${a.lastName}`.toLowerCase();
          compareB = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          compareA = a.email?.toLowerCase() || '';
          compareB = b.email?.toLowerCase() || '';
          break;
        case 'unit':
          compareA = a.unitId || 0;
          compareB = b.unitId || 0;
          break;
        case 'status':
          compareA = a.status || '';
          compareB = b.status || '';
          break;
        default:
          return 0;
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tenants, searchTerm, sortBy, sortOrder, filterStatus]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className='bg-white rounded-lg shadow overflow-hidden'>
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            {/* Search Box*/}
            <div className='lg:w-1/4'>
                <input 
                    type="text"
                    id='search'
                    name='search'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='lg:px-3 lg:py-2 px-2 w-full border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none'
                    placeholder='Search name, email, or phone'
                />
            </div>

            {/* Action Button */}
            <div className='flex lg:gap-4 gap-1'>
                <div 
                    onClick={() => setShowFilters(!showFilters)}
                    className='flex lg:gap-2 gap-1 items-center btn border-2 lg:py-2 lg:px-4 p-1 rounded-lg hover:translate-y-[-1px] hover:shadow-md cursor-pointer text-xs lg:text-base'
                >
                    <IoFilter />Filter
                </div>
                <div className='flex lg:gap-2 gap-1 items-center btn border-2 lg:py-2 lg:px-4 p-1 rounded-lg hover:translate-y-[-1px] hover:shadow-md cursor-pointer text-xs lg:text-base'>
                    <BiSort />Sort
                </div>
                {/* <div className='flex items-center btn bg-blue-500 lg:py-2 lg:px-4 p-1 rounded-lg text-white hover:translate-y-[-1px] hover:shadow-md cursor-pointer text-xs lg:text-base'>
                    + Tenants
                </div> */}
            </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className='px-6 py-4 bg-gray-50 border-b border-gray-200'>
            <div className='flex gap-4 items-center'>
              <label className='text-sm font-medium text-gray-700'>Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
              >
                <option value="all">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <label className='text-sm font-medium text-gray-700 ml-4'>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className='px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="unit">Unit</option>
                <option value="status">Status</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className='px-3 py-2 border rounded-lg hover:bg-gray-100'
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>
        )}
        
        {/* Table Section */}
        <div className='overflow-x-auto'>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className='bg-gray-50'>
                    <tr>
                        <th 
                          onClick={() => handleSort('name')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        >
                          Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          onClick={() => handleSort('email')}
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                        >
                          Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Phone</th>
                        <th 
                          onClick={() => handleSort('unit')}
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                        >
                          Unit {sortBy === 'unit' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Lease Period</th>
                        <th 
                          onClick={() => handleSort('status')}
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                        >
                          Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Action</th>
                    </tr>
                </thead>

                <tbody className='bg-white divide-y divide-gray-200'>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3">Loading tenants...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredAndSortedTenants.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          {searchTerm || filterStatus !== 'all' 
                            ? 'No tenants found matching your search criteria.' 
                            : 'No tenants available.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedTenants.map((tenant) => (
                        <tr key={tenant.id} className='hover:bg-gray-50'>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {tenant.firstName} {tenant.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{tenant.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{tenant.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {tenant.unitId ? `Unit ${tenant.unitId}` : 'No unit'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatLeasePeriod(tenant.moveInDate, tenant.leaseEndDate)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tenant.status)}`}>
                                {tenant.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className='flex gap-4 items-center'>
                                    {onEdit && (
                                      <button 
                                        onClick={() => onEdit(tenant)}
                                        className='text text-blue-500 hover:underline cursor-pointer'
                                      >
                                        Edit
                                      </button>
                                    )}
                                    {onDelete && (
                                      <button 
                                        onClick={() => onDelete(tenant)}
                                        className='text text-red-500 hover:underline cursor-pointer'
                                      >
                                        Delete
                                      </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                      ))
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Results Summary */}
        {!loading && filteredAndSortedTenants.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-700">
            Showing {filteredAndSortedTenants.length} of {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}
          </div>
        )}
    </div>
  )
}

export default TenantsTable