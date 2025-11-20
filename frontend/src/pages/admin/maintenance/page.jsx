import React, { useState, useEffect } from 'react';
import StatCard from '../../../components/card/stat_card'
import { MdDone, MdOutlinePending, MdOutlineDoNotDisturb, MdSchedule, MdAdd } from "react-icons/md";
import { PiHammer } from "react-icons/pi";
import MaintenanceTable from '../../../components/table/maintenance_table';
import MaintenancePageSkeleton from '../../../components/skeleton/maintenance_page_skeleton';
import { getAllSchedules, createSchedule, updateSchedule, deleteSchedule, triggerSchedule, getScheduleAffectedUnits, triggerScheduleForUnit } from '../../../api/services/maintenanceSchedule.service';
import { getAllMaintenanceRequests } from '../../../api/services/maintenance.service';

function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    cancelled: 0,
    total: 0
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleDetails, setScheduleDetails] = useState(null);
  const [affectedUnits, setAffectedUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    recurrenceType: 'ONE_TIME',
    recurrenceInterval: 1,
    recurrenceDayOfWeek: null,
    recurrenceDayOfMonth: null,
    targetType: 'ALL_UNITS',
    targetUnits: null,
    startDate: '',
    endDate: null,
    nextTriggerDate: '',
    notifyDaysBefore: 3,
    estimatedCost: null,
    priority: 'MEDIUM',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesData, requestsData] = await Promise.all([
        getAllSchedules(),
        getAllMaintenanceRequests()
      ]);
      
      setSchedules(schedulesData);
      
      // Calculate stats
      const completed = requestsData.filter(r => r.status === 'COMPLETED').length;
      const cancelled = requestsData.filter(r => r.status === 'CANCELLED').length;
      const pending = requestsData.filter(r => 
        r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
      ).length;
      
      setStats({
        completed,
        pending,
        cancelled,
        total: requestsData.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = () => {
    setSelectedSchedule(null);
    setFormData({
      title: '',
      description: '',
      category: 'OTHER',
      recurrenceType: 'ONE_TIME',
      recurrenceInterval: 1,
      recurrenceDayOfWeek: null,
      recurrenceDayOfMonth: null,
      targetType: 'ALL_UNITS',
      targetUnits: null,
      startDate: '',
      endDate: null,
      nextTriggerDate: '',
      notifyDaysBefore: 3,
      estimatedCost: null,
      priority: 'MEDIUM',
      isActive: true
    });
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      title: schedule.title || '',
      description: schedule.description || '',
      category: schedule.category || 'OTHER',
      recurrenceType: schedule.recurrenceType || 'ONE_TIME',
      recurrenceInterval: schedule.recurrenceInterval || 1,
      recurrenceDayOfWeek: schedule.recurrenceDayOfWeek,
      recurrenceDayOfMonth: schedule.recurrenceDayOfMonth,
      targetType: schedule.targetType || 'ALL_UNITS',
      targetUnits: schedule.targetUnits 
        ? (typeof schedule.targetUnits === 'string' 
            ? schedule.targetUnits 
            : JSON.stringify(schedule.targetUnits))
        : null,
      startDate: schedule.startDate || '',
      endDate: schedule.endDate,
      nextTriggerDate: schedule.nextTriggerDate || '',
      notifyDaysBefore: schedule.notifyDaysBefore || 3,
      estimatedCost: schedule.estimatedCost,
      priority: schedule.priority || 'MEDIUM',
      isActive: schedule.isActive !== undefined ? schedule.isActive : true
    });
    setShowScheduleModal(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteSchedule(scheduleId);
        alert('Schedule deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Failed to delete schedule');
      }
    }
  };

  const handleTriggerSchedule = async (scheduleId) => {
    if (confirm('Trigger this schedule now? This will create maintenance requests for all target units and send notifications.')) {
      try {
        await triggerSchedule(scheduleId);
        alert('Schedule triggered successfully! Maintenance requests created and notifications sent to tenants.');
        fetchData();
      } catch (error) {
        console.error('Error triggering schedule:', error);
        alert('Failed to trigger schedule: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleViewDetail = async (schedule) => {
    setSelectedSchedule(schedule);
    setScheduleDetails(schedule);
    setShowDetailModal(true);
    setLoadingUnits(true);
    
    try {
      const units = await getScheduleAffectedUnits(schedule.id);
      setAffectedUnits(units);
    } catch (error) {
      console.error('Error fetching affected units:', error);
      alert('Failed to load affected units');
    } finally {
      setLoadingUnits(false);
    }
  };

  const getBookedTimeSlotsForUnit = (unitId, selectedDate) => {
    if (!selectedDate) return {};
    
    // Count bookings for each time slot on the selected date
    // EXCLUDING the current unit being edited
    const bookedSlots = {};
    
    affectedUnits.forEach(u => {
      // Skip the unit we're currently editing
      if (u.unitId === unitId) return;
      
      if (u.suggestedTime) {
        const suggestionDate = u.suggestedTime.split('T')[0];
        const suggestionTime = u.suggestedTime.split('T')[1]?.substring(0, 5);
        
        if (suggestionDate === selectedDate) {
          // Map time to slot range
          const timeSlots = {
            '08:00': '08:00',
            '10:00': '10:00',
            '13:00': '13:00',
            '15:00': '15:00',
            '17:00': '17:00'
          };
          
          if (timeSlots[suggestionTime]) {
            bookedSlots[timeSlots[suggestionTime]] = (bookedSlots[timeSlots[suggestionTime]] || 0) + 1;
          }
        }
      }
    });
    
    return bookedSlots;
  };

  const handleTriggerSingleUnit = async (unitId, preferredTime) => {
    if (confirm('Trigger maintenance for this unit?')) {
      try {
        await triggerScheduleForUnit(scheduleDetails.id, unitId, preferredTime);
        alert('Maintenance request created successfully!');
        // Refresh affected units
        const units = await getScheduleAffectedUnits(scheduleDetails.id);
        setAffectedUnits(units);
      } catch (error) {
        console.error('Error triggering unit:', error);
        alert('Failed to trigger maintenance: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleTriggerAll = async () => {
    if (confirm(`Trigger maintenance for all ${affectedUnits.length} units?`)) {
      try {
        await triggerSchedule(scheduleDetails.id);
        alert('Maintenance requests created for all units successfully!');
        setShowDetailModal(false);
        fetchData();
      } catch (error) {
        console.error('Error triggering all:', error);
        alert('Failed to trigger all: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleUpdateTimeSlot = (unitId, newTime) => {
    setAffectedUnits(prev => 
      prev.map(unit => 
        unit.unitId === unitId 
          ? { ...unit, suggestedTime: newTime }
          : unit
      )
    );
    setEditingTimeSlot(null);
  };

  const handleSaveSchedule = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.startDate || !formData.nextTriggerDate) {
        alert('Please fill in all required fields (Title, Start Date, Next Trigger Date)');
        return;
      }

      // Prepare data for backend
      let targetUnitsValue = null;
      if (formData.targetUnits && formData.targetType !== 'ALL_UNITS') {
        if (formData.targetType === 'SPECIFIC_UNITS') {
          // For SPECIFIC_UNITS, parse JSON array [1,2,3]
          try {
            targetUnitsValue = typeof formData.targetUnits === 'string' 
              ? JSON.parse(formData.targetUnits) 
              : formData.targetUnits;
          } catch (e) {
            alert('Invalid JSON format for Target Units. Example: [1,2,3]');
            return;
          }
        } else if (formData.targetType === 'FLOOR' || formData.targetType === 'UNIT_TYPE') {
          // For FLOOR or UNIT_TYPE, keep as string (backend will parse it)
          targetUnitsValue = formData.targetUnits.toString();
        }
      }

      // Build clean data object (exclude null/undefined values)
      const dataToSend = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        recurrenceType: formData.recurrenceType,
        recurrenceInterval: parseInt(formData.recurrenceInterval) || 1,
        targetType: formData.targetType,
        startDate: formData.startDate,
        nextTriggerDate: formData.nextTriggerDate,
        notifyDaysBefore: parseInt(formData.notifyDaysBefore) || 3,
        priority: formData.priority,
        isActive: true // Always active
      };

      // Add optional fields only if they have values
      if (targetUnitsValue !== null && targetUnitsValue !== undefined) {
        dataToSend.targetUnits = targetUnitsValue;
      }
      if (formData.recurrenceDayOfWeek) {
        dataToSend.recurrenceDayOfWeek = parseInt(formData.recurrenceDayOfWeek);
      }
      if (formData.recurrenceDayOfMonth) {
        dataToSend.recurrenceDayOfMonth = parseInt(formData.recurrenceDayOfMonth);
      }
      if (formData.endDate) {
        dataToSend.endDate = formData.endDate;
      }
      if (formData.estimatedCost) {
        dataToSend.estimatedCost = parseFloat(formData.estimatedCost);
      }

      console.log('Sending schedule data:', dataToSend);

      if (selectedSchedule) {
        await updateSchedule(selectedSchedule.id, dataToSend);
        alert('Schedule updated successfully');
      } else {
        await createSchedule(dataToSend);
        alert('Schedule created successfully');
      }
      setShowScheduleModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <MaintenancePageSkeleton />;
  }

  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='lg:mb-8 mb-6'>
        <h1 className='title'>
          Maintenance
        </h1>
      </div>

      {/* StatCard */}
      <div className='grid lg:grid-cols-4 grid-cols-1 lg:mb-6 mb-4 gap-4'>
        <StatCard icon={<MdDone />} title={"Completed"} value={`${stats.completed} Requests`} color={"green"} />
        <StatCard icon={<MdOutlinePending />} title={"Pending"} value={`${stats.pending} Requests`} color={"yellow"} />
        <StatCard icon={<MdOutlineDoNotDisturb />} title={"Cancelled"} value={`${stats.cancelled} Requests`} color={"red"} />
        <StatCard icon={<PiHammer />} title={"Total Maintenance"} value={`${stats.total} Requests`} color={"blue"}/>
      </div>

      {/* Maintenance Schedules Section */}
      <div className='mb-8 bg-white p-6 rounded-lg shadow'>
        <div className='flex justify-between items-center mb-4'>
          <div className='flex items-center gap-2'>
            <MdSchedule size={24} className='text-blue-600' />
            <h2 className='text-xl font-semibold'>Maintenance Schedules</h2>
            <span className='bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded'>
              {schedules.length} active
            </span>
          </div>
          <button
            onClick={handleCreateSchedule}
            className='flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition'
          >
            <MdAdd size={20} />
            Create Schedule
          </button>
        </div>

        {/* Schedules List */}
        {schedules.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            No maintenance schedules yet. Create one to automate recurring maintenance.
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Title</th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Category</th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Recurrence</th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Next Trigger</th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Status</th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-3 text-sm'>{schedule.title}</td>
                    <td className='px-4 py-3 text-sm'>
                      <span className='px-2 py-1 bg-gray-100 rounded text-xs'>
                        {schedule.category}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-sm'>{schedule.recurrenceType}</td>
                    <td className='px-4 py-3 text-sm'>
                      {new Date(schedule.nextTriggerDate).toLocaleDateString('th-TH')}
                    </td>
                    <td className='px-4 py-3 text-sm'>
                      {schedule.isActive ? (
                        schedule.isPaused ? (
                          <span className='px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs'>Paused</span>
                        ) : (
                          <span className='px-2 py-1 bg-green-100 text-green-800 rounded text-xs'>Active</span>
                        )
                      ) : (
                        <span className='px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs'>Inactive</span>
                      )}
                    </td>
                    <td className='px-4 py-3 text-sm'>
                      <div className='flex gap-2'>
                        {/* <button
                          onClick={() => handleViewDetail(schedule)}
                          className='text-indigo-600 hover:text-indigo-800 text-xs font-semibold'
                          title='View schedule details and manage time slots'
                        >
                          Detail
                        </button> */}
                        <button
                          onClick={() => handleTriggerSchedule(schedule.id)}
                          className='text-purple-600 hover:text-purple-800 text-xs font-semibold'
                          title='Trigger schedule now'
                        >
                          Trigger Now
                        </button>
                        <button
                          onClick={() => handleEditSchedule(schedule)}
                          className='text-blue-600 hover:text-blue-800 text-xs'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className='text-red-600 hover:text-red-800 text-xs'
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Maintenance Table */}
      <div>
        <MaintenanceTable />
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='sticky top-0 bg-white border-b px-6 py-4'>
              <h3 className='text-2xl font-semibold text-gray-800'>
                {selectedSchedule ? 'Edit Schedule' : 'Create Schedule'}
              </h3>
            </div>

            <div className='p-6 space-y-6'>
              {/* Basic Info */}
              <div className='space-y-4'>
                <h4 className='font-semibold text-gray-700'>Basic Information</h4>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Title <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='e.g., Monthly Air Conditioning Cleaning'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    rows='3'
                    placeholder='Describe the maintenance task...'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value='PLUMBING'>Plumbing</option>
                      <option value='ELECTRICAL'>Electrical</option>
                      <option value='HVAC'>HVAC</option>
                      <option value='APPLIANCE'>Appliance</option>
                      <option value='STRUCTURAL'>Structural</option>
                      <option value='CLEANING'>Cleaning</option>
                      <option value='OTHER'>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleFormChange('priority', e.target.value)}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value='LOW'>Low</option>
                      <option value='MEDIUM'>Medium</option>
                      <option value='HIGH'>High</option>
                      <option value='URGENT'>Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Recurrence Settings */}
              <div className='space-y-4 border-t pt-4'>
                <h4 className='font-semibold text-gray-700'>Recurrence Settings</h4>
                
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Recurrence Type <span className='text-red-500'>*</span>
                    </label>
                    <select
                      value={formData.recurrenceType}
                      onChange={(e) => handleFormChange('recurrenceType', e.target.value)}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value='ONE_TIME'>One Time</option>
                      <option value='DAILY'>Daily</option>
                      <option value='WEEKLY'>Weekly</option>
                      <option value='MONTHLY'>Monthly</option>
                      <option value='QUARTERLY'>Quarterly</option>
                      <option value='YEARLY'>Yearly</option>
                    </select>
                  </div>

                  {formData.recurrenceType !== 'ONE_TIME' && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Interval (Every X {formData.recurrenceType.toLowerCase()})
                      </label>
                      <input
                        type='number'
                        value={formData.recurrenceInterval}
                        onChange={(e) => handleFormChange('recurrenceInterval', parseInt(e.target.value))}
                        className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        min='1'
                      />
                    </div>
                  )}
                </div>

                {formData.recurrenceType === 'WEEKLY' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Day of Week (0=Sunday, 6=Saturday)
                    </label>
                    <input
                      type='number'
                      value={formData.recurrenceDayOfWeek || ''}
                      onChange={(e) => handleFormChange('recurrenceDayOfWeek', e.target.value ? parseInt(e.target.value) : null)}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      min='0'
                      max='6'
                      placeholder='0-6'
                    />
                  </div>
                )}

                {formData.recurrenceType === 'MONTHLY' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Day of Month (1-31)
                    </label>
                    <input
                      type='number'
                      value={formData.recurrenceDayOfMonth || ''}
                      onChange={(e) => handleFormChange('recurrenceDayOfMonth', e.target.value ? parseInt(e.target.value) : null)}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      min='1'
                      max='31'
                      placeholder='1-31'
                    />
                  </div>
                )}
              </div>

              {/* Target Settings */}
              <div className='space-y-4 border-t pt-4'>
                <h4 className='font-semibold text-gray-700'>Target Units</h4>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Target Type</label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => handleFormChange('targetType', e.target.value)}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='ALL_UNITS'>All Units</option>
                    <option value='SPECIFIC_UNITS'>Specific Units</option>
                    <option value='FLOOR'>By Floor</option>
                    <option value='UNIT_TYPE'>By Unit Type</option>
                  </select>
                </div>

                {formData.targetType !== 'ALL_UNITS' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Target Value (JSON format)
                    </label>
                    <input
                      type='text'
                      value={formData.targetUnits || ''}
                      onChange={(e) => handleFormChange('targetUnits', e.target.value)}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm'
                      placeholder='e.g., [1,2,3] for unit IDs or 2 for floor'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      Examples: [1,2,3] for specific units, 2 for floor 2
                    </p>
                  </div>
                )}
              </div>

              {/* Schedule Dates */}
              <div className='space-y-4 border-t pt-4'>
                <h4 className='font-semibold text-gray-700'>Schedule Dates</h4>
                
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Start Date <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      value={formData.startDate}
                      onChange={(e) => handleFormChange('startDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      End Date (optional)
                    </label>
                    <input
                      type='date'
                      value={formData.endDate || ''}
                      onChange={(e) => handleFormChange('endDate', e.target.value || null)}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Next Trigger Date <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='date'
                    value={formData.nextTriggerDate}
                    onChange={(e) => handleFormChange('nextTriggerDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Date when maintenance requests will be created for selected units.
                  </p>
                </div>
              </div>

              {/* Settings */}
              <div className='space-y-4 border-t pt-4'>
                <h4 className='font-semibold text-gray-700'>Settings</h4>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Notify Tenants (days before)
                  </label>
                  <input
                    type='number'
                    value={formData.notifyDaysBefore}
                    onChange={(e) => handleFormChange('notifyDaysBefore', parseInt(e.target.value))}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    min='0'
                    max='30'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Tenants will be notified this many days before maintenance.
                  </p>
                </div>

                {/* Commented out: Estimated Cost - Not used yet
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Estimated Cost (฿)
                  </label>
                  <input
                    type='number'
                    value={formData.estimatedCost || ''}
                    onChange={(e) => handleFormChange('estimatedCost', e.target.value ? parseFloat(e.target.value) : null)}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    step='0.01'
                    min='0'
                  />
                </div>
                */}
              </div>
            </div>

            <div className='sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3 justify-end'>
              <button
                onClick={() => setShowScheduleModal(false)}
                className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
              >
                {selectedSchedule ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Detail Modal */}
      {showDetailModal && scheduleDetails && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='sticky top-0 bg-white border-b px-6 py-4'>
              <h3 className='text-2xl font-semibold text-gray-800'>
                Schedule Details: {scheduleDetails.title}
              </h3>
              <p className='text-sm text-gray-500 mt-1'>
                Manage maintenance schedule and time slots for affected units
              </p>
            </div>

            <div className='p-6 space-y-6'>
              {/* Schedule Info */}
              <div className='bg-gray-50 p-4 rounded-lg'>
                <h4 className='font-semibold text-gray-700 mb-3'>Schedule Information</h4>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-600'>Category:</span>
                    <p className='font-medium'>{scheduleDetails.category}</p>
                  </div>
                  <div>
                    <span className='text-gray-600'>Recurrence:</span>
                    <p className='font-medium'>{scheduleDetails.recurrenceType}</p>
                  </div>
                  <div>
                    <span className='text-gray-600'>Priority:</span>
                    <p className='font-medium'>{scheduleDetails.priority}</p>
                  </div>
                  <div>
                    <span className='text-gray-600'>Next Trigger:</span>
                    <p className='font-medium'>
                      {new Date(scheduleDetails.nextTriggerDate).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className='text-gray-600'>Target Type:</span>
                    <p className='font-medium'>{scheduleDetails.targetType}</p>
                  </div>
                  <div>
                    <span className='text-gray-600'>Estimated Cost:</span>
                    <p className='font-medium'>
                      {scheduleDetails.estimatedCost ? `฿${parseFloat(scheduleDetails.estimatedCost).toLocaleString()}` : '-'}
                    </p>
                  </div>
                </div>
                {scheduleDetails.description && (
                  <div className='mt-3 pt-3 border-t'>
                    <span className='text-gray-600 text-sm'>Description:</span>
                    <p className='text-sm mt-1'>{scheduleDetails.description}</p>
                  </div>
                )}
              </div>

              {/* Time Slot Management Info */}
              <div className='bg-blue-50 border border-blue-200 p-4 rounded-lg'>
                <h4 className='font-semibold text-blue-800 mb-2'>⏰ Time Slot Management</h4>
                <p className='text-sm text-blue-700 mb-3'>
                  System automatically generates available time slots:
                </p>
                <ul className='text-sm text-blue-700 space-y-1 ml-4'>
                  <li>• Suggests times that don't conflict with existing bookings</li>
                  <li>• Click "Edit" to manually change the time for any unit</li>
                  <li>• Trigger individual units or use "Trigger All" for batch processing</li>
                  <li>• Tenants will be notified with the scheduled date and time</li>
                </ul>
              </div>

              {/* Affected Units List */}
              <div>
                <div className='flex justify-between items-center mb-3'>
                  <h4 className='font-semibold text-gray-700'>
                    Affected Units ({affectedUnits.length})
                  </h4>
                  {affectedUnits.length > 0 && (
                    <button
                      onClick={handleTriggerAll}
                      className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm'
                    >
                      🚀 Trigger All Units
                    </button>
                  )}
                </div>

                {loadingUnits ? (
                  <div className='text-center py-8 text-gray-500'>
                    Loading affected units...
                  </div>
                ) : affectedUnits.length === 0 ? (
                  <div className='text-center py-8 text-gray-500 bg-gray-50 rounded-lg'>
                    No occupied units found for this schedule
                  </div>
                ) : (
                  <div className='border rounded-lg overflow-hidden'>
                    <table className='w-full'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-600'>Unit</th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-600'>Tenant</th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-600'>Preferred Date & Time</th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-600'>Status</th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-600'>Action</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-200'>
                        {affectedUnits.map((unit) => (
                          <tr key={unit.unitId} className='hover:bg-gray-50'>
                            <td className='px-4 py-3 text-sm font-medium'>
                              Room {unit.roomNumber}
                            </td>
                            <td className='px-4 py-3 text-sm'>
                              {unit.tenantName || '-'}
                            </td>
                            <td className='px-4 py-3 text-sm'>
                              {editingTimeSlot === unit.unitId ? (
                                <div className='flex gap-2 items-center'>
                                  <div className='flex flex-col gap-1'>
                                    <input
                                      type='date'
                                      defaultValue={unit.suggestedTime ? unit.suggestedTime.split('T')[0] : ''}
                                      onChange={(e) => {
                                        const date = e.target.value;
                                        const time = unit.suggestedTime ? unit.suggestedTime.split('T')[1]?.substring(0, 5) : '08:00';
                                        handleUpdateTimeSlot(unit.unitId, `${date}T${time}`);
                                      }}
                                      min={new Date().toISOString().split('T')[0]}
                                      className='px-2 py-1 border rounded text-sm'
                                    />
                                    <select
                                      value={unit.suggestedTime ? unit.suggestedTime.split('T')[1]?.substring(0, 5) : '08:00'}
                                      onChange={(e) => {
                                        const date = unit.suggestedTime ? unit.suggestedTime.split('T')[0] : new Date().toISOString().split('T')[0];
                                        handleUpdateTimeSlot(unit.unitId, `${date}T${e.target.value}`);
                                      }}
                                      className='px-2 py-1 border rounded text-sm'
                                    >
                                      {(() => {
                                        const selectedDate = unit.suggestedTime ? unit.suggestedTime.split('T')[0] : new Date().toISOString().split('T')[0];
                                        const bookedSlots = getBookedTimeSlotsForUnit(unit.unitId, selectedDate);
                                        const currentTime = unit.suggestedTime ? unit.suggestedTime.split('T')[1]?.substring(0, 5) : null;
                                        
                                        const timeSlots = [
                                          { value: '08:00', label: '08:00 - 10:00 AM' },
                                          { value: '10:00', label: '10:00 - 12:00 PM' },
                                          { value: '13:00', label: '01:00 - 03:00 PM' },
                                          { value: '15:00', label: '03:00 - 05:00 PM' },
                                          { value: '17:00', label: '05:00 - 07:00 PM' }
                                        ];
                                        
                                        return timeSlots.map(slot => {
                                          const bookingCount = bookedSlots[slot.value] || 0;
                                          // Disable if OTHER units have booked this slot (booking count > 0)
                                          const isDisabled = bookingCount >= 1;
                                          
                                          return (
                                            <option 
                                              key={slot.value} 
                                              value={slot.value}
                                              disabled={isDisabled}
                                              style={isDisabled ? { 
                                                backgroundColor: '#fee', 
                                                color: '#999',
                                                cursor: 'not-allowed' 
                                              } : {}}
                                            >
                                              {slot.label} {isDisabled ? '(Booked - Unavailable)' : '(Available)'}
                                            </option>
                                          );
                                        });
                                      })()}
                                    </select>
                                  </div>
                                  <button
                                    onClick={() => setEditingTimeSlot(null)}
                                    className='text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700'
                                  >
                                    ✓
                                  </button>
                                </div>
                              ) : (
                                <div className='flex gap-2 items-center'>
                                  <span className={unit.hasConflict ? 'text-red-600 font-medium' : ''}>
                                    {unit.suggestedTime ? new Date(unit.suggestedTime).toLocaleString('th-TH', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'Not set'}
                                  </span>
                                  {unit.hasConflict && (
                                    <span className='text-xs text-red-600'>⚠️ Conflict</span>
                                  )}
                                  <button
                                    onClick={() => setEditingTimeSlot(unit.unitId)}
                                    className='text-xs text-blue-600 hover:text-blue-800 ml-2'
                                  >
                                    ✏️ Edit
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className='px-4 py-3 text-sm'>
                              {unit.alreadyTriggered ? (
                                <span className='px-2 py-1 bg-green-100 text-green-800 rounded text-xs'>
                                  ✓ Triggered
                                </span>
                              ) : (
                                <span className='px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs'>
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className='px-4 py-3 text-sm'>
                              {!unit.alreadyTriggered && (
                                <button
                                  onClick={() => handleTriggerSingleUnit(unit.unitId, unit.suggestedTime)}
                                  className='text-purple-600 hover:text-purple-800 text-xs font-semibold'
                                >
                                  Trigger
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className='bg-gray-50 p-4 rounded-lg'>
                <div className='flex flex-wrap gap-3'>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEditSchedule(scheduleDetails);
                    }}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
                  >
                    Edit Schedule
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium'
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaintenancePage