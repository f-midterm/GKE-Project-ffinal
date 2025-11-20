import React, { useState, useEffect } from 'react';
import StatCard from '../../../components/card/stat_card';
import { MdPendingActions, MdDelete, MdAdd, MdClose } from "react-icons/md";
import { PiHammer } from "react-icons/pi";
import { GrDocumentText } from "react-icons/gr";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { Link } from 'react-router-dom';
import UnitCard from '../../../components/card/unit_card';
import { getAllUnits, createUnit, deleteUnit } from '../../../api/services/units.service';
import { getAllRentalRequests } from '../../../api/services/rentalRequests.service';
import { getAllMaintenanceRequests } from '../../../api/services/maintenance.service';
import { getWaitingVerificationInvoices } from '../../../api/services/invoices.service';
import AdminDashboardSkeleton from '../../../components/skeleton/admin_dashboard_skeleton';

function AdminDashboard() {
  const [unitsByFloor, setUnitsByFloor] = useState({});
  const [rentalRequestsCount, setRentalRequestsCount] = useState(0);
  const [maintenanceRequestsCount, setMaintenanceRequestsCount] = useState(0);
  const [paymentRequestsCount, setPaymentRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [newFloorData, setNewFloorData] = useState({
    floorNumber: '',
    rooms: [{ roomNumber: '', type: 'Standard', size: '', rentAmount: '' }]
  });
  const [newRoomData, setNewRoomData] = useState({
    floor: '',
    roomNumber: '',
    type: 'Standard',
    size: '',
    rentAmount: ''
  });

  const fetchData = async () => {
    try {
      const [units, rentalRequests, maintenanceRequests, waitingVerificationInvoices] = await Promise.all([
        getAllUnits(),
        getAllRentalRequests(),
        getAllMaintenanceRequests(),
        getWaitingVerificationInvoices()
      ]);

      const groupedUnits = units.reduce((acc, unit) => {
        const { floor } = unit;
        if (!acc[floor]) {
          acc[floor] = [];
        }
        acc[floor].push(unit);
        return acc;
      }, {});
      setUnitsByFloor(groupedUnits);
      
      // Count only pending rental requests (not approved yet)
      const pendingRentals = rentalRequests.filter(req => 
        req.status !== 'APPROVED' && req.status !== 'REJECTED'
      );
      setRentalRequestsCount(pendingRentals.length);
      
      // Count maintenance requests that need action (SUBMITTED or PENDING_TENANT_CONFIRMATION)
      const pendingMaintenance = maintenanceRequests.filter(req => 
        req.status === 'SUBMITTED' || req.status === 'PENDING_TENANT_CONFIRMATION'
      );
      setMaintenanceRequestsCount(pendingMaintenance.length);
      
      // Payment requests already filtered (waiting verification)
      setPaymentRequestsCount(waitingVerificationInvoices.length);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddFloor = async () => {
    if (!newFloorData.floorNumber || newFloorData.rooms.length === 0) {
      alert('Please fill floor number and at least one room');
      return;
    }

    // Validate all rooms
    const invalidRoom = newFloorData.rooms.find(room => 
      !room.roomNumber || !room.size || !room.rentAmount
    );
    if (invalidRoom) {
      alert('Please fill all room details');
      return;
    }

    try {
      // Create all rooms in the new floor
      for (const room of newFloorData.rooms) {
        await createUnit({
          roomNumber: room.roomNumber,
          floor: parseInt(newFloorData.floorNumber),
          unitType: room.type,  // Changed from 'type' to 'unitType'
          sizeSqm: parseFloat(room.size),
          rentAmount: parseFloat(room.rentAmount),
          status: 'AVAILABLE'
        });
      }
      
      alert(`Floor ${newFloorData.floorNumber} created successfully with ${newFloorData.rooms.length} rooms`);
      setShowAddFloorModal(false);
      setNewFloorData({
        floorNumber: '',
        rooms: [{ roomNumber: '', type: 'Standard', size: '', rentAmount: '' }]
      });
      fetchData();
    } catch (error) {
      console.error('Error creating floor:', error);
      alert('Failed to create floor');
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomData.floor || !newRoomData.roomNumber || !newRoomData.size || !newRoomData.rentAmount) {
      alert('Please fill all room details');
      return;
    }

    try {
      await createUnit({
        roomNumber: newRoomData.roomNumber,
        floor: parseInt(newRoomData.floor),
        unitType: newRoomData.type,  // Changed from 'type' to 'unitType'
        sizeSqm: parseFloat(newRoomData.size),
        rentAmount: parseFloat(newRoomData.rentAmount),
        status: 'AVAILABLE'
      });
      
      alert('Room created successfully');
      setShowAddRoomModal(false);
      setNewRoomData({
        floor: '',
        roomNumber: '',
        type: 'Standard',
        size: '',
        rentAmount: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room');
    }
  };

  const handleDeleteUnit = async () => {
    if (!selectedUnit) return;

    try {
      await deleteUnit(selectedUnit.id);
      alert('Room deleted successfully');
      setShowDeleteModal(false);
      setSelectedUnit(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room');
    }
  };

  const addRoomToFloor = () => {
    setNewFloorData(prev => ({
      ...prev,
      rooms: [...prev.rooms, { roomNumber: '', type: 'Standard', size: '', rentAmount: '' }]
    }));
  };

  const removeRoomFromFloor = (index) => {
    if (newFloorData.rooms.length === 1) {
      alert('Floor must have at least one room');
      return;
    }
    setNewFloorData(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index)
    }));
  };

  const updateFloorRoom = (index, field, value) => {
    setNewFloorData(prev => ({
      ...prev,
      rooms: prev.rooms.map((room, i) => 
        i === index ? { ...room, [field]: value } : room
      )
    }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className='flex flex-col'>
      {/* Title */}
      <div className='lg:mb-12 mb-8'>
        <h1 className='title mb-4 lg:mb-6'>
          Dashboard
        </h1>
        <p className='text-xl lg:text-2xl mb-4 lg:mb-6'>Welcome, Test</p>
        <p className='text-lg lg:text-xl text-gray-600'>Apartment : Siri Apartment, Floor : 2, Rooms : 24</p>
      </div>
        
      {/* Unit Section */}
        
      {/* Stat Card */}
      <div className='grid gap-6 grid-cols-1 lg:grid-cols-4 justify-center items-center mb-8'>
        {/* Rental Requests */}
        <Link to="/admin/rental-requests" className='hover:translate-y-[-1px] hover:shadow-lg'>
          <StatCard icon={<MdPendingActions />} title={"Rental Requests"} value={`${rentalRequestsCount} Requests`} color={"green"} />
        </Link>

        {/* Maintenance Requests */}
        <Link to="maintenance-requests" className='hover:translate-y-[-1px] hover:shadow-lg'>
          <StatCard icon={<PiHammer />} title={"Maintenane Requests"} value={`${maintenanceRequestsCount} Requests`} color={"yellow"} />
        </Link>
          
        {/*  */}
        <Link to="/admin/payment-requests" className='hover:translate-y-[-1px] hover:shadow-lg'>
          <StatCard icon={<GrDocumentText />} title={"Payment Requests"} value={`${paymentRequestsCount} Waiting`} color={"red"} />
        </Link>

        <Link to="/admin/billing/bulk-import" className='hover:translate-y-[-1px] hover:shadow-lg'>
          <StatCard icon={<GrDocumentText />} title={"Quick Import from CSV"} value={`25 - 30 Every month`} color={"blue"} />
        </Link>

       </div>


      <div className="border-b border-gray-400 mb-6"></div>
      
      <div className='flex justify-between mb-6'>
        <div className='text-xl font-medium flex gap-2 items-center'>
          <HiOutlineBuildingOffice2 />
          Unit Section
        </div>

        <div className='flex gap-4'>
          <button 
            onClick={() => setShowAddFloorModal(true)}
            className='bg-white rounded-lg px-6 py-2 shadow-md hover:bg-gray-50 hover:translate-y-[-1px] hover:shadow-lg transition dulation-300 flex items-center gap-2'
          >
            <MdAdd size={20} />
            Add Floor
          </button>
          <button 
            onClick={() => setShowAddRoomModal(true)}
            className='bg-white rounded-lg px-6 py-2 shadow-md hover:bg-gray-50 hover:translate-y-[-1px] hover:shadow-lg transition dulation-300 flex items-center gap-2'
          >
            <MdAdd size={20} />
            Add Room
          </button>
        </div>
      </div>


      {/* Floor Section */}
      {Object.entries(unitsByFloor).map(([floor, units]) => {
        const vacantCount = units.filter(unit => unit.status === 'AVAILABLE').length;
        const occupiedCount = units.length - vacantCount;

        return (
          <div key={floor} className='bg-white rounded-lg p-8 shadow-md mb-6 lg:mb-8'>
            <div className="lg:text-xl text-lg font-medium mb-2">{floor}{floor == 1 ? 'st' : 'nd'} Floor</div>

            {/* Status */}
            <div className='text-sm mb-4'>
              <span className='text-green-600'>{vacantCount} vacants</span>, <span className='text-red-600'>{occupiedCount} occupied</span>
            </div>

            {/* Units */}
            <div className='grid grid-cols-2 lg:grid-cols-6 sm:grid-cols-3 md:grid-cols-4 gap-4'>
              {units.map(unit => (
                <div key={unit.id} className='relative group'>
                  <UnitCard unit={unit} />
                  <button
                    onClick={() => {
                      setSelectedUnit(unit);
                      setShowDeleteModal(true);
                    }}
                    className='absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add Floor Modal */}
      {showAddFloorModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center'>
              <h3 className='text-2xl font-semibold text-gray-800'>Add New Floor</h3>
              <button onClick={() => setShowAddFloorModal(false)}>
                <MdClose size={24} />
              </button>
            </div>

            <div className='p-6 space-y-6'>
              {/* Floor Number */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Floor Number <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  value={newFloorData.floorNumber}
                  onChange={(e) => setNewFloorData(prev => ({ ...prev, floorNumber: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  min='1'
                  step='1'
                  className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter floor number'
                />
              </div>

              {/* Rooms Section */}
              <div>
                <div className='flex justify-between items-center mb-4'>
                  <h4 className='text-lg font-semibold'>Rooms (At least 1 required)</h4>
                  <button
                    onClick={addRoomToFloor}
                    className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2'
                  >
                    <MdAdd size={20} />
                    Add Room
                  </button>
                </div>

                {newFloorData.rooms.map((room, index) => (
                  <div key={index} className='border rounded-lg p-4 mb-4'>
                    <div className='flex justify-between items-center mb-3'>
                      <span className='font-medium'>Room {index + 1}</span>
                      {newFloorData.rooms.length > 1 && (
                        <button
                          onClick={() => removeRoomFromFloor(index)}
                          className='text-red-600 hover:text-red-800'
                        >
                          <MdDelete size={20} />
                        </button>
                      )}
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Room Number <span className='text-red-500'>*</span>
                        </label>
                        <input
                          type='number'
                          value={room.roomNumber}
                          onChange={(e) => updateFloorRoom(index, 'roomNumber', e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault();
                            }
                          }}
                          min='1'
                          step='1'
                          className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                          placeholder='e.g., 101'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Type</label>
                        <select
                          value={room.type}
                          onChange={(e) => updateFloorRoom(index, 'type', e.target.value)}
                          className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                        >
                          <option value='Standard'>Standard</option>
                          <option value='Deluxe'>Deluxe</option>
                          <option value='Studio'>Studio</option>
                        </select>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Size (sqm) <span className='text-red-500'>*</span>
                        </label>
                        <input
                          type='number'
                          step='0.01'
                          min='0'
                          value={room.size}
                          onChange={(e) => updateFloorRoom(index, 'size', e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault();
                            }
                          }}
                          className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                          placeholder='e.g., 25.5'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Rent Amount (฿) <span className='text-red-500'>*</span>
                        </label>
                        <input
                          type='number'
                          min='0'
                          step='0.01'
                          value={room.rentAmount}
                          onChange={(e) => updateFloorRoom(index, 'rentAmount', e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault();
                            }
                          }}
                          className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                          placeholder='e.g., 5000'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className='flex gap-4 justify-end'>
                <button
                  onClick={() => setShowAddFloorModal(false)}
                  className='px-6 py-2 border rounded-lg hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFloor}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                >
                  Create Floor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-lg w-full'>
            <div className='border-b px-6 py-4 flex justify-between items-center'>
              <h3 className='text-2xl font-semibold text-gray-800'>Add New Room</h3>
              <button onClick={() => setShowAddRoomModal(false)}>
                <MdClose size={24} />
              </button>
            </div>

            <div className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Floor <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  value={newRoomData.floor}
                  onChange={(e) => setNewRoomData(prev => ({ ...prev, floor: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  min='1'
                  step='1'
                  className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter floor number'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Room Number <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  value={newRoomData.roomNumber}
                  onChange={(e) => setNewRoomData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  min='1'
                  step='1'
                  className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., 101'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Type</label>
                <select
                  value={newRoomData.type}
                  onChange={(e) => setNewRoomData(prev => ({ ...prev, type: e.target.value }))}
                  className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                >
                  <option value='Standard'>Standard</option>
                  <option value='Deluxe'>Deluxe</option>
                  <option value='Studio'>Studio</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Size (sqm) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  value={newRoomData.size}
                  onChange={(e) => setNewRoomData(prev => ({ ...prev, size: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., 25.5'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Rent Amount (฿) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  value={newRoomData.rentAmount}
                  onChange={(e) => setNewRoomData(prev => ({ ...prev, rentAmount: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., 5000'
                />
              </div>

              <div className='flex gap-4 justify-end pt-4'>
                <button
                  onClick={() => setShowAddRoomModal(false)}
                  className='px-6 py-2 border rounded-lg hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRoom}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                >
                  Create Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUnit && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-md w-full p-6'>
            <h3 className='text-xl font-semibold mb-4'>Delete Room</h3>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to delete room <span className='font-semibold'>{selectedUnit.roomNumber}</span>?
              This action cannot be undone.
            </p>
            <div className='flex gap-4 justify-end'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUnit(null);
                }}
                className='px-6 py-2 border rounded-lg hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUnit}
                className='px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
