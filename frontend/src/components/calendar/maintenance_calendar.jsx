import React, { useState, useEffect } from 'react';
import { MdChevronLeft, MdChevronRight, MdWarning, MdCheckCircle } from 'react-icons/md';
import { getAllMaintenanceRequests } from '../../api/services/maintenance.service';

function MaintenanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayRequests, setDayRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllMaintenanceRequests();
      // Filter only requests with preferred time and not cancelled
      const filtered = data.filter(req => 
        req.preferredTime && 
        req.status !== 'CANCELLED' &&
        req.status !== 'COMPLETED'
      );
      setRequests(filtered);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getRequestsForDate = (date) => {
    if (!date) return [];
    
    return requests.filter(req => {
      const preferredDate = parsePreferredTime(req.preferredTime);
      if (!preferredDate) return false;
      
      return (
        preferredDate.getDate() === date.getDate() &&
        preferredDate.getMonth() === date.getMonth() &&
        preferredDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const parsePreferredTime = (timeString) => {
    if (!timeString) return null;
    
    try {
      // Handle various date formats
      // Example: "2025-11-20 14:00" or "20/11/2025 14:00"
      const parts = timeString.trim().split(/[\s,]+/);
      if (parts.length === 0) return null;
      
      const datePart = parts[0];
      
      // Try different date formats
      if (datePart.includes('-')) {
        return new Date(datePart);
      } else if (datePart.includes('/')) {
        const [day, month, year] = datePart.split('/');
        return new Date(year, month - 1, day);
      }
      
      return new Date(timeString);
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  const hasTimeConflict = (date) => {
    const dayReqs = getRequestsForDate(date);
    if (dayReqs.length <= 1) return false;
    
    // Check if any times overlap
    const times = dayReqs.map(req => {
      const time = req.preferredTime.match(/\d{1,2}:\d{2}/);
      return time ? time[0] : null;
    }).filter(Boolean);
    
    // If 2+ requests have same time slot, it's a conflict
    const uniqueTimes = new Set(times);
    return times.length > uniqueTimes.size;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setDayRequests(getRequestsForDate(date));
  };

  const getStatusColor = (status) => {
    const colors = {
      'SUBMITTED': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'WAITING_FOR_REPAIR': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className='flex items-center justify-center p-12'>
        <div className='text-gray-500'>Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow overflow-hidden'>
      {/* Calendar Header */}
      <div className='bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-2xl font-bold'>Maintenance Schedule Calendar</h3>
          <div className='flex gap-2'>
            <div className='flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-lg'>
              <MdCheckCircle /> Available
            </div>
            <div className='flex items-center gap-2 text-sm bg-red-500/30 px-3 py-1 rounded-lg'>
              <MdWarning /> Conflict
            </div>
          </div>
        </div>
        
        <div className='flex items-center justify-between'>
          <button
            onClick={handlePrevMonth}
            className='p-2 hover:bg-white/20 rounded-lg transition'
          >
            <MdChevronLeft size={24} />
          </button>
          
          <h4 className='text-xl font-semibold'>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          
          <button
            onClick={handleNextMonth}
            className='p-2 hover:bg-white/20 rounded-lg transition'
          >
            <MdChevronRight size={24} />
          </button>
        </div>
      </div>

      <div className='p-6'>
        <div className='grid grid-cols-7 gap-2'>
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} className='text-center font-semibold text-gray-700 py-2'>
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className='aspect-square' />;
            }

            const dayReqs = getRequestsForDate(date);
            const hasConflict = hasTimeConflict(date);
            const isToday = 
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();
            const isSelected = selectedDate &&
              date.getDate() === selectedDate.getDate() &&
              date.getMonth() === selectedDate.getMonth();

            // Extract times for this day
            const times = dayReqs.map(req => {
              const timeMatch = req.preferredTime?.match(/\d{1,2}:\d{2}/);
              return timeMatch ? timeMatch[0] : null;
            }).filter(Boolean);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  border-2 rounded-lg p-2 hover:border-blue-500 transition min-h-[100px]
                  ${isToday ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}
                  ${dayReqs.length > 0 ? (hasConflict ? 'bg-red-50' : 'bg-green-50') : ''}
                `}
              >
                <div className='flex flex-col h-full text-left'>
                  <div className='text-right font-semibold text-gray-900 mb-2'>
                    {date.getDate()}
                  </div>
                  {dayReqs.length > 0 && (
                    <div className='space-y-1 flex-1'>
                      {times.slice(0, 3).map((time, idx) => (
                        <div key={idx} className={`
                          text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium
                          ${hasConflict && times.filter(t => t === time).length > 1 
                            ? 'bg-red-500 text-white' 
                            : 'bg-blue-600 text-white'}
                        `}>
                          {hasConflict && times.filter(t => t === time).length > 1 && <MdWarning size={12} />}
                          🕐 {time}
                        </div>
                      ))}
                      {times.length > 3 && (
                        <div className='text-xs text-gray-600 font-medium px-2'>
                          +{times.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Details */}
        {selectedDate && dayRequests.length > 0 && (
          <div className='mt-6 border-t pt-6'>
            <h4 className='font-semibold text-lg mb-4'>
              Maintenance Requests for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
            
            <div className='space-y-3'>
              {dayRequests
                .sort((a, b) => {
                  // Sort by time
                  const timeA = a.preferredTime?.match(/\d{1,2}:\d{2}/)?.[0] || '99:99';
                  const timeB = b.preferredTime?.match(/\d{1,2}:\d{2}/)?.[0] || '99:99';
                  return timeA.localeCompare(timeB);
                })
                .map((req, idx) => {
                  const timeMatch = req.preferredTime?.match(/\d{1,2}:\d{2}/);
                  const time = timeMatch ? timeMatch[0] : 'N/A';
                  
                  // Check if this time conflicts with another
                  const conflictCount = dayRequests.filter(r => 
                    r.preferredTime?.includes(time)
                  ).length;
                  const hasTimeConflict = conflictCount > 1;

                  return (
                    <div key={req.id} className={`
                      border rounded-lg p-4 transition
                      ${hasTimeConflict 
                        ? 'bg-red-50 border-red-300 shadow-lg' 
                        : 'bg-gray-50 border-gray-200'}
                    `}>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-3'>
                            {hasTimeConflict && (
                              <MdWarning className='text-red-600' size={20} />
                            )}
                            <h5 className='font-semibold text-gray-900'>{req.title}</h5>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(req.status)}`}>
                              {req.status}
                            </span>
                          </div>
                          
                          {/* Time Display - Large and Prominent */}
                          <div className={`
                            mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg
                            ${hasTimeConflict 
                              ? 'bg-red-500 text-white' 
                              : 'bg-blue-600 text-white'}
                          `}>
                            🕐 {time}
                            {hasTimeConflict && (
                              <span className='text-sm font-normal'>
                                (⚠️ {conflictCount} conflicts)
                              </span>
                            )}
                          </div>
                          
                          <div className='grid grid-cols-2 gap-2 text-sm text-gray-600'>
                            <div>
                              <span className='font-medium'>Room:</span> {req.roomNumber}
                            </div>
                            <div>
                              <span className='font-medium'>Tenant:</span> {req.tenantName}
                            </div>
                            <div>
                              <span className='font-medium'>Category:</span> {req.category}
                            </div>
                            <div>
                              <span className='font-medium'>Priority:</span> {req.priority}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {selectedDate && dayRequests.length === 0 && (
          <div className='mt-6 border-t pt-6 text-center text-gray-500'>
            No maintenance requests scheduled for this date
          </div>
        )}
      </div>
    </div>
  );
}

export default MaintenanceCalendar;
